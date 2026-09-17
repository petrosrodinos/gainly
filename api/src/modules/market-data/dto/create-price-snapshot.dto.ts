import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { MarketDataSource } from 'generated/prisma';

export class CreatePriceSnapshotDto {
    @ApiProperty()
    @IsUUID()
    instrument_uuid: string;

    @ApiProperty({ example: '2025-01-09' })
    @IsDateString()
    date: string;

    @ApiProperty({ example: '196.968' })
    @IsNumberString()
    price: string;

    @ApiProperty({ example: 'USD' })
    @IsString()
    @Length(3, 3)
    @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO 4217 code' })
    currency: string;

    @ApiProperty({ enum: MarketDataSource, required: false, default: MarketDataSource.MANUAL })
    @IsOptional()
    @IsEnum(MarketDataSource)
    source?: MarketDataSource;
}
