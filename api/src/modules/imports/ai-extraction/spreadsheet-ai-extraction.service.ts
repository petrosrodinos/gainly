import { Injectable } from '@nestjs/common';
import { AiUsageFeatures } from '@/modules/ai-usage/interfaces/ai-usage.interface';
import { ParsedFile } from '../parsers/parser-strategy.interface';
import { CanonicalRow } from '../interfaces/canonical-row.interface';
import { AiRowExtractionService } from './ai-row-extraction.service';

const MAX_ROWS_PER_SHEET = 300;

function flattenToText(parsedFile: ParsedFile): string {
    return parsedFile.sheets
        .map((sheet) => {
            const headers = sheet.headers.filter(Boolean);
            const rows = sheet.rows
                .slice(0, MAX_ROWS_PER_SHEET)
                .map((row) => headers.map((h) => row[h] ?? '').join(' | '))
                .join('\n');
            return `Sheet: "${sheet.name}"\nColumns: ${headers.join(' | ')}\n${rows}`;
        })
        .join('\n\n');
}

/**
 * One-off fallback for a spreadsheet whose layout doesn't match any saved mapping template and
 * isn't worth turning into a reusable one — same AI-assisted extraction as PDF, applied to a
 * flattened text dump of the parsed rows instead of extracted PDF text (spec §3: never blocked
 * on a format match, and DESIGN.MD's AI-assisted-extraction machinery generalizes cleanly here).
 */
@Injectable()
export class SpreadsheetAiExtractionService {
    constructor(private readonly aiRowExtractionService: AiRowExtractionService) { }

    async extract(parsedFile: ParsedFile, userUuid: string, importBatchUuid: string): Promise<CanonicalRow[]> {
        const text = flattenToText(parsedFile);
        return this.aiRowExtractionService.extractRowsFromText(text, userUuid, importBatchUuid, AiUsageFeatures.FALLBACK_EXTRACTION);
    }
}
