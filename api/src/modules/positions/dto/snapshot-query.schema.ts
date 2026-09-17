import { z } from 'zod';

export const PositionSnapshotQuerySchema = z.object({
    instrument_uuid: z.string().uuid().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
});

export type PositionSnapshotQueryType = z.infer<typeof PositionSnapshotQuerySchema>;
