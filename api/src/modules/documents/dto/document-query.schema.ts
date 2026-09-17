import { z } from 'zod';
import { DocumentCategory, DocumentType } from 'generated/prisma';

export const DocumentQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 20)),
    category: z.nativeEnum(DocumentCategory).optional(),
    type: z.nativeEnum(DocumentType).optional(),
    import_batch_uuid: z.string().optional(),
});

export type DocumentQueryType = z.infer<typeof DocumentQuerySchema>;
