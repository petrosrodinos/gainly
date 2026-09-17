import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ParsedFile, ParserStrategy } from './parser-strategy.interface';
import { rowsFromMatrix } from './header.utils';

@Injectable()
export class XlsxParser implements ParserStrategy {
    async parse(buffer: Buffer): Promise<ParsedFile> {
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

        const sheets = workbook.SheetNames.filter((name) => {
            const sheet = workbook.Sheets[name];
            const range = sheet['!ref'];
            return !!range;
        }).map((name) => {
            const sheet = workbook.Sheets[name];
            const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: null });
            return rowsFromMatrix(matrix, name);
        });

        return { sheets: sheets.filter((s) => s.rows.length > 0) };
    }
}
