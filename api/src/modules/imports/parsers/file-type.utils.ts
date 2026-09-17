import { BadRequestException } from '@nestjs/common';
import { SourceFileType } from 'generated/prisma';

export function detectSourceFileType(filename: string, mimetype: string): SourceFileType {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (ext === 'csv' || mimetype === 'text/csv') return 'CSV';
    if (ext === 'xlsx' || mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'XLSX';
    if (ext === 'xls' || mimetype === 'application/vnd.ms-excel') return 'XLS';
    if (ext === 'pdf' || mimetype === 'application/pdf') return 'PDF';
    if (['png', 'jpg', 'jpeg', 'tif', 'tiff'].includes(ext ?? '') || mimetype.startsWith('image/')) return 'IMAGE';

    throw new BadRequestException(`Unrecognized statement file type: ${filename}`);
}
