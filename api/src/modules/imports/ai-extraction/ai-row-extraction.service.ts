import { Injectable } from '@nestjs/common';
import { AiService } from '@/integrations/ai/services/ai.service';
import { AiModels, AiProviders } from '@/integrations/ai/interfaces/ai.interface';
import { AiUsageService } from '@/modules/ai-usage/ai-usage.service';
import { AiUsageFeature } from '@/modules/ai-usage/interfaces/ai-usage.interface';
import { CanonicalRow, InstrumentHint } from '../interfaces/canonical-row.interface';
import { ExtractedRow, ExtractedRowSchema } from './extracted-row.schema';

export const MAX_STATEMENT_CHARS = 20000;
export const EXTRACTION_MODEL = AiModels.openai.gpt4oMini;

const EXTRACTION_SYSTEM_PROMPT = `You extract investment transactions from broker/platform statement text into structured rows.
Rules:
- Only extract rows that represent an actual transaction/event (buy, sell, dividend, interest, fee, tax withholding, FX conversion, corporate action, deposit, withdrawal).
- Never invent values you cannot read from the text. Omit optional fields you're not confident about rather than guessing.
- All monetary/quantity fields are plain decimal strings (no currency symbols, no thousands separators), always positive magnitudes.
- Dates are ISO format (YYYY-MM-DD).`;

function toCanonicalRow(row: ExtractedRow): CanonicalRow {
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
 * Shared AI-assisted row extraction — quota-checked and cost-logged (spec §8) regardless of
 * which source text it was called for (PDF text, or a flattened spreadsheet dump).
 */
@Injectable()
export class AiRowExtractionService {
    constructor(
        private readonly aiService: AiService,
        private readonly aiUsageService: AiUsageService,
    ) { }

    async extractRowsFromText(
        statementText: string,
        userUuid: string,
        importBatchUuid: string,
        feature: AiUsageFeature,
    ): Promise<CanonicalRow[]> {
        await this.aiUsageService.assertWithinDailyQuota(userUuid);

        const truncated = statementText.length > MAX_STATEMENT_CHARS ? statementText.slice(0, MAX_STATEMENT_CHARS) : statementText;

        const { response, usage } = await this.aiService.generateTextWithSchema({
            provider: AiProviders.openai,
            model: EXTRACTION_MODEL,
            schema: ExtractedRowSchema,
            system: EXTRACTION_SYSTEM_PROMPT,
            prompt: `Statement text:\n\n${truncated}`,
        });

        await this.aiUsageService.record({
            userUuid,
            feature,
            provider: AiProviders.openai,
            model: EXTRACTION_MODEL,
            inputTokens: usage?.inputTokens ?? 0,
            outputTokens: usage?.outputTokens ?? 0,
            costUsd: usage?.totalCost ?? 0,
            importBatchUuid,
        });

        const rows = (response ?? []) as unknown as ExtractedRow[];
        return rows.map(toCanonicalRow);
    }
}
