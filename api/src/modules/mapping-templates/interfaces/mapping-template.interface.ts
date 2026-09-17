/**
 * Declarative "columns → canonical fields" shapes stored in MappingTemplate.detection_signature
 * and MappingTemplate.column_mapping (DESIGN.MD §4.4). Canonical target is always a Transaction
 * row for MVP (one StagedTransaction per source row).
 */

export interface SheetSignature {
    /** Matched against the parsed sheet/tab name (CSV files use a single "default" entry). */
    sheet_name: string;
    /** 0-based index of the header row within that sheet. */
    header_row_index: number;
    /** Normalized (trimmed, lowercased) header cell values that must all be present, in order, for a match. */
    required_headers: string[];
}

export interface DetectionSignature {
    sheets: SheetSignature[];
}

export type ColumnTransform = 'date' | 'decimal' | 'broker-amount-currency' | 'sign' | 'enum-map' | 'trim';

export interface ColumnRule {
    /** Canonical field on the staged/transaction row, e.g. "trade_date", "quantity", "instrument.isin". */
    field: string;
    transform?: ColumnTransform;
    /** For transform: "enum-map" — raw (trimmed) cell value -> canonical value. */
    enum_map?: Record<string, string>;
    /** For transform: "date" — a Luxon format string; defaults to ISO/"yyyy-MM-dd". */
    date_format?: string;
    /** Multiplies the parsed decimal by -1 when true (sign convention normalization). */
    negate?: boolean;
}

export interface SheetMapping {
    header_row_index: number;
    /** Normalized header cell value -> rule. */
    columns: Record<string, ColumnRule>;
    /** Canonical transaction "type" this sheet always produces (e.g. SecIncome rows are always DIVIDEND/INTEREST), when not column-driven. */
    default_type?: string;
}

export interface ColumnMapping {
    /** Keyed by sheet_name (matching DetectionSignature.sheets[].sheet_name). */
    sheets: Record<string, SheetMapping>;
}
