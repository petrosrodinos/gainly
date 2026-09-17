import { z } from 'zod';

export const AiUsageQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 20)),
    user_uuid: z.string().uuid().optional(),
    feature: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
});
export type AiUsageQueryType = z.infer<typeof AiUsageQuerySchema>;

export const AiUsageStatsQuerySchema = z.object({
    days: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 30)),
});
export type AiUsageStatsQueryType = z.infer<typeof AiUsageStatsQuerySchema>;
