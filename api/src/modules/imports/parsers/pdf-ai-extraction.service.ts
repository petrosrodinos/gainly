import { BadRequestException, Injectable } from '@nestjs/common';
import pdfParse = require('pdf-parse');
import { AiService } from '@/integrations/ai/services/ai.service';
import { AiModels, AiProviders } from '@/integrations/ai/interfaces/ai.interface';
import { AiUsageService } from '@/modules/ai-usage/ai-usage.service';
import { AiUsageFeatures } from '@/modules/ai-usage/interfaces/ai-usage.interface';
import { CanonicalRow, InstrumentHint } from '../interfaces/canonical-row.interface';
import { PdfExtractedRow, PdfExtractedRowSchema } from './pdf-ai-row.schema';

const MAX_STATEMENT_CHARS = 20000;
const MODEL = AiModels.openai.gpt4oMini;

const EXTRACTION_SYSTEM_PROMPT = `You extract investment transactions from broker/platform statement text into structured rows.
Rules:
- Only extract rows that represent an actual transaction/event (buy, sell, dividend, interest, fee, tax withholding, FX conversion, corporate action, deposit, withdrawal).
- Never invent values you cannot read from the text. Omit optional fields you're not confident about rather than guessing.
- All monetary/quantity fields are plain decimal strings (no currency symbols, no thousands separators), always positive magnitudes.
- Dates are ISO format (YYYY-MM-DD).`;

function toCanonicalRow(row: PdfExtractedRow): CanonicalRow {
    const instrumentHint: InstrumentHint | undefined =
        row.instrument_isin || row.instrument_ticker || row.instrument_name
            ? { isin: row.instrument_isin ?? null, ticker: row.instrument_ticker ?? null, name: row.instrument_name ?? null }
            : undefined;

    return {
        type: row.type,
        trade_date: row.trade_date,
        settlement_date: row.settlement_date,
        quantity: row.quantity,
        price: row.price,
        amount: row.amount,
        fee: row.fee,
        tax_withheld: row.tax_withheld,
        currency: row.currency,
        fx_rate: row.fx_rate,
        broker_ref: row.broker_ref,
        instrument_hint: instrumentHint,
    };
}

/**
 * PDF fallback path (DESIGN.MD §4.4): no layout mapping template exists for PDFs yet, so every
 * PDF statement goes through AI-assisted structured extraction via AiService.generateTextWithSchema.
 * Every call is quota-checked and logged through AiUsageService (spec §8).
 */
@Injectable()
export class PdfAiExtractionService {
    constructor(
        private readonly aiService: AiService,
        private readonly aiUsageService: AiUsageService,
    ) { }

    async extract(buffer: Buffer, userUuid: string, importBatchUuid: string): Promise<CanonicalRow[]> {
        await this.aiUsageService.assertWithinDailyQuota(userUuid);

        const { text } = await pdfParse(buffer);
        if (!text || !text.trim()) {
            throw new BadRequestException(
                'No extractable text found in this PDF — it may be a scanned image, which is not supported yet.',
            );
        }

        const statementText = text.length > MAX_STATEMENT_CHARS ? text.slice(0, MAX_STATEMENT_CHARS) : text;

        const { response, usage } = await this.aiService.generateTextWithSchema({
            provider: AiProviders.openai,
            model: MODEL,
            schema: PdfExtractedRowSchema,
            system: EXTRACTION_SYSTEM_PROMPT,
            prompt: `Statement text:\n\n${statementText}`,
        });

        await this.aiUsageService.record({
            userUuid,
            feature: AiUsageFeatures.PDF_EXTRACTION,
            provider: AiProviders.openai,
            model: MODEL,
            inputTokens: usage?.inputTokens ?? 0,
            outputTokens: usage?.outputTokens ?? 0,
            costUsd: usage?.totalCost ?? 0,
            importBatchUuid,
        });

        const rows = (response ?? []) as unknown as PdfExtractedRow[];
        return rows.map(toCanonicalRow);
    }
}
