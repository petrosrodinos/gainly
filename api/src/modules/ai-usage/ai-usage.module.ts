import { Module } from '@nestjs/common';
import { PrismaModule } from '@/core/databases/prisma/prisma.module';
import { AiUsageService } from './ai-usage.service';

@Module({
    imports: [PrismaModule],
    providers: [AiUsageService],
    exports: [AiUsageService],
})
export class AiUsageModule { }
