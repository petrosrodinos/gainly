import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { GcsFolders } from '@/integrations/storage/gcs/config/gcs-folders.config';
import { DocumentsService } from '@/modules/documents/documents.service';
import { PositionsService } from '@/modules/positions/positions.service';
import { LotMatchingService } from '@/modules/positions/services/lot-matching.service';
import { TaxRuleRegistry } from '@/modules/tax-engine/tax-rule-registry.service';
import { toCsv } from '@/shared/utils/csv/csv.utils';
import { renderTablePdf } from '@/shared/utils/pdf/pdf.utils';
import { createZipBuffer } from '@/shared/utils/zip/zip.utils';
import { RealizedGainsReportDto } from './dto/realized-gains-report.dto';
import { PortfolioReportDto } from './dto/portfolio-report.dto';

@Injectable()
export class ReportsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly documentsService: DocumentsService,
        private readonly positionsService: PositionsService,
        private readonly lotMatchingService: LotMatchingService,
        private readonly taxRuleRegistry: TaxRuleRegistry,
    ) { }

    private async assertAccountOwnership(userUuid: string, accountUuid: string) {
        const account = await this.prisma.account.findFirst({ where: { id: accountUuid, user_uuid: userUuid } });
        if (!account) throw new NotFoundException('Account not found');
        return account;
    }

    async transactionsCsv(userUuid: string, accountUuid: string) {
        await this.assertAccountOwnership(userUuid, accountUuid);

        const transactions = await this.prisma.transaction.findMany({
            where: { account_uuid: accountUuid },
            include: { instrument: true },
            orderBy: { trade_date: 'asc' },
        });

        const csv = toCsv(
            ['id', 'type', 'trade_date', 'settlement_date', 'instrument', 'quantity', 'price', 'amount', 'fee', 'tax_withheld', 'currency', 'fx_rate', 'broker_ref', 'is_correction', 'supersedes_uuid'],
            transactions.map((t) => [
                t.id,
                t.type,
                t.trade_date.toISOString().slice(0, 10),
                t.settlement_date?.toISOString().slice(0, 10) ?? '',
                t.instrument?.ticker ?? t.instrument?.isin ?? '',
                t.quantity?.toString() ?? '',
                t.price?.toString() ?? '',
                t.amount.toString(),
                t.fee.toString(),
                t.tax_withheld.toString(),
                t.currency,
                t.fx_rate?.toString() ?? '',
                t.broker_ref ?? '',
                t.is_correction,
                t.supersedes_uuid ?? '',
            ]),
        );

        return this.documentsService.createFromBuffer({
            userUuid,
            buffer: Buffer.from(csv, 'utf-8'),
            filename: `transactions-${accountUuid}.csv`,
            contentType: 'text/csv',
            folder: GcsFolders.reports,
            type: 'DOCUMENT',
            category: 'REPORT',
        });
    }

    async realizedGainsCsv(userUuid: string, accountUuid: string, dto: RealizedGainsReportDto) {
        const account = await this.assertAccountOwnership(userUuid, accountUuid);
        const countryCode = dto.country_code ?? account.jurisdiction;
        const jurisdictionModule = await this.taxRuleRegistry.get(countryCode);
        const method = dto.cost_basis_method ?? jurisdictionModule.defaultCostBasisMethod;

        const yearEnd = new Date(`${dto.tax_year}-12-31T23:59:59.999Z`);
        const yearStart = new Date(`${dto.tax_year}-01-01T00:00:00.000Z`);
        const nextYearStart = new Date(`${dto.tax_year + 1}-01-01T00:00:00.000Z`);

        const transactions = await this.positionsService.getActiveTransactions(accountUuid, yearEnd);
        const instrumentUuids = [...new Set(transactions.map((t) => t.instrument_uuid))];
        const corporateActions = await this.positionsService.getCorporateActions(instrumentUuids);
        const { disposals } = this.lotMatchingService.replay(transactions, corporateActions, method);
        const yearDisposals = disposals.filter((d) => d.disposed_at >= yearStart && d.disposed_at < nextYearStart);

        const instruments = await this.prisma.instrument.findMany({ where: { id: { in: instrumentUuids } } });
        const instrumentByUuid = new Map(instruments.map((i) => [i.id, i]));

        const csv = toCsv(
            ['instrument', 'quantity', 'acquired_at', 'disposed_at', 'holding_period_days', 'proceeds', 'cost_basis', 'gain_loss', 'currency'],
            yearDisposals.map((d) => [
                instrumentByUuid.get(d.instrument_uuid)?.ticker ?? instrumentByUuid.get(d.instrument_uuid)?.isin ?? d.instrument_uuid,
                d.quantity.toString(),
                d.acquired_at.toISOString().slice(0, 10),
                d.disposed_at.toISOString().slice(0, 10),
                d.holding_period_days,
                d.proceeds.toString(),
                d.cost_basis.toString(),
                d.gain_loss.toString(),
                d.currency,
            ]),
        );

        return this.documentsService.createFromBuffer({
            userUuid,
            buffer: Buffer.from(csv, 'utf-8'),
            filename: `realized-gains-${accountUuid}-${dto.tax_year}.csv`,
            contentType: 'text/csv',
            folder: GcsFolders.reports,
            type: 'DOCUMENT',
            category: 'REPORT',
        });
    }

    async portfolioReport(userUuid: string, accountUuid: string, dto: PortfolioReportDto) {
        const account = await this.assertAccountOwnership(userUuid, accountUuid);
        const { as_of_date, holdings, allocation } = await this.positionsService.getHoldings(accountUuid);

        const rows = holdings.map((h) => [
            h.instrument.ticker ?? h.instrument.isin ?? h.instrument_uuid,
            h.instrument.asset_class,
            h.quantity.toString(),
            h.cost_basis.toString(),
            h.market_value?.toString() ?? '—',
        ]);

        for (const a of allocation.by_asset_class) {
            rows.push([`Allocation: ${a.key}`, '', '', '', `${a.percentage.toFixed(1)}%`]);
        }

        const buffer = await renderTablePdf(
            `Portfolio Report — ${account.name}${as_of_date ? ` (as of ${as_of_date.toISOString().slice(0, 10)})` : ''}`,
            ['Instrument', 'Asset class', 'Quantity', 'Cost basis', 'Value / %'],
            rows,
        );

        return this.documentsService.createFromBuffer({
            userUuid,
            buffer,
            filename: `portfolio-${accountUuid}.pdf`,
            contentType: 'application/pdf',
            folder: GcsFolders.reports,
            type: 'DOCUMENT',
            category: 'REPORT',
        });
    }

    async fullExport(userUuid: string) {
        const [accounts, transactions, taxComputations, documents] = await Promise.all([
            this.prisma.account.findMany({ where: { user_uuid: userUuid } }),
            this.prisma.transaction.findMany({ where: { user_uuid: userUuid } }),
            this.prisma.taxYearComputation.findMany({ where: { user_uuid: userUuid } }),
            this.prisma.document.findMany({ where: { user_uuid: userUuid }, select: { id: true, filename: true, category: true, type: true, created_at: true } }),
        ]);

        const zipBuffer = await createZipBuffer([
            { name: 'accounts.json', content: JSON.stringify(accounts, null, 2) },
            { name: 'transactions.json', content: JSON.stringify(transactions, null, 2) },
            { name: 'tax_computations.json', content: JSON.stringify(taxComputations, null, 2) },
            { name: 'documents_manifest.json', content: JSON.stringify(documents, null, 2) },
        ]);

        return this.documentsService.createFromBuffer({
            userUuid,
            buffer: zipBuffer,
            filename: `full-export-${new Date().toISOString().slice(0, 10)}.zip`,
            contentType: 'application/zip',
            folder: GcsFolders.reports,
            type: 'DOCUMENT',
            category: 'REPORT',
        });
    }
}
