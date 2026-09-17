import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { ParsedFile, ParserStrategy } from './parser-strategy.interface';
import { rowsFromMatrix } from './header.utils';

@Injectable()
export class CsvParser implements ParserStrategy {
    async parse(buffer: Buffer): Promise<ParsedFile> {
        const matrix: unknown[][] = parse(buffer, {
            relax_column_count: true,
            skip_empty_lines: true,
            bom: true,
        });

        return { sheets: [rowsFromMatrix(matrix, 'default')] };
    }
}
