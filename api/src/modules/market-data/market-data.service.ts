import { Injectable } from '@nestjs/common';
import { MarketDataSource } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { CreatePriceSnapshotDto } from './dto/create-price-snapshot.dto';
import { CreateFxRateSnapshotDto } from './dto/create-fx-rate-snapshot.dto';
import { FxRateSnapshotQueryType, PriceSnapshotQueryType } from './dto/market-data-query.schema';

@Injectable()
export class MarketDataService {
    constructor(private readonly prisma: PrismaService) { }

    async createPriceSnapshot(dto: CreatePriceSnapshotDto) {
        return this.prisma.priceSnapshot.upsert({
            where: {
                instrument_uuid_date_source: {
                    instrument_uuid: dto.instrument_uuid,
                    date: new Date(dto.date),
                    source: dto.source ?? MarketDataSource.MANUAL,
                },
            },
            create: {
                instrument_uuid: dto.instrument_uuid,
                date: new Date(dto.date),
                price: dto.price,
                currency: dto.currency,
                source: dto.source ?? MarketDataSource.MANUAL,
            },
            update: { price: dto.price, currency: dto.currency },
        });
    }

    async findPriceSnapshots(query: PriceSnapshotQueryType) {
        return this.prisma.priceSnapshot.findMany({
            where: {
                instrument_uuid: query.instrument_uuid,
                ...(query.from || query.to
                    ? {
                        date: {
                            ...(query.from && { gte: new Date(query.from) }),
                            ...(query.to && { lte: new Date(query.to) }),
                        },
                    }
                    : {}),
            },
            orderBy: { date: 'desc' },
        });
    }

    async createFxRateSnapshot(dto: CreateFxRateSnapshotDto) {
        return this.prisma.fxRateSnapshot.upsert({
            where: {
                base_currency_quote_currency_date_source: {
                    base_currency: dto.base_currency,
                    quote_currency: dto.quote_currency,
                    date: new Date(dto.date),
                    source: dto.source ?? MarketDataSource.MANUAL,
                },
            },
            create: {
                base_currency: dto.base_currency,
                quote_currency: dto.quote_currency,
                date: new Date(dto.date),
                rate: dto.rate,
                source: dto.source ?? MarketDataSource.MANUAL,
            },
            update: { rate: dto.rate },
        });
    }

    async findFxRateSnapshots(query: FxRateSnapshotQueryType) {
        return this.prisma.fxRateSnapshot.findMany({
            where: {
                base_currency: query.base_currency,
                quote_currency: query.quote_currency,
                ...(query.from || query.to
                    ? {
                        date: {
                            ...(query.from && { gte: new Date(query.from) }),
                            ...(query.to && { lte: new Date(query.to) }),
                        },
                    }
                    : {}),
            },
            orderBy: { date: 'desc' },
        });
    }
}
