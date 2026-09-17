import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { IMPORT_PROCESSING_QUEUE } from '@/core/queues/queues.constants';
import { ImportsService } from '../imports.service';
import { ImportProcessingJobData } from '../interfaces/import-job.interface';

@Processor(IMPORT_PROCESSING_QUEUE)
export class ImportProcessor extends WorkerHost {
    constructor(private readonly importsService: ImportsService) {
        super();
    }

    async process(job: Job<ImportProcessingJobData>) {
        return this.importsService.processBatch(job.data.importBatchUuid);
    }
}
