import { z } from 'zod';

export const PriceSnapshotQuerySchema = z.object({
    instrument_uuid: z.string().uuid(),
    from: z.string().optional(),
    to: z.string().optional(),
});
export type PriceSnapshotQueryType = z.infer<typeof PriceSnapshotQuerySchema>;

export const FxRateSnapshotQuerySchema = z.object({
    base_currency: z.string().length(3),
    quote_currency: z.string().length(3),
    from: z.string().optional(),
    to: z.string().optional(),
});
export type FxRateSnapshotQueryType = z.infer<typeof FxRateSnapshotQuerySchema>;
