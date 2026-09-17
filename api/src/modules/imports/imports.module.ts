import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@/core/databases/prisma/prisma.module';
import { IMPORT_PROCESSING_QUEUE } from '@/core/queues/queues.constants';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { PositionsModule } from '@/modules/positions/positions.module';
import { InstrumentsModule } from '@/modules/instruments/instruments.module';
import { MappingTemplatesModule } from '@/modules/mapping-templates/mapping-templates.module';
import { AiIntegrationModule } from '@/integrations/ai/ai.module';
import { AiUsageModule } from '@/modules/ai-usage/ai-usage.module';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { XlsxParser } from './parsers/xlsx.parser';
import { CsvParser } from './parsers/csv.parser';
import { UnsupportedParser } from './parsers/unsupported.parser';
import { ParserFactory } from './parsers/parser.factory';
import { PdfAiExtractionService } from './parsers/pdf-ai-extraction.service';
import { ColumnMappingEngine } from './mapping/column-mapping.engine';
import { StagedRowValidator } from './validation/staged-row-validator';
import { DedupService } from './dedup/dedup.service';
import { ImportProcessor } from './processors/import.processor';

@Module({
    imports: [
        PrismaModule,
        DocumentsModule,
        AuditLogModule,
        PositionsModule,
        InstrumentsModule,
        MappingTemplatesModule,
        AiIntegrationModule,
        AiUsageModule,
        BullModule.registerQueue({ name: IMPORT_PROCESSING_QUEUE }),
    ],
    controllers: [ImportsController],
    providers: [
        ImportsService,
        XlsxParser,
        CsvParser,
        UnsupportedParser,
        ParserFactory,
        PdfAiExtractionService,
        ColumnMappingEngine,
        StagedRowValidator,
        DedupService,
        ImportProcessor,
    ],
    exports: [ImportsService],
})
export class ImportsModule { }
