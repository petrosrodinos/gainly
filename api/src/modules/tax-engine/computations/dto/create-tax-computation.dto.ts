import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';
import { CostBasisMethod } from 'generated/prisma';

export class CreateTaxComputationDto {
    @ApiProperty()
    @IsUUID()
    account_uuid: string;

    @ApiProperty({ example: 2025 })
    @IsInt()
    @Min(2000)
    @Max(2100)
    tax_year: number;

    @ApiProperty({ required: false, description: 'Defaults to the account\'s jurisdiction', example: 'LT' })
    @IsOptional()
    @IsString()
    @Length(2, 2)
    @Matches(/^[A-Z]{2}$/)
    country_code?: string;

    @ApiProperty({ enum: CostBasisMethod, required: false, description: "Defaults to the jurisdiction's default method" })
    @IsOptional()
    @IsEnum(CostBasisMethod)
    cost_basis_method?: CostBasisMethod;
}
