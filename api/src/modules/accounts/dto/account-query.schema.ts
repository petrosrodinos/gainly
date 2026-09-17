import { z } from 'zod';

export const AccountQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 20)),
    search: z.string().optional(),
    order_by: z.enum(['created_at', 'name']).optional().default('created_at'),
    order_direction: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type AccountQueryType = z.infer<typeof AccountQuerySchema>;
