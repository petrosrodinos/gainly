export interface InstrumentHint {
    isin?: string | null;
    ticker?: string | null;
    exchange?: string | null;
    currency?: string | null;
    name?: string | null;
}

/** Mapped output of one source row — mirrors CreateTransactionDto loosely, still string-typed. */
export interface CanonicalRow {
    type?: string | null;
    trade_date?: string | null;
    settlement_date?: string | null;
    quantity?: string | null;
    price?: string | null;
    amount?: string | null;
    fee?: string | null;
    tax_withheld?: string | null;
    currency?: string | null;
    fx_rate?: string | null;
    broker_ref?: string | null;
    instrument_hint?: InstrumentHint;
    [key: string]: unknown;
}

export interface MappedRow {
    row_index: number;
    raw: Record<string, string | null>;
    mapped: CanonicalRow;
    mapping_errors: string[];
}
