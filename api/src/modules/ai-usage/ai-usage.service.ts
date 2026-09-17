import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { AI_USAGE_DAILY_COST_LIMIT_USD, RecordAiUsageParams } from './interfaces/ai-usage.interface';
import { AiUsageQueryType, AiUsageStatsQueryType } from './dto/ai-usage-query.schema';

@Injectable()
export class AiUsageService {
    constructor(private readonly prisma: PrismaService) { }

    async record(params: RecordAiUsageParams) {
        return this.prisma.aiUsageLog.create({
            data: {
                user_uuid: params.userUuid ?? null,
                feature: params.feature,
                provider: params.provider,
                model: params.model,
                input_tokens: params.inputTokens,
                output_tokens: params.outputTokens,
                cost_usd: params.costUsd,
                import_batch_uuid: params.importBatchUuid ?? null,
            },
        });
    }

    /** Throws when a user's AI-assisted-extraction spend for today is already at/over the daily cap. */
    async assertWithinDailyQuota(userUuid: string, limitUsd: number = AI_USAGE_DAILY_COST_LIMIT_USD) {
        const startOfDay = new Date(new Date().toISOString().slice(0, 10));

        const { _sum } = await this.prisma.aiUsageLog.aggregate({
            where: { user_uuid: userUuid, created_at: { gte: startOfDay } },
            _sum: { cost_usd: true },
        });

        const spentToday = _sum.cost_usd?.toNumber() ?? 0;
        if (spentToday >= limitUsd) {
            throw new BadRequestException(
                `Daily AI-assisted-extraction quota reached ($${limitUsd.toFixed(2)}). Try again tomorrow, or use manual entry / a mapping template for this file.`,
            );
        }
    }

    async findAll(query: AiUsageQueryType) {
        const where: Prisma.AiUsageLogWhereInput = {
            ...(query.user_uuid && { user_uuid: query.user_uuid }),
            ...(query.feature && { feature: query.feature }),
            ...((query.from || query.to) && {
                created_at: {
                    ...(query.from && { gte: new Date(query.from) }),
                    ...(query.to && { lte: new Date(query.to) }),
                },
            }),
        };

        const [items, count] = await Promise.all([
            this.prisma.aiUsageLog.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { created_at: 'desc' },
                include: { user: { select: { id: true, email: true } }, import_batch: { select: { id: true } } },
            }),
            this.prisma.aiUsageLog.count({ where }),
        ]);

        return {
            data: items,
            pagination: {
                total: count,
                page: query.page,
                limit: query.limit,
                total_pages: Math.ceil(count / query.limit),
                has_next: query.page < Math.ceil(count / query.limit),
                has_prev: query.page > 1,
            },
        };
    }

    async getStats(query: AiUsageStatsQueryType) {
        const since = new Date();
        since.setDate(since.getDate() - query.days);

        const rows = await this.prisma.aiUsageLog.findMany({ where: { created_at: { gte: since } } });

        const totalCost = rows.reduce((acc, r) => acc + r.cost_usd.toNumber(), 0);
        const totalCalls = rows.length;

        const byFeature = new Map<string, number>();
        for (const row of rows) {
            byFeature.set(row.feature, (byFeature.get(row.feature) ?? 0) + row.cost_usd.toNumber());
        }

        return {
            period_days: query.days,
            total_cost_usd: totalCost,
            total_calls: totalCalls,
            avg_cost_per_call_usd: totalCalls > 0 ? totalCost / totalCalls : 0,
            cost_by_feature: [...byFeature.entries()].map(([feature, cost_usd]) => ({ feature, cost_usd })),
        };
    }
}
