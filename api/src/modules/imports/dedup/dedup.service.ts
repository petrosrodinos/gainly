import { Injectable } from '@nestjs/common';
import { Prisma, TransactionType } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { ValidatedRow } from '../validation/staged-row-validator';

@Injectable()
export class DedupService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Natural key per DESIGN.MD §4.6: account + broker ref/trade number + settlement date +
     * amount + direction — falls back to trade_date when no settlement date/broker ref is
     * available (e.g. income rows), so a re-uploaded statement never creates duplicates.
     */
    async findDuplicate(accountUuid: string, row: ValidatedRow) {
        if (!row.mapped.amount || !row.mapped.type || !row.mapped.trade_date) return null;

        const where: Prisma.TransactionWhereInput = {
            account_uuid: accountUuid,
            superseded_by: null,
            amount: row.mapped.amount,
            type: row.mapped.type as TransactionType,
            ...(row.mapped.broker_ref
                ? { broker_ref: row.mapped.broker_ref }
                : { trade_date: new Date(row.mapped.trade_date) }),
            ...(row.mapped.settlement_date && { settlement_date: new Date(row.mapped.settlement_date) }),
        };

        return this.prisma.transaction.findFirst({ where });
    }
}
