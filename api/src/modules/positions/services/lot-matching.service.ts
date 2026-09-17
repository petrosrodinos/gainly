import { Injectable } from '@nestjs/common';
import { CorporateActionType, CostBasisMethod, Prisma, TransactionType } from 'generated/prisma';
import { toDecimal, ZERO } from '@/shared/utils/money/money.utils';
import {
    DisposalResult,
    OpenLotResult,
    ReplayCorporateAction,
    ReplayResult,
    ReplayTransaction,
} from '../interfaces/lot-matching.interface';

interface WorkingLot {
    instrument_uuid: string;
    open_transaction_uuid: string;
    quantity_remaining: Prisma.Decimal;
    quantity_original: Prisma.Decimal;
    cost_basis_per_unit: Prisma.Decimal;
    opened_at: Date;
}

/**
 * Pure, stateless replay of an account's BUY/SELL ledger into open lots + realized disposals.
 * Never mutates the DB — callers persist whatever slice of the result they need. Re-run from
 * scratch on every call so cost-basis method (FIFO/LIFO/AVERAGE_COST) never has to be stored
 * per-lot; it's purely a parameter of the replay.
 */
@Injectable()
export class LotMatchingService {
    replay(
        transactions: ReplayTransaction[],
        corporateActions: ReplayCorporateAction[],
        method: CostBasisMethod,
    ): ReplayResult {
        const warnings: string[] = [];
        const byInstrument = new Map<string, ReplayTransaction[]>();

        for (const tx of transactions) {
            if (tx.type !== TransactionType.BUY && tx.type !== TransactionType.SELL) continue;
            if (!byInstrument.has(tx.instrument_uuid)) byInstrument.set(tx.instrument_uuid, []);
            byInstrument.get(tx.instrument_uuid).push(tx);
        }

        const openLots: OpenLotResult[] = [];
        const disposals: DisposalResult[] = [];

        for (const [instrumentUuid, instrumentTxs] of byInstrument) {
            const sorted = [...instrumentTxs].sort((a, b) => a.trade_date.getTime() - b.trade_date.getTime());
            const actions = corporateActions
                .filter((a) => a.instrument_uuid === instrumentUuid)
                .sort((a, b) => a.effective_date.getTime() - b.effective_date.getTime());

            const lots: WorkingLot[] = [];

            for (const tx of sorted) {
                if (tx.type === TransactionType.BUY) {
                    const rawQuantity = toDecimal(tx.quantity);
                    if (rawQuantity.isZero()) {
                        warnings.push(`BUY transaction ${tx.id} has no quantity — skipped`);
                        continue;
                    }

                    const { quantity, costBasisPerUnit } = this.applySplitsToOpen(
                        rawQuantity,
                        toDecimal(tx.amount).plus(toDecimal(tx.fee)).dividedBy(rawQuantity),
                        tx.trade_date,
                        actions,
                    );

                    lots.push({
                        instrument_uuid: instrumentUuid,
                        open_transaction_uuid: tx.id,
                        quantity_remaining: quantity,
                        quantity_original: quantity,
                        cost_basis_per_unit: costBasisPerUnit,
                        opened_at: tx.trade_date,
                    });
                    continue;
                }

                // SELL
                let quantityToSell = toDecimal(tx.quantity);
                if (quantityToSell.isZero()) {
                    warnings.push(`SELL transaction ${tx.id} has no quantity — skipped`);
                    continue;
                }

                const proceeds = toDecimal(tx.amount).minus(toDecimal(tx.fee));
                const proceedsPerUnit = proceeds.dividedBy(quantityToSell);

                const candidates = this.openLotsForConsumption(lots, method);

                for (const lot of candidates) {
                    if (quantityToSell.lessThanOrEqualTo(ZERO)) break;
                    if (lot.quantity_remaining.lessThanOrEqualTo(ZERO)) continue;

                    const consumed = Prisma.Decimal.min(lot.quantity_remaining, quantityToSell);
                    const costBasis = consumed.times(lot.cost_basis_per_unit);
                    const disposalProceeds = consumed.times(proceedsPerUnit);

                    disposals.push({
                        instrument_uuid: instrumentUuid,
                        close_transaction_uuid: tx.id,
                        open_transaction_uuid: lot.open_transaction_uuid,
                        quantity: consumed,
                        proceeds: disposalProceeds,
                        cost_basis: costBasis,
                        gain_loss: disposalProceeds.minus(costBasis),
                        currency: tx.currency,
                        acquired_at: lot.opened_at,
                        disposed_at: tx.trade_date,
                        holding_period_days: Math.round(
                            (tx.trade_date.getTime() - lot.opened_at.getTime()) / (1000 * 60 * 60 * 24),
                        ),
                    });

                    lot.quantity_remaining = lot.quantity_remaining.minus(consumed);
                    quantityToSell = quantityToSell.minus(consumed);
                }

                if (quantityToSell.greaterThan(ZERO)) {
                    warnings.push(
                        `SELL transaction ${tx.id} sold ${quantityToSell.toString()} more units of instrument ${instrumentUuid} than were held open — treated as zero cost basis`,
                    );
                    disposals.push({
                        instrument_uuid: instrumentUuid,
                        close_transaction_uuid: tx.id,
                        open_transaction_uuid: null,
                        quantity: quantityToSell,
                        proceeds: quantityToSell.times(proceedsPerUnit),
                        cost_basis: ZERO,
                        gain_loss: quantityToSell.times(proceedsPerUnit),
                        currency: tx.currency,
                        acquired_at: tx.trade_date,
                        disposed_at: tx.trade_date,
                        holding_period_days: 0,
                    });
                }
            }

            for (const lot of lots) {
                if (lot.quantity_remaining.greaterThan(ZERO)) {
                    openLots.push({
                        instrument_uuid: lot.instrument_uuid,
                        open_transaction_uuid: lot.open_transaction_uuid,
                        quantity_remaining: lot.quantity_remaining,
                        cost_basis_per_unit: lot.cost_basis_per_unit,
                        opened_at: lot.opened_at,
                    });
                }
            }
        }

        return { openLots, disposals, warnings };
    }

