import { z } from 'zod';

/**
 * Runtime-validated mirror of interfaces/mapping-template.interface.ts. Templates can now come
 * from three places — the seed script, a hand-written admin/API call, or an AI mapping
 * suggestion — so `detection_signature`/`column_mapping` get validated before persisting rather
 * than trusted as opaque JSON.
 */

export const ColumnTransformSchema = z.enum(['date', 'decimal', 'broker-amount-currency', 'sign', 'enum-map', 'trim']);

export const ColumnRuleSchema = z.object({
    field: z.string().min(1),
    transform: ColumnTransformSchema.optional(),
    enum_map: z.record(z.string()).optional(),
    date_format: z.string().optional(),
    negate: z.boolean().optional(),
});

export const SheetMappingSchema = z.object({
    header_row_index: z.number().int().min(0),
    columns: z.record(ColumnRuleSchema),
    default_type: z.string().optional(),
});

export const ColumnMappingSchema = z.object({
    sheets: z.record(SheetMappingSchema),
});

export const SheetSignatureSchema = z.object({
    sheet_name: z.string().min(1),
    header_row_index: z.number().int().min(0),
    required_headers: z.array(z.string().min(1)).min(1),
});

export const DetectionSignatureSchema = z.object({
    sheets: z.array(SheetSignatureSchema).min(1),
});

export const MappingSuggestionSchema = z.object({
    name: z.string().min(1).describe('Short, human-readable name for this statement format, e.g. "Broker X trade confirmations"'),
    detection_signature: DetectionSignatureSchema,
    column_mapping: ColumnMappingSchema,
    notes: z.string().optional().describe('Anything uncertain or worth a human double-checking before saving this template'),
});

export type MappingSuggestion = z.infer<typeof MappingSuggestionSchema>;
