import { z } from 'zod';
import { TaxComputationStatus } from 'generated/prisma';

export const TaxComputationQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 20)),
    account_uuid: z.string().uuid().optional(),
    tax_year: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : undefined)),
    status: z.nativeEnum(TaxComputationStatus).optional(),
});

export type TaxComputationQueryType = z.infer<typeof TaxComputationQuerySchema>;
