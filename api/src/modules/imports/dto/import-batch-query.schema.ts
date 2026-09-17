import { z } from 'zod';
import { ImportBatchStatus } from 'generated/prisma';

export const ImportBatchQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 20)),
    account_uuid: z.string().uuid().optional(),
    status: z.nativeEnum(ImportBatchStatus).optional(),
});

export type ImportBatchQueryType = z.infer<typeof ImportBatchQuerySchema>;
