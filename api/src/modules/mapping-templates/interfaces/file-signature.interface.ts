/** What a parser reports about a freshly-uploaded file, for template detection. */
export interface FileSheetSignature {
    name: string;
    header_row_index: number;
    /** Normalized (trimmed, lowercased) header cell values. */
    headers: string[];
}

export interface FileSignature {
    sheets: FileSheetSignature[];
}

export interface TemplateDetectionMatch {
    template_id: string;
    /** template sheet_name -> actual sheet name in the uploaded file */
    sheet_name_map: Record<string, string>;
}
