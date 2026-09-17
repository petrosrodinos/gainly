import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class PortfolioReportDto {
    @ApiProperty({ required: false, example: '2025-01-01' })
    @IsOptional()
    @IsDateString()
    period_from?: string;

    @ApiProperty({ required: false, example: '2025-12-31' })
    @IsOptional()
    @IsDateString()
    period_to?: string;
}
