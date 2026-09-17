import { z } from 'zod';
import { ImportBatchStatus } from 'generated/prisma';

export const AdminImportQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 20)),
    status: z.nativeEnum(ImportBatchStatus).optional(),
});

export type AdminImportQueryType = z.infer<typeof AdminImportQuerySchema>;
