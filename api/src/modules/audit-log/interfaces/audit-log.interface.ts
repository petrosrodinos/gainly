import { AuditAction, Prisma } from 'generated/prisma';

export interface RecordAuditLogParams {
    user_uuid?: string | null;
    entity_type: string;
    entity_uuid: string;
    action: AuditAction;
    before?: Prisma.InputJsonValue | null;
    after?: Prisma.InputJsonValue | null;
}

export type AuditLogPrismaClient = Prisma.TransactionClient;
