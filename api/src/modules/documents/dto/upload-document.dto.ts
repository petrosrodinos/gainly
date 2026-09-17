import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DocumentCategory, DocumentType } from 'generated/prisma';

export class UploadDocumentDto {
    @ApiProperty({ enum: DocumentType, required: false, default: DocumentType.DOCUMENT })
    @IsOptional()
    @IsEnum(DocumentType)
    type?: DocumentType;

    @ApiProperty({ enum: DocumentCategory, required: false, default: DocumentCategory.GENERAL })
    @IsOptional()
    @IsEnum(DocumentCategory)
    category?: DocumentCategory;

    @ApiProperty({ required: false, description: 'Import batch this document belongs to, if any' })
    @IsOptional()
    @IsUUID()
    import_batch_uuid?: string;
}
