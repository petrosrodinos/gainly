import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { AssetClass } from 'generated/prisma';

export class CreateInstrumentDto {
    @ApiProperty({ required: false, description: 'ISIN, if known', example: 'US0378331005' })
    @IsOptional()
    @IsString()
    @Length(12, 12)
    isin?: string;

    @ApiProperty({ required: false, example: 'AAPL.US' })
    @IsOptional()
    @IsString()
    ticker?: string;

    @ApiProperty({ required: false, example: 'Apple Inc.' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ enum: AssetClass, default: AssetClass.OTHER })
    @IsEnum(AssetClass)
    asset_class: AssetClass;

    @ApiProperty({ description: 'ISO 4217 currency code', example: 'USD' })
    @IsString()
    @Length(3, 3)
    @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO 4217 code' })
    currency: string;

    @ApiProperty({ required: false, example: 'NASDAQ' })
    @IsOptional()
    @IsString()
    exchange?: string;
}
