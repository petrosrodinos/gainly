import { z } from 'zod';

export const AuditLogQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 20)),
    entity_type: z.string().optional(),
    entity_uuid: z.string().optional(),
    user_uuid: z.string().optional(),
});

export type AuditLogQueryType = z.infer<typeof AuditLogQuerySchema>;
