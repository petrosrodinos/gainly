import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CostBasisMethod, Prisma } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { POSITIONS_RECOMPUTE_QUEUE } from '@/core/queues/queues.constants';
import { toDecimal, ZERO } from '@/shared/utils/money/money.utils';
import { LotMatchingService } from './services/lot-matching.service';
import { PositionSnapshotQueryType } from './dto/snapshot-query.schema';
import { ReplayCorporateAction, ReplayTransaction } from './interfaces/lot-matching.interface';

@Injectable()
export class PositionsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly lotMatchingService: LotMatchingService,
        @InjectQueue(POSITIONS_RECOMPUTE_QUEUE) private readonly recomputeQueue: Queue,
    ) { }

    /**
     * Only the current version of each logical ledger entry — a row superseded by a correction
     * (spec §4) is excluded from computation while remaining in the DB for audit history.
     */
    async getActiveTransactions(accountUuid: string, upToDate?: Date): Promise<ReplayTransaction[]> {
        const rows = await this.prisma.transaction.findMany({
            where: {
                account_uuid: accountUuid,
                superseded_by: null,
                instrument_uuid: { not: null },
                ...(upToDate && { trade_date: { lte: upToDate } }),
            },
        });

        return rows.map((r) => ({
            id: r.id,
            instrument_uuid: r.instrument_uuid,
            type: r.type,
            trade_date: r.trade_date,
            quantity: r.quantity,
            amount: r.amount,
            fee: r.fee,
            currency: r.currency,
        }));
    }

    async getCorporateActions(instrumentUuids: string[]): Promise<ReplayCorporateAction[]> {
        if (instrumentUuids.length === 0) return [];
        const rows = await this.prisma.corporateAction.findMany({
            where: { instrument_uuid: { in: instrumentUuids } },
        });
        return rows.map((r) => ({
            instrument_uuid: r.instrument_uuid,
            type: r.type,
            effective_date: r.effective_date,
            ratio: r.ratio,
        }));
    }

    async enqueueRecompute(accountUuid: string) {
        await this.recomputeQueue.add('recompute', { accountUuid });
    }

    async recomputeForAccount(accountUuid: string) {
        const account = await this.prisma.account.findUnique({ where: { id: accountUuid } });
        if (!account) throw new NotFoundException('Account not found');

        const transactions = await this.getActiveTransactions(accountUuid);
        const instrumentUuids = [...new Set(transactions.map((t) => t.instrument_uuid))];
        const corporateActions = await this.getCorporateActions(instrumentUuids);

        const { openLots, warnings } = this.lotMatchingService.replay(transactions, corporateActions, CostBasisMethod.FIFO);

        const openByInstrument = new Map<string, { quantity: Prisma.Decimal; costBasis: Prisma.Decimal }>();
        for (const lot of openLots) {
            const existing = openByInstrument.get(lot.instrument_uuid) ?? { quantity: ZERO, costBasis: ZERO };
            existing.quantity = existing.quantity.plus(lot.quantity_remaining);
            existing.costBasis = existing.costBasis.plus(lot.quantity_remaining.times(lot.cost_basis_per_unit));
            openByInstrument.set(lot.instrument_uuid, existing);
        }

        const latestPrices = instrumentUuids.length
            ? await this.prisma.priceSnapshot.findMany({
                where: { instrument_uuid: { in: instrumentUuids } },
                orderBy: { date: 'desc' },
            })
            : [];
        const latestPriceByInstrument = new Map<string, Prisma.Decimal>();
        for (const price of latestPrices) {
            if (!latestPriceByInstrument.has(price.instrument_uuid)) {
                latestPriceByInstrument.set(price.instrument_uuid, price.price);
            }
        }

        const asOfDate = new Date(new Date().toISOString().slice(0, 10));

        await this.prisma.$transaction(async (tx) => {
            await tx.lot.deleteMany({ where: { account_uuid: accountUuid } });

            if (openLots.length > 0) {
                await tx.lot.createMany({
                    data: openLots.map((lot) => ({
                        account_uuid: accountUuid,
                        instrument_uuid: lot.instrument_uuid,
                        open_transaction_uuid: lot.open_transaction_uuid,
                        quantity_remaining: lot.quantity_remaining,
                        cost_basis_per_unit: lot.cost_basis_per_unit,
                        opened_at: lot.opened_at,
                    })),
                });
            }

            for (const instrumentUuid of instrumentUuids) {
                const position = openByInstrument.get(instrumentUuid) ?? { quantity: ZERO, costBasis: ZERO };
                const price = latestPriceByInstrument.get(instrumentUuid);

                await tx.positionSnapshot.upsert({
                    where: {
                        account_uuid_instrument_uuid_as_of_date: {
                            account_uuid: accountUuid,
                            instrument_uuid: instrumentUuid,
                            as_of_date: asOfDate,
                        },
                    },
                    create: {
                        account_uuid: accountUuid,
                        instrument_uuid: instrumentUuid,
                        as_of_date: asOfDate,
                        quantity: position.quantity,
                        cost_basis: position.costBasis,
                        market_value: price ? position.quantity.times(price) : null,
                    },
                    update: {
                        quantity: position.quantity,
                        cost_basis: position.costBasis,
                        market_value: price ? position.quantity.times(price) : null,
                        computed_at: new Date(),
                    },
                });
            }
        });

        return { instruments_updated: instrumentUuids.length, warnings };
    }

    async getHoldings(accountUuid: string) {
        const latestDate = await this.prisma.positionSnapshot.findFirst({
            where: { account_uuid: accountUuid },
            orderBy: { as_of_date: 'desc' },
            select: { as_of_date: true },
        });

        if (!latestDate) return { as_of_date: null, holdings: [], allocation: { by_asset_class: [], by_currency: [] } };

        const snapshots = await this.prisma.positionSnapshot.findMany({
            where: { account_uuid: accountUuid, as_of_date: latestDate.as_of_date, quantity: { gt: 0 } },
            include: { instrument: true },
        });

        const totalValue = snapshots.reduce(
            (acc, s) => acc.plus(toDecimal(s.market_value ?? s.cost_basis)),
            ZERO,
        );

        const byAssetClass = new Map<string, Prisma.Decimal>();
        const byCurrency = new Map<string, Prisma.Decimal>();
        for (const s of snapshots) {
            const value = toDecimal(s.market_value ?? s.cost_basis);
            byAssetClass.set(s.instrument.asset_class, (byAssetClass.get(s.instrument.asset_class) ?? ZERO).plus(value));
            byCurrency.set(s.instrument.currency, (byCurrency.get(s.instrument.currency) ?? ZERO).plus(value));
        }

        const toAllocation = (map: Map<string, Prisma.Decimal>) =>
            [...map.entries()].map(([key, value]) => ({
                key,
                value,
                percentage: totalValue.isZero() ? 0 : value.dividedBy(totalValue).times(100).toNumber(),
            }));

        return {
            as_of_date: latestDate.as_of_date,
            holdings: snapshots,
            allocation: {
                by_asset_class: toAllocation(byAssetClass),
                by_currency: toAllocation(byCurrency),
            },
        };
    }

    async getSnapshotHistory(accountUuid: string, query: PositionSnapshotQueryType) {
        return this.prisma.positionSnapshot.findMany({
            where: {
                account_uuid: accountUuid,
                ...(query.instrument_uuid && { instrument_uuid: query.instrument_uuid }),
                ...((query.from || query.to) && {
                    as_of_date: {
                        ...(query.from && { gte: new Date(query.from) }),
                        ...(query.to && { lte: new Date(query.to) }),
                    },
                }),
            },
            include: { instrument: true },
            orderBy: { as_of_date: 'asc' },
        });
    }
}
