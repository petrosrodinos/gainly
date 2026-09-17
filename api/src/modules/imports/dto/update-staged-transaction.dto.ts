import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';
import { StagedTransactionStatus } from 'generated/prisma';

export class UpdateStagedTransactionDto {
    @ApiProperty({ required: false, description: 'Corrected canonical row data (merged over the current mapped_data)' })
    @IsOptional()
    @IsObject()
    mapped_data?: Record<string, unknown>;

    @ApiProperty({ enum: StagedTransactionStatus, required: false })
    @IsOptional()
    @IsEnum(StagedTransactionStatus)
    status?: StagedTransactionStatus;

    @ApiProperty({ required: false, description: 'Manually re-resolve the instrument for this row' })
    @IsOptional()
    @IsUUID()
    resolved_instrument_uuid?: string;
}
