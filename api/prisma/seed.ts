import { PrismaClient, CostBasisMethod, SourceFileType } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

/**
 * Seeds the one MVP jurisdiction module (LT) and the one global mapping template matching
 * docs/report-2025.xlsx (spec §3: "Global templates ship with the product, starting with the
 * format demonstrated by docs/report-2025.xlsx's ExecTrades/SecIncome sheets"). Not run
 * automatically — no DATABASE_URL is configured yet; run manually with `npm run seed` once one is.
 */
async function main() {
    await prisma.taxJurisdictionModule.upsert({
        where: { country_code: 'LT' },
        create: {
            country_code: 'LT',
            name: 'Lithuania',
            version: '2025.1',
            is_active: true,
            default_cost_basis_method: CostBasisMethod.FIFO,
            supported_cost_basis_methods: [CostBasisMethod.FIFO, CostBasisMethod.AVERAGE_COST],
        },
        update: {
            version: '2025.1',
            is_active: true,
            default_cost_basis_method: CostBasisMethod.FIFO,
            supported_cost_basis_methods: [CostBasisMethod.FIFO, CostBasisMethod.AVERAGE_COST],
        },
    });

    const existingTemplate = await prisma.mappingTemplate.findFirst({
        where: { user_uuid: null, name: 'report-2025 (ExecTrades/SecIncome)' },
    });

    const detection_signature = {
        sheets: [
            {
                sheet_name: 'ExecTrades',
                header_row_index: 0,
                required_headers: ['account', 'trade#', 'ticker', 'isin', 'direction', 'quantity', 'price', 'currency', 'amount', 'fee', 'settlement date'],
            },
            {
                sheet_name: 'SecIncome',
                header_row_index: 0,
                required_headers: ['account', 'date', 'ticker', 'isin', 'type of income', 'currency', 'amount'],
            },
        ],
    };

    const column_mapping = {
        sheets: {
            ExecTrades: {
                header_row_index: 0,
                columns: {
                    'trade#': { field: 'broker_ref', transform: 'trim' },
                    ticker: { field: 'instrument_hint.ticker', transform: 'trim' },
                    isin: { field: 'instrument_hint.isin', transform: 'trim' },
                    currency: { field: 'currency', transform: 'trim' },
                    direction: { field: 'type', transform: 'enum-map', enum_map: { Buy: 'BUY', Sell: 'SELL' } },
                    quantity: { field: 'quantity', transform: 'decimal' },
                    price: { field: 'price', transform: 'decimal' },
                    amount: { field: 'amount', transform: 'decimal' },
                    fee: { field: 'fee', transform: 'broker-amount-currency' },
                    'settlement date': { field: 'trade_date', transform: 'date' },
                },
            },
            SecIncome: {
                header_row_index: 0,
                columns: {
                    date: { field: 'trade_date', transform: 'date' },
                    ticker: { field: 'instrument_hint.ticker', transform: 'trim' },
                    isin: { field: 'instrument_hint.isin', transform: 'trim' },
                    'type of income': { field: 'type', transform: 'enum-map', enum_map: { dividend: 'DIVIDEND', interest: 'INTEREST' } },
                    currency: { field: 'currency', transform: 'trim' },
                    amount: { field: 'amount', transform: 'decimal' },
                    'tax withheld by broker': { field: 'tax_withheld', transform: 'broker-amount-currency', negate: true },
                    'exchange rate': { field: 'fx_rate', transform: 'decimal' },
                },
            },
        },
    };

    if (existingTemplate) {
        await prisma.mappingTemplate.update({
            where: { id: existingTemplate.id },
            data: { detection_signature, column_mapping, version: { increment: 1 } },
        });
    } else {
        await prisma.mappingTemplate.create({
            data: {
                user_uuid: null,
                name: 'report-2025 (ExecTrades/SecIncome)',
                file_type: SourceFileType.XLSX,
                detection_signature,
                column_mapping,
            },
        });
    }

    // eslint-disable-next-line no-console
    console.log('Seed complete: LT tax jurisdiction module + report-2025 global mapping template.');
}

main()
    .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
