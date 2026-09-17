import { Module } from '@nestjs/common';
import { PrismaModule } from '@/core/databases/prisma/prisma.module';
import { MappingTemplatesController } from './mapping-templates.controller';
import { MappingTemplatesService } from './mapping-templates.service';
import { TemplateDetectionService } from './services/template-detection.service';

@Module({
    imports: [PrismaModule],
    controllers: [MappingTemplatesController],
    providers: [MappingTemplatesService, TemplateDetectionService],
    exports: [MappingTemplatesService, TemplateDetectionService],
})
export class MappingTemplatesModule { }
