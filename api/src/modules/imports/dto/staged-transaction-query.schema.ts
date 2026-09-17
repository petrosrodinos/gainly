import { z } from 'zod';
import { StagedTransactionStatus } from 'generated/prisma';

export const StagedTransactionQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 50)),
    status: z.nativeEnum(StagedTransactionStatus).optional(),
});

export type StagedTransactionQueryType = z.infer<typeof StagedTransactionQuerySchema>;
