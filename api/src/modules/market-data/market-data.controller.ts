import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { ZodValidationPipe } from '@/shared/pipes/zod.validation.pipe';
import { MarketDataService } from './market-data.service';
import { CreatePriceSnapshotDto } from './dto/create-price-snapshot.dto';
import { CreateFxRateSnapshotDto } from './dto/create-fx-rate-snapshot.dto';
import {
    FxRateSnapshotQuerySchema,
    FxRateSnapshotQueryType,
    PriceSnapshotQuerySchema,
    PriceSnapshotQueryType,
} from './dto/market-data-query.schema';

@ApiTags('Market Data')
@ApiBearerAuth()
@Controller('market-data')
@UseGuards(JwtGuard)
export class MarketDataController {
    constructor(private readonly marketDataService: MarketDataService) { }

    @Post('prices')
    @ApiOperation({ summary: 'Record a manual price snapshot for an instrument' })
    createPrice(@Body() dto: CreatePriceSnapshotDto) {
        return this.marketDataService.createPriceSnapshot(dto);
    }

    @Get('prices')
    @ApiOperation({ summary: 'List price snapshots for an instrument' })
    findPrices(@Query(new ZodValidationPipe(PriceSnapshotQuerySchema)) query: PriceSnapshotQueryType) {
        return this.marketDataService.findPriceSnapshots(query);
    }

    @Post('fx-rates')
    @ApiOperation({ summary: 'Record a manual FX rate snapshot' })
    createFxRate(@Body() dto: CreateFxRateSnapshotDto) {
        return this.marketDataService.createFxRateSnapshot(dto);
    }

    @Get('fx-rates')
    @ApiOperation({ summary: 'List FX rate snapshots for a currency pair' })
    findFxRates(@Query(new ZodValidationPipe(FxRateSnapshotQuerySchema)) query: FxRateSnapshotQueryType) {
        return this.marketDataService.findFxRateSnapshots(query);
    }
}
