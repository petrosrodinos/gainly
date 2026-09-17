import { Injectable } from '@nestjs/common';
import { SourceFileType } from 'generated/prisma';
import { ParserStrategy } from './parser-strategy.interface';
import { XlsxParser } from './xlsx.parser';
import { CsvParser } from './csv.parser';
import { UnsupportedParser } from './unsupported.parser';

@Injectable()
export class ParserFactory {
    constructor(
        private readonly xlsxParser: XlsxParser,
        private readonly csvParser: CsvParser,
        private readonly unsupportedParser: UnsupportedParser,
    ) { }

    forFileType(fileType: SourceFileType): ParserStrategy {
        switch (fileType) {
            case 'XLS':
            case 'XLSX':
                return this.xlsxParser;
            case 'CSV':
                return this.csvParser;
            case 'PDF':
            case 'IMAGE':
            default:
                return this.unsupportedParser;
        }
    }
}
