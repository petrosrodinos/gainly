import { Module } from '@nestjs/common';
import { PrismaModule } from '@/core/databases/prisma/prisma.module';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { PositionsModule } from '@/modules/positions/positions.module';
import { TaxEngineModule } from '@/modules/tax-engine/tax-engine.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
    imports: [PrismaModule, DocumentsModule, PositionsModule, TaxEngineModule],
    controllers: [ReportsController],
    providers: [ReportsService],
})
export class ReportsModule { }
