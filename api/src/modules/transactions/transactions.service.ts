import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PositionsService } from '../positions/positions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CorrectTransactionDto } from './dto/correct-transaction.dto';
import { TransactionQueryType } from './dto/transaction-query.schema';

@Injectable()
export class TransactionsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditLogService: AuditLogService,
        private readonly positionsService: PositionsService,
    ) { }

    private async assertAccountOwnership(userUuid: string, accountUuid: string) {
        const account = await this.prisma.account.findFirst({ where: { id: accountUuid, user_uuid: userUuid } });
        if (!account) throw new NotFoundException('Account not found');
        return account;
    }

    private async assertInstrumentVisible(userUuid: string, instrumentUuid: string) {
        const instrument = await this.prisma.instrument.findFirst({
            where: { id: instrumentUuid, OR: [{ user_uuid: null }, { user_uuid: userUuid }] },
        });
        if (!instrument) throw new NotFoundException('Instrument not found');
        return instrument;
    }

    async create(userUuid: string, dto: CreateTransactionDto) {
        await this.assertAccountOwnership(userUuid, dto.account_uuid);
        if (dto.instrument_uuid) await this.assertInstrumentVisible(userUuid, dto.instrument_uuid);

        const transaction = await this.prisma.$transaction(async (tx) => {
            const created = await tx.transaction.create({
                data: {
                    user_uuid: userUuid,
                    account_uuid: dto.account_uuid,
                    instrument_uuid: dto.instrument_uuid ?? null,
                    type: dto.type,
                    trade_date: new Date(dto.trade_date),
                    settlement_date: dto.settlement_date ? new Date(dto.settlement_date) : null,
                    quantity: dto.quantity,
                    price: dto.price,
                    amount: dto.amount,
                    fee: dto.fee ?? '0',
                    tax_withheld: dto.tax_withheld ?? '0',
                    currency: dto.currency,
                    fx_rate: dto.fx_rate,
                    amount_base_currency: dto.amount_base_currency,
                    broker_ref: dto.broker_ref,
                },
            });

            await this.auditLogService.record(
                {
                    user_uuid: userUuid,
                    entity_type: 'Transaction',
                    entity_uuid: created.id,
                    action: AuditAction.CREATE,
                    after: created as unknown as Prisma.InputJsonValue,
                },
                tx,
            );

            return created;
        });

        await this.positionsService.enqueueRecompute(dto.account_uuid);
        return transaction;
    }

    async correct(userUuid: string, id: string, dto: CorrectTransactionDto) {
        const original = await this.prisma.transaction.findFirst({
            where: { id, user_uuid: userUuid },
            include: { superseded_by: true },
        });
        if (!original) throw new NotFoundException('Transaction not found');
        if (original.superseded_by) {
            throw new ConflictException('This transaction has already been superseded by a later correction');
        }

        if (dto.instrument_uuid) await this.assertInstrumentVisible(userUuid, dto.instrument_uuid);

        const merged = {
            instrument_uuid: dto.instrument_uuid ?? original.instrument_uuid,
            type: dto.type ?? original.type,
            trade_date: dto.trade_date ? new Date(dto.trade_date) : original.trade_date,
            settlement_date: dto.settlement_date ? new Date(dto.settlement_date) : original.settlement_date,
            quantity: dto.quantity ?? original.quantity,
            price: dto.price ?? original.price,
            amount: dto.amount ?? original.amount,
            fee: dto.fee ?? original.fee,
            tax_withheld: dto.tax_withheld ?? original.tax_withheld,
            currency: dto.currency ?? original.currency,
            fx_rate: dto.fx_rate ?? original.fx_rate,
            amount_base_currency: dto.amount_base_currency ?? original.amount_base_currency,
            broker_ref: dto.broker_ref ?? original.broker_ref,
        };

        const correction = await this.prisma.$transaction(async (tx) => {
            const created = await tx.transaction.create({
                data: {
                    user_uuid: original.user_uuid,
                    account_uuid: original.account_uuid,
                    is_correction: true,
                    supersedes_uuid: original.id,
                    ...merged,
                },
            });

            await this.auditLogService.record(
                {
                    user_uuid: userUuid,
                    entity_type: 'Transaction',
                    entity_uuid: created.id,
                    action: AuditAction.UPDATE,
                    before: original as unknown as Prisma.InputJsonValue,
                    after: created as unknown as Prisma.InputJsonValue,
                },
                tx,
            );

            return created;
        });

        await this.positionsService.enqueueRecompute(original.account_uuid);
        return correction;
    }

    async findAll(userUuid: string, query: TransactionQueryType) {
        const where: Prisma.TransactionWhereInput = {
            user_uuid: userUuid,
            ...(query.account_uuid && { account_uuid: query.account_uuid }),
            ...(query.instrument_uuid && { instrument_uuid: query.instrument_uuid }),
            ...(query.type && { type: query.type }),
            ...(query.active_only && { superseded_by: null }),
            ...((query.from || query.to) && {
                trade_date: {
                    ...(query.from && { gte: new Date(query.from) }),
                    ...(query.to && { lte: new Date(query.to) }),
                },
            }),
        };

        const [items, count] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { trade_date: 'desc' },
                include: { instrument: true },
            }),
            this.prisma.transaction.count({ where }),
        ]);

        return {
            data: items,
            pagination: {
                total: count,
                page: query.page,
                limit: query.limit,
                total_pages: Math.ceil(count / query.limit),
                has_next: query.page < Math.ceil(count / query.limit),
                has_prev: query.page > 1,
            },
        };
    }

    async findOne(userUuid: string, id: string) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, user_uuid: userUuid },
            include: { instrument: true, supersedes: true, superseded_by: true },
        });
        if (!transaction) throw new NotFoundException('Transaction not found');
        return transaction;
    }

    async incomeByYear(userUuid: string, accountUuid: string, year: number) {
        if (!Number.isInteger(year)) throw new BadRequestException('year must be an integer');

        const rows = await this.prisma.transaction.groupBy({
            by: ['type'],
            where: {
                user_uuid: userUuid,
                account_uuid: accountUuid,
                superseded_by: null,
                type: { in: ['DIVIDEND', 'INTEREST'] },
                trade_date: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
            },
            _sum: { amount: true, tax_withheld: true },
        });

        return rows.map((r) => ({ type: r.type, amount: r._sum.amount, tax_withheld: r._sum.tax_withheld }));
    }
}
