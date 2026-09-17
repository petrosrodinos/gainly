export const AiUsageFeatures = {
    PDF_EXTRACTION: 'pdf-extraction',
    FALLBACK_EXTRACTION: 'fallback-extraction',
    MAPPING_SUGGESTION: 'mapping-suggestion',
} as const;

export type AiUsageFeature = (typeof AiUsageFeatures)[keyof typeof AiUsageFeatures];

/** Reasonable MVP default — DESIGN.MD §8: "per-user rate limits/quotas on AI-assisted extraction." */
export const AI_USAGE_DAILY_COST_LIMIT_USD = 1.0;

export interface RecordAiUsageParams {
    userUuid?: string | null;
    feature: AiUsageFeature;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    importBatchUuid?: string | null;
}
