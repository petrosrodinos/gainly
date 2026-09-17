import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { TaxFormFormat } from 'generated/prisma';

export class GenerateTaxFormDto {
    @ApiProperty({ example: 'LT_GPM_SUMMARY' })
    @IsString()
    form_type: string;

    @ApiProperty({ enum: TaxFormFormat, default: TaxFormFormat.PDF })
    @IsEnum(TaxFormFormat)
    format: TaxFormFormat;
}
