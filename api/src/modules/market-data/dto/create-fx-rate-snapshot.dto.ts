import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString, Length, Matches } from 'class-validator';
import { MarketDataSource } from 'generated/prisma';

export class CreateFxRateSnapshotDto {
    @ApiProperty({ example: 'USD' })
    @IsString()
    @Length(3, 3)
    @Matches(/^[A-Z]{3}$/)
    base_currency: string;

    @ApiProperty({ example: 'EUR' })
    @IsString()
    @Length(3, 3)
    @Matches(/^[A-Z]{3}$/)
    quote_currency: string;

    @ApiProperty({ example: '2025-01-09' })
    @IsDateString()
    date: string;

    @ApiProperty({ example: '0.95831306996611' })
    @IsNumberString()
    rate: string;

    @ApiProperty({ enum: MarketDataSource, required: false, default: MarketDataSource.MANUAL })
    @IsOptional()
    @IsEnum(MarketDataSource)
    source?: MarketDataSource;
}
