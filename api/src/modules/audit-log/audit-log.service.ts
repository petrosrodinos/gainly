import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { AuditLogPrismaClient, RecordAuditLogParams } from './interfaces/audit-log.interface';
import { AuditLogQueryType } from './dto/audit-log-query.schema';

@Injectable()
export class AuditLogService {
    constructor(private readonly prisma: PrismaService) { }

    async record(params: RecordAuditLogParams, tx?: AuditLogPrismaClient) {
        const client = tx ?? this.prisma;
        return client.auditLog.create({
            data: {
                user_uuid: params.user_uuid ?? null,
                entity_type: params.entity_type,
                entity_uuid: params.entity_uuid,
                action: params.action,
                before: params.before ?? undefined,
                after: params.after ?? undefined,
            },
        });
    }

    async findAll(query: AuditLogQueryType, scopeToUserUuid?: string) {
        const where = {
            ...(scopeToUserUuid && { user_uuid: scopeToUserUuid }),
            ...(query.user_uuid && !scopeToUserUuid && { user_uuid: query.user_uuid }),
            ...(query.entity_type && { entity_type: query.entity_type }),
            ...(query.entity_uuid && { entity_uuid: query.entity_uuid }),
        };

        const [items, count] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.auditLog.count({ where }),
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
}
