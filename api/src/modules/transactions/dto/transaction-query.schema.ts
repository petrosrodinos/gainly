import { z } from 'zod';
import { TransactionType } from 'generated/prisma';

export const TransactionQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 20)),
    account_uuid: z.string().uuid().optional(),
    instrument_uuid: z.string().uuid().optional(),
    type: z.nativeEnum(TransactionType).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    active_only: z
        .string()
        .optional()
        .transform((v) => v !== 'false'),
});

export type TransactionQueryType = z.infer<typeof TransactionQuerySchema>;
