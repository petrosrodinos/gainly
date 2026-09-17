import { z } from 'zod';
import { SourceFileType } from 'generated/prisma';

export const MappingTemplateQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 20)),
    file_type: z.nativeEnum(SourceFileType).optional(),
});

export type MappingTemplateQueryType = z.infer<typeof MappingTemplateQuerySchema>;
