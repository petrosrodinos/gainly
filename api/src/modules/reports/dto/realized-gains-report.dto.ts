import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
import { CostBasisMethod } from 'generated/prisma';

export class RealizedGainsReportDto {
    @ApiProperty({ example: 2025 })
    @IsInt()
    @Min(2000)
    @Max(2100)
    tax_year: number;

    @ApiProperty({ enum: CostBasisMethod, required: false })
    @IsOptional()
    @IsEnum(CostBasisMethod)
    cost_basis_method?: CostBasisMethod;

    @ApiProperty({ required: false, description: "Defaults to the account's jurisdiction" })
    @IsOptional()
    @IsString()
    @Length(2, 2)
    @Matches(/^[A-Z]{2}$/)
    country_code?: string;
}
