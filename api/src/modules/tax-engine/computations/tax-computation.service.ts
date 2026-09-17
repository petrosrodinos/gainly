import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuditAction, CostBasisMethod, Prisma, TaxComputationStatus, TransactionType } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { PositionsService } from '@/modules/positions/positions.service';
import { LotMatchingService } from '@/modules/positions/services/lot-matching.service';
import { TaxRuleRegistry } from '../tax-rule-registry.service';
import { CreateTaxComputationDto } from './dto/create-tax-computation.dto';
import { TaxComputationQueryType } from './dto/tax-computation-query.schema';
import { TaxComputationResult } from '../interfaces/tax-jurisdiction-rule-module.interface';

const INCOME_TYPES: TransactionType[] = [TransactionType.DIVIDEND, TransactionType.INTEREST];

@Injectable()
export class TaxComputationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly positionsService: PositionsService,
        private readonly lotMatchingService: LotMatchingService,
        private readonly taxRuleRegistry: TaxRuleRegistry,
        private readonly auditLogService: AuditLogService,
    ) { }

    private async assertAccountOwnership(userUuid: string, accountUuid: string) {
        const account = await this.prisma.account.findFirst({ where: { id: accountUuid, user_uuid: userUuid } });
        if (!account) throw new NotFoundException('Account not found');
        return account;
    }

    async create(userUuid: string, dto: CreateTaxComputationDto) {
        const account = await this.assertAccountOwnership(userUuid, dto.account_uuid);
        const countryCode = dto.country_code ?? account.jurisdiction;
        const jurisdictionModule = await this.taxRuleRegistry.get(countryCode);
        const costBasisMethod = dto.cost_basis_method ?? jurisdictionModule.defaultCostBasisMethod;
        await this.taxRuleRegistry.assertSupportsCostBasisMethod(countryCode, costBasisMethod);

        const yearEnd = new Date(`${dto.tax_year}-12-31T23:59:59.999Z`);
        const yearStart = new Date(`${dto.tax_year}-01-01T00:00:00.000Z`);
        const nextYearStart = new Date(`${dto.tax_year + 1}-01-01T00:00:00.000Z`);

        const transactions = await this.positionsService.getActiveTransactions(dto.account_uuid, yearEnd);
        const instrumentUuids = [...new Set(transactions.map((t) => t.instrument_uuid))];
        const corporateActions = await this.positionsService.getCorporateActions(instrumentUuids);

        const { disposals, warnings: replayWarnings } = this.lotMatchingService.replay(transactions, corporateActions, costBasisMethod);
        const yearDisposals = disposals.filter((d) => d.disposed_at >= yearStart && d.disposed_at < nextYearStart);

        const incomeRows = await this.prisma.transaction.findMany({
            where: {
                account_uuid: dto.account_uuid,
                superseded_by: null,
                type: { in: INCOME_TYPES },
                trade_date: { gte: yearStart, lt: nextYearStart },
            },
        });
        const incomeTransactions = incomeRows.map((r) => ({
            id: r.id,
            instrument_uuid: r.instrument_uuid,
            type: r.type,
            trade_date: r.trade_date,
            amount: r.amount,
            tax_withheld: r.tax_withheld,
            currency: r.currency,
        }));

        const priorYear = await this.prisma.taxYearComputation.findFirst({
            where: { account_uuid: dto.account_uuid, country_code: countryCode, tax_year: dto.tax_year - 1, status: TaxComputationStatus.FINALIZED },
            orderBy: { version: 'desc' },
        });
        const priorYearCarryforwardLoss =
            ((priorYear?.result as unknown as TaxComputationResult)?.loss_carryforward_remaining as string | undefined) ?? '0';

        const result = jurisdictionModule.computeTaxYear({
            taxYear: dto.tax_year,
            countryCode,
            costBasisMethod,
            accountBaseCurrency: account.currency,
            disposals: yearDisposals,
            incomeTransactions,
            priorYearCarryforwardLoss,
        });
        result.warnings = [...result.warnings, ...replayWarnings];

        const inputIds = [...transactions.map((t) => t.id), ...incomeTransactions.map((t) => t.id)].sort();
        const inputSnapshotHash = createHash('sha256').update(inputIds.join(',')).digest('hex');

        const latest = await this.prisma.taxYearComputation.findFirst({
            where: { account_uuid: dto.account_uuid, country_code: countryCode, tax_year: dto.tax_year },
            orderBy: { version: 'desc' },
        });

        if (latest?.status === TaxComputationStatus.DRAFT) {
            return this.prisma.taxYearComputation.update({
                where: { id: latest.id },
                data: {
                    cost_basis_method: costBasisMethod,
                    result: result as unknown as Prisma.InputJsonValue,
                    input_snapshot_hash: inputSnapshotHash,
                    version: { increment: 1 },
                },
            });
        }

        return this.prisma.taxYearComputation.create({
            data: {
                user_uuid: userUuid,
                account_uuid: dto.account_uuid,
                country_code: countryCode,
                tax_year: dto.tax_year,
                cost_basis_method: costBasisMethod,
                status: TaxComputationStatus.DRAFT,
                version: (latest?.version ?? 0) + 1,
                result: result as unknown as Prisma.InputJsonValue,
                input_snapshot_hash: inputSnapshotHash,
            },
        });
    }

    async findAll(userUuid: string, query: TaxComputationQueryType) {
        const where: Prisma.TaxYearComputationWhereInput = {
            user_uuid: userUuid,
            ...(query.account_uuid && { account_uuid: query.account_uuid }),
            ...(query.tax_year && { tax_year: query.tax_year }),
            ...(query.status && { status: query.status }),
        };

        const [items, count] = await Promise.all([
            this.prisma.taxYearComputation.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: [{ tax_year: 'desc' }, { version: 'desc' }],
            }),
            this.prisma.taxYearComputation.count({ where }),
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
        const computation = await this.prisma.taxYearComputation.findFirst({ where: { id, user_uuid: userUuid } });
        if (!computation) throw new NotFoundException('Tax computation not found');
        return computation;
    }

    async history(userUuid: string, id: string) {
        const computation = await this.findOne(userUuid, id);
        return this.prisma.taxYearComputation.findMany({
            where: { account_uuid: computation.account_uuid, country_code: computation.country_code, tax_year: computation.tax_year },
            orderBy: { version: 'desc' },
        });
    }

    async finalize(userUuid: string, id: string) {
        const computation = await this.findOne(userUuid, id);
        if (computation.status === TaxComputationStatus.FINALIZED) {
            throw new ConflictException('This computation is already finalized');
        }

        return this.prisma.$transaction(async (tx) => {
            const finalized = await tx.taxYearComputation.update({
                where: { id },
                data: { status: TaxComputationStatus.FINALIZED, finalized_at: new Date() },
            });

            await this.auditLogService.record(
                {
                    user_uuid: userUuid,
                    entity_type: 'TaxYearComputation',
                    entity_uuid: id,
                    action: AuditAction.FINALIZE,
                    before: computation as unknown as Prisma.InputJsonValue,
                    after: finalized as unknown as Prisma.InputJsonValue,
                },
                tx,
            );

            return finalized;
        });
    }
}
