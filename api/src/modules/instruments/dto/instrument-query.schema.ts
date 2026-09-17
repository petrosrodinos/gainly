import { z } from 'zod';
import { AssetClass } from 'generated/prisma';

export const InstrumentQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 20)),
    search: z.string().optional(),
    asset_class: z.nativeEnum(AssetClass).optional(),
});

export type InstrumentQueryType = z.infer<typeof InstrumentQuerySchema>;
