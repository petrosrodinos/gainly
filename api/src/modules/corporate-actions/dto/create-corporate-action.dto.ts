import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumberString, IsObject, IsOptional, IsUUID } from 'class-validator';
import { CorporateActionType } from 'generated/prisma';

export class CreateCorporateActionDto {
    @ApiProperty()
    @IsUUID()
    instrument_uuid: string;

    @ApiProperty({ enum: CorporateActionType })
    @IsEnum(CorporateActionType)
    type: CorporateActionType;

    @ApiProperty({ example: '2025-06-10' })
    @IsDateString()
    effective_date: string;

    @ApiProperty({
        required: false,
        description: 'New units per old unit (e.g. "2" for a 2-for-1 split). Required for SPLIT/REVERSE_SPLIT.',
        example: '2',
    })
    @IsOptional()
    @IsNumberString()
    ratio?: string;

    @ApiProperty({ required: false, description: 'Free-form event details (e.g. merger/spinoff allocation)' })
    @IsOptional()
    @IsObject()
    details?: Record<string, unknown>;
}
