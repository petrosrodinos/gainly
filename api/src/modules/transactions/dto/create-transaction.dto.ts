import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsNumberString,
    IsOptional,
    IsString,
    IsUUID,
    Length,
    Matches,
} from 'class-validator';
import { TransactionType } from 'generated/prisma';

export class CreateTransactionDto {
    @ApiProperty()
    @IsUUID()
    account_uuid: string;

    @ApiProperty({ required: false, description: 'Not needed for account-level cash movements (deposit/withdrawal)' })
    @IsOptional()
    @IsUUID()
    instrument_uuid?: string;

    @ApiProperty({ enum: TransactionType })
    @IsEnum(TransactionType)
    type: TransactionType;

    @ApiProperty({ example: '2025-01-09' })
    @IsDateString()
    trade_date: string;

    @ApiProperty({ required: false, example: '2025-01-11' })
    @IsOptional()
    @IsDateString()
    settlement_date?: string;

    @ApiProperty({ required: false, example: '24' })
    @IsOptional()
    @IsNumberString()
    quantity?: string;

    @ApiProperty({ required: false, example: '196.968' })
    @IsOptional()
    @IsNumberString()
    price?: string;

    @ApiProperty({ example: '4727.23' })
    @IsNumberString()
    amount: string;

    @ApiProperty({ required: false, default: '0', example: '2.38' })
    @IsOptional()
    @IsNumberString()
    fee?: string;

    @ApiProperty({ required: false, default: '0', example: '1.35' })
    @IsOptional()
    @IsNumberString()
    tax_withheld?: string;

    @ApiProperty({ example: 'USD' })
    @IsString()
    @Length(3, 3)
    @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO 4217 code' })
    currency: string;

    @ApiProperty({ required: false, example: '0.95831306996611' })
    @IsOptional()
    @IsNumberString()
    fx_rate?: string;

    @ApiProperty({ required: false, description: "Amount converted to the account's base currency" })
    @IsOptional()
    @IsNumberString()
    amount_base_currency?: string;

    @ApiProperty({ required: false, description: 'Broker trade/reference number, used for dedup' })
    @IsOptional()
    @IsString()
    broker_ref?: string;
}
