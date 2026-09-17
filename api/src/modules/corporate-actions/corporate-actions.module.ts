import { Module } from '@nestjs/common';
import { PrismaModule } from '@/core/databases/prisma/prisma.module';
import { PositionsModule } from '../positions/positions.module';
import { CorporateActionsController } from './corporate-actions.controller';
import { CorporateActionsService } from './corporate-actions.service';

@Module({
    imports: [PrismaModule, PositionsModule],
    controllers: [CorporateActionsController],
    providers: [CorporateActionsService],
    exports: [CorporateActionsService],
})
export class CorporateActionsModule { }
