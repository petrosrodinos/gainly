export function normalizeHeader(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
}

/** First row with at least 3 non-empty cells, within the first 5 rows — else row 0. */
export function detectHeaderRowIndex(rows: unknown[][]): number {
    const scanLimit = Math.min(rows.length, 5);
    for (let i = 0; i < scanLimit; i++) {
        const nonEmpty = (rows[i] ?? []).filter((c) => c !== null && c !== undefined && String(c).trim() !== '').length;
        if (nonEmpty >= 3) return i;
    }
    return 0;
}

export function rowsFromMatrix(matrix: unknown[][], sheetName: string): { name: string; header_row_index: number; headers: string[]; rows: Record<string, string | null>[] } {
    const headerRowIndex = detectHeaderRowIndex(matrix);
    const headerRow = matrix[headerRowIndex] ?? [];
    const headers = headerRow.map(normalizeHeader);

    const rows: Record<string, string | null>[] = [];
    for (let i = headerRowIndex + 1; i < matrix.length; i++) {
        const rawRow = matrix[i] ?? [];
        const hasContent = rawRow.some((c) => c !== null && c !== undefined && String(c).trim() !== '');
        if (!hasContent) continue;

        const row: Record<string, string | null> = {};
        headers.forEach((header, colIndex) => {
            if (!header) return;
            const cell = rawRow[colIndex];
            row[header] = cell === null || cell === undefined ? null : String(cell).trim();
        });
        rows.push(row);
    }

    return { name: sheetName, header_row_index: headerRowIndex, headers, rows };
}
