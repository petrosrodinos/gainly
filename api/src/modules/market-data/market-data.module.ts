import { Module } from '@nestjs/common';
import { PrismaModule } from '@/core/databases/prisma/prisma.module';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { FxConversionService } from './services/fx-conversion.service';

@Module({
    imports: [PrismaModule],
    controllers: [MarketDataController],
    providers: [MarketDataService, FxConversionService],
    exports: [MarketDataService, FxConversionService],
})
export class MarketDataModule { }
