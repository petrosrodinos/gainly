import { Module } from '@nestjs/common';
import { PrismaModule } from '@/core/databases/prisma/prisma.module';
import { MappingTemplatesModule } from '@/modules/mapping-templates/mapping-templates.module';
import { AiUsageModule } from '@/modules/ai-usage/ai-usage.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
    imports: [PrismaModule, MappingTemplatesModule, AiUsageModule],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
