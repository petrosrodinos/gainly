import { BadRequestException, Injectable } from '@nestjs/common';
import pdfParse = require('pdf-parse');
import { AiUsageFeatures } from '@/modules/ai-usage/interfaces/ai-usage.interface';
import { CanonicalRow } from '../interfaces/canonical-row.interface';
import { AiRowExtractionService } from './ai-row-extraction.service';

/**
 * PDF fallback path (DESIGN.MD §4.4): no layout mapping template mechanism exists for PDFs, so
 * every PDF statement goes through AI-assisted structured extraction.
 */
@Injectable()
export class PdfAiExtractionService {
    constructor(private readonly aiRowExtractionService: AiRowExtractionService) { }

    async extract(buffer: Buffer, userUuid: string, importBatchUuid: string): Promise<CanonicalRow[]> {
        const { text } = await pdfParse(buffer);
        if (!text || !text.trim()) {
            throw new BadRequestException(
                'No extractable text found in this PDF — it may be a scanned image, which is not supported yet.',
            );
        }

        return this.aiRowExtractionService.extractRowsFromText(text, userUuid, importBatchUuid, AiUsageFeatures.PDF_EXTRACTION);
    }
}
