import { z } from 'zod';

/**
 * Shape handed to AiService.generateTextWithSchema for AI-assisted PDF extraction
 * (DESIGN.MD §4.4). Mirrors CanonicalRow but flattened (no nested objects) since that's what
 * generateObject's schema-constrained output handles most reliably.
 */
export const PdfExtractedRowSchema = z.object({
    type: z.enum([
        'BUY',
        'SELL',
        'DIVIDEND',
        'INTEREST',
        'FEE',
        'TAX_WITHHOLDING',
        'FX_CONVERSION',
        'CORPORATE_ACTION',
        'DEPOSIT',
        'WITHDRAWAL',
    ]),
    trade_date: z.string().describe('ISO date (YYYY-MM-DD) the transaction/trade occurred'),
    settlement_date: z.string().optional().describe('ISO date, only if the statement distinguishes it from the trade date'),
    quantity: z.string().optional().describe('Number of units, as a plain positive decimal string (buy/sell rows only)'),
    price: z.string().optional().describe('Price per unit, as a plain decimal string'),
    amount: z.string().describe('Total cash amount of the row, as a plain positive decimal string'),
    fee: z.string().optional().describe('Broker fee/commission, as a plain positive decimal string'),
    tax_withheld: z.string().optional().describe('Tax withheld at source, as a plain positive decimal string'),
    currency: z.string().describe('ISO 4217 currency code'),
    fx_rate: z.string().optional(),
    broker_ref: z.string().optional().describe('Trade/transaction reference number, if present'),
    instrument_isin: z.string().optional().describe('12-character ISIN, if present'),
    instrument_ticker: z.string().optional().describe('Ticker symbol, if present'),
    instrument_name: z.string().optional().describe('Security name, if present'),
});

export type PdfExtractedRow = z.infer<typeof PdfExtractedRowSchema>;
