import { Injectable } from '@nestjs/common';
import { ImportBatchStatus, Prisma } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { MappingTemplatesService } from '@/modules/mapping-templates/mapping-templates.service';
import { AdminImportQueryType } from './dto/admin-import-query.schema';

const TRIAGE_STATUSES: ImportBatchStatus[] = [
    ImportBatchStatus.FAILED,
    ImportBatchStatus.NEEDS_REVIEW,
    ImportBatchStatus.NEEDS_MAPPING,
];

@Injectable()
export class AdminService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mappingTemplatesService: MappingTemplatesService,
    ) { }

    async findImportsForTriage(query: AdminImportQueryType) {
        const where: Prisma.ImportBatchWhereInput = {
            status: query.status ?? { in: TRIAGE_STATUSES },
        };

        const [items, count] = await Promise.all([
            this.prisma.importBatch.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { created_at: 'desc' },
                include: { source_document: true, mapping_template: true, user: { select: { id: true, email: true } } },
            }),
            this.prisma.importBatch.count({ where }),
        ]);

        return {
            data: items,
            pagination: {
                total: count,
                page: query.page,
                limit: query.limit,
                total_pages: Math.ceil(count / query.limit),
                has_next: query.page < Math.ceil(count / query.limit),
                has_prev: query.page > 1,
            },
        };
    }

    async findAllMappingTemplates() {
        return this.prisma.mappingTemplate.findMany({ orderBy: [{ user_uuid: 'asc' }, { updated_at: 'desc' }] });
    }

    async promoteMappingTemplate(id: string) {
        return this.mappingTemplatesService.promoteToGlobal(id);
    }
}
