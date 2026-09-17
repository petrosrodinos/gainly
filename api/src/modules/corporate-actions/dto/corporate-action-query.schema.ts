import { z } from 'zod';

export const CorporateActionQuerySchema = z.object({
    instrument_uuid: z.string().uuid(),
});

export type CorporateActionQueryType = z.infer<typeof CorporateActionQuerySchema>;
