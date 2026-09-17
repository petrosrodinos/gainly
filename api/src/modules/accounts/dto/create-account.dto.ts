import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches, MinLength } from 'class-validator';

export class CreateAccountDto {
    @ApiProperty({ description: 'Account name', example: 'Interactive Brokers' })
    @IsString()
    @MinLength(1)
    name: string;

    @ApiProperty({ description: 'ISO 4217 currency code', example: 'EUR' })
    @IsString()
    @Length(3, 3)
    @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO 4217 code' })
    currency: string;

    @ApiProperty({ description: 'ISO 3166-1 alpha-2 jurisdiction country code', example: 'LT' })
    @IsString()
    @Length(2, 2)
    @Matches(/^[A-Z]{2}$/, { message: 'jurisdiction must be a 2-letter ISO 3166-1 alpha-2 code' })
    jurisdiction: string;
}
