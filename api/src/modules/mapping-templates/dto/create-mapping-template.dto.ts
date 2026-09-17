import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { SourceFileType } from 'generated/prisma';
import { DetectionSignature, ColumnMapping } from '../interfaces/mapping-template.interface';

export class CreateMappingTemplateDto {
    @ApiProperty({ example: 'report-2025 (ExecTrades/SecIncome)' })
    @IsString()
    @MinLength(1)
    name: string;

    @ApiProperty({ enum: SourceFileType })
    @IsEnum(SourceFileType)
    file_type: SourceFileType;

    @ApiProperty({ description: 'Sheet/header fingerprint used to auto-detect this template' })
    @IsObject()
    detection_signature: DetectionSignature;

    @ApiProperty({ description: 'Sheet/column -> canonical field mapping' })
    @IsObject()
    column_mapping: ColumnMapping;

    @ApiProperty({ required: false, description: 'Admin-only: create as a global template available to all users' })
    @IsOptional()
    @IsBoolean()
    is_global?: boolean;
}
