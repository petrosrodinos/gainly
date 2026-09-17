export interface ParsedSheet {
    name: string;
    header_row_index: number;
    /** Normalized (trimmed, lowercased) header cell values, in column order. */
    headers: string[];
    /** Each row keyed by normalized header. */
    rows: Record<string, string | null>[];
}

export interface ParsedFile {
    sheets: ParsedSheet[];
}

export interface ParserStrategy {
    parse(buffer: Buffer): Promise<ParsedFile>;
}
