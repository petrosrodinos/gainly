import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@/core/databases/prisma/prisma.module';
import { POSITIONS_RECOMPUTE_QUEUE } from '@/core/queues/queues.constants';
import { AccountsModule } from '../accounts/accounts.module';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';
import { LotMatchingService } from './services/lot-matching.service';
import { PositionsRecomputeProcessor } from './processors/positions-recompute.processor';

@Module({
    imports: [PrismaModule, AccountsModule, BullModule.registerQueue({ name: POSITIONS_RECOMPUTE_QUEUE })],
    controllers: [PositionsController],
    providers: [PositionsService, LotMatchingService, PositionsRecomputeProcessor],
    exports: [PositionsService, LotMatchingService],
})
export class PositionsModule { }
