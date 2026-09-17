import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { POSITIONS_RECOMPUTE_QUEUE } from '@/core/queues/queues.constants';
import { PositionsService } from '../positions.service';

@Processor(POSITIONS_RECOMPUTE_QUEUE)
export class PositionsRecomputeProcessor extends WorkerHost {
    private readonly logger = new Logger(PositionsRecomputeProcessor.name);

    constructor(private readonly positionsService: PositionsService) {
        super();
    }

    async process(job: Job<{ accountUuid: string }>) {
        try {
            return await this.positionsService.recomputeForAccount(job.data.accountUuid);
        } catch (error) {
            this.logger.error(`Failed to recompute positions for account ${job.data.accountUuid}: ${error.message}`);
            throw error;
        }
    }
}
