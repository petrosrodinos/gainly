export type CsvValue = string | number | boolean | null | undefined;

function escapeCsvCell(value: CsvValue): string {
    if (value === null || value === undefined) return '';
    const str = typeof value === 'object' ? String(value) : String(value);
    if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
    const lines = [headers.map(escapeCsvCell).join(',')];
    for (const row of rows) {
        lines.push(row.map(escapeCsvCell).join(','));
    }
    return lines.join('\r\n');
}

export function rowsFromObjects<T extends Record<string, CsvValue>>(
    columns: (keyof T)[],
    objects: T[],
): { headers: string[]; rows: CsvValue[][] } {
    return {
        headers: columns.map((c) => String(c)),
        rows: objects.map((obj) => columns.map((c) => obj[c])),
    };
}