    private openLotsForConsumption(lots: WorkingLot[], method: CostBasisMethod): WorkingLot[] {
        const open = lots.filter((l) => l.quantity_remaining.greaterThan(ZERO));

        if (method === CostBasisMethod.LIFO) {
            return [...open].sort((a, b) => b.opened_at.getTime() - a.opened_at.getTime());
        }

        if (method === CostBasisMethod.AVERAGE_COST) {
            const totalQuantity = open.reduce((acc, l) => acc.plus(l.quantity_remaining), ZERO);
            if (totalQuantity.isZero()) return open;

            const totalCost = open.reduce((acc, l) => acc.plus(l.quantity_remaining.times(l.cost_basis_per_unit)), ZERO);
            const avgCost = totalCost.dividedBy(totalQuantity);
            for (const lot of open) lot.cost_basis_per_unit = avgCost;

            return [...open].sort((a, b) => a.opened_at.getTime() - b.opened_at.getTime());
        }

        // FIFO (default)
        return [...open].sort((a, b) => a.opened_at.getTime() - b.opened_at.getTime());
    }

    private applySplitsToOpen(
        quantity: Prisma.Decimal,
        costBasisPerUnit: Prisma.Decimal,
        openedAt: Date,
        actions: ReplayCorporateAction[],
    ): { quantity: Prisma.Decimal; costBasisPerUnit: Prisma.Decimal } {
        let adjustedQuantity = quantity;
        let adjustedCost = costBasisPerUnit;

        for (const action of actions) {
            if (action.effective_date.getTime() <= openedAt.getTime()) continue;
            if (!action.ratio) continue;

            if (action.type === CorporateActionType.SPLIT) {
                adjustedQuantity = adjustedQuantity.times(action.ratio);
                adjustedCost = adjustedCost.dividedBy(action.ratio);
            } else if (action.type === CorporateActionType.REVERSE_SPLIT) {
                adjustedQuantity = adjustedQuantity.dividedBy(action.ratio);
                adjustedCost = adjustedCost.times(action.ratio);
            }
        }

        return { quantity: adjustedQuantity, costBasisPerUnit: adjustedCost };
    }
}
