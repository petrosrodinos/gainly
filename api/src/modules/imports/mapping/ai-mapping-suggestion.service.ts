import { Injectable } from '@nestjs/common';
import { SourceFileType } from 'generated/prisma';
import { AiService } from '@/integrations/ai/services/ai.service';
import { AiModels, AiProviders } from '@/integrations/ai/interfaces/ai.interface';
import { AiUsageService } from '@/modules/ai-usage/ai-usage.service';
import { AiUsageFeatures } from '@/modules/ai-usage/interfaces/ai-usage.interface';
import { MappingSuggestion, MappingSuggestionSchema } from '@/modules/mapping-templates/schemas/mapping-template.schema';
import { ParsedFile } from '../parsers/parser-strategy.interface';

const MODEL = AiModels.openai.gpt4oMini;
const MAX_SAMPLE_ROWS_PER_SHEET = 8;

const MAPPING_SYSTEM_PROMPT = `You design a declarative "columns -> canonical fields" mapping for a broker/investment-platform statement, so it can be parsed automatically every time this format is seen again.

Canonical target fields (use as ColumnRule.field, dot-paths for nested ones):
- type (a TransactionType: BUY, SELL, DIVIDEND, INTEREST, FEE, TAX_WITHHOLDING, FX_CONVERSION, CORPORATE_ACTION, DEPOSIT, WITHDRAWAL)
- trade_date, settlement_date (dates)
- quantity, price, amount, fee, tax_withheld, fx_rate (decimals, always positive magnitudes)
- currency, broker_ref (strings)
- instrument_hint.isin, instrument_hint.ticker, instrument_hint.name, instrument_hint.exchange

Available column transforms:
- "date": parse a date cell (set date_format to a Luxon format string if it isn't ISO/yyyy-MM-dd)
- "decimal": parse a plain numeric cell
- "broker-amount-currency": parse a combined "12.34EUR"-style cell into just the numeric amount
- "sign": parse a numeric cell, optionally negate
- "enum-map": map raw cell values (e.g. "Buy"/"Sell") to canonical values via enum_map — the keys must be exactly the raw values you saw in the sample rows
- "trim": pass the cell through as a trimmed string

Rules:
- detection_signature.sheets and column_mapping.sheets must have MATCHING sheet_name keys.
- required_headers should be the smallest set of headers that reliably identifies this sheet (not every header).
- Only map columns you're confident about. Leave anything ambiguous out of column_mapping rather than guessing, and mention it in "notes".
- A sheet whose rows are always one type (e.g. a dividends-only sheet) can set default_type instead of mapping a "type" column.`;

@Injectable()
export class AiMappingSuggestionService {
    constructor(
        private readonly aiService: AiService,
        private readonly aiUsageService: AiUsageService,
    ) { }

    async suggest(
        parsedFile: ParsedFile,
        fileType: SourceFileType,
        userUuid: string,
        importBatchUuid: string,
    ): Promise<MappingSuggestion> {
        await this.aiUsageService.assertWithinDailyQuota(userUuid);

        const preview = parsedFile.sheets
            .map((sheet) => {
                const headers = sheet.headers.filter(Boolean);
                const sampleRows = sheet.rows
                    .slice(0, MAX_SAMPLE_ROWS_PER_SHEET)
                    .map((row) => headers.map((h) => `${h}=${row[h] ?? ''}`).join(', '));
                return `Sheet: "${sheet.name}" (header row index ${sheet.header_row_index})\nHeaders: ${headers.join(' | ')}\nSample rows:\n${sampleRows.join('\n')}`;
            })
            .join('\n\n');

        const { response, usage } = await this.aiService.generateTextWithSchema({
            provider: AiProviders.openai,
            model: MODEL,
            output: 'object',
            schema: MappingSuggestionSchema,
            system: MAPPING_SYSTEM_PROMPT,
            prompt: `File type: ${fileType}\n\n${preview}`,
        });

        await this.aiUsageService.record({
            userUuid,
            feature: AiUsageFeatures.MAPPING_SUGGESTION,
            provider: AiProviders.openai,
            model: MODEL,
            inputTokens: usage?.inputTokens ?? 0,
            outputTokens: usage?.outputTokens ?? 0,
            costUsd: usage?.totalCost ?? 0,
            importBatchUuid,
        });

        return response as MappingSuggestion;
    }
}
