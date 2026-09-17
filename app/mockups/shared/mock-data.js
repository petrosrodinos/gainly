/* ==========================================================================
   invest-tax — mockup data
   Static fake data modeled on api/prisma/schema.prisma so every mockup page
   renders realistic, internally-consistent content. Nothing here is live —
   it exists only to make the HTML mockups readable at a glance.
   ========================================================================== */

const CURRENT_USER = {
  id: "u_1",
  name: "Petros Rodinos",
  email: "petros@hosperly.com",
  role: "USER",
  initials: "PR",
  plan: "Self-directed investor",
};

const ACCOUNTS = [
  { id: "acc_1", name: "Interactive Brokers — Main", currency: "USD", jurisdiction: "LT", cost_basis_method: "FIFO", created_at: "2023-02-11", value: 184230.42, day_change: 1284.11, day_change_pct: 0.70 },
  { id: "acc_2", name: "Trading212 — ISA", currency: "EUR", jurisdiction: "LT", cost_basis_method: "AVERAGE_COST", created_at: "2023-06-02", value: 42110.90, day_change: -312.55, day_change_pct: -0.74 },
  { id: "acc_3", name: "Binance — Crypto", currency: "USD", jurisdiction: "LT", cost_basis_method: "FIFO", created_at: "2024-01-19", value: 15870.10, day_change: 640.22, day_change_pct: 4.20 },
];

const INSTRUMENTS = [
  { id: "ins_1", isin: "US0378331005", ticker: "AAPL", name: "Apple Inc.", asset_class: "EQUITY", currency: "USD", exchange: "NASDAQ" },
  { id: "ins_2", isin: "US88160R1014", ticker: "TSLA", name: "Tesla, Inc.", asset_class: "EQUITY", currency: "USD", exchange: "NASDAQ" },
  { id: "ins_3", isin: "US5949181045", ticker: "MSFT", name: "Microsoft Corporation", asset_class: "EQUITY", currency: "USD", exchange: "NASDAQ" },
  { id: "ins_4", isin: "IE00B4L5Y983", ticker: "IWDA", name: "iShares Core MSCI World UCITS ETF", asset_class: "ETF", currency: "USD", exchange: "LSE" },
  { id: "ins_5", isin: "IE00B5BMR087", ticker: "CSPX", name: "iShares Core S&P 500 UCITS ETF", asset_class: "ETF", currency: "USD", exchange: "LSE" },
  { id: "ins_6", isin: "US67066G1040", ticker: "NVDA", name: "NVIDIA Corporation", asset_class: "EQUITY", currency: "USD", exchange: "NASDAQ" },
  { id: "ins_7", isin: null, ticker: "BTC", name: "Bitcoin", asset_class: "CRYPTO", currency: "USD", exchange: null },
  { id: "ins_8", isin: null, ticker: "ETH", name: "Ethereum", asset_class: "CRYPTO", currency: "USD", exchange: null },
  { id: "ins_9", isin: "US912828U816", ticker: "T 2.5 2029", name: "US Treasury Note 2.5% 2029", asset_class: "BOND", currency: "USD", exchange: null },
  { id: "ins_10", isin: "LU0000000001", ticker: "PIMCO-INC", name: "PIMCO Global Income Fund", asset_class: "FUND", currency: "EUR", exchange: null },
  { id: "ins_11", isin: null, ticker: null, name: "Private Real Estate SPV — Vilnius Lot 4", asset_class: "REAL_ESTATE", currency: "EUR", exchange: null, is_custom: true },
  { id: "ins_12", isin: "US0231351067", ticker: "AMZN", name: "Amazon.com, Inc.", asset_class: "EQUITY", currency: "USD", exchange: "NASDAQ" },
];

const POSITIONS = [
  { account_id: "acc_1", instrument_id: "ins_1", quantity: 120, cost_basis: 16800.00, price: 227.52, as_of: "2026-09-16" },
  { account_id: "acc_1", instrument_id: "ins_3", quantity: 60, cost_basis: 18200.00, price: 421.10, as_of: "2026-09-16" },
  { account_id: "acc_1", instrument_id: "ins_6", quantity: 90, cost_basis: 9400.00, price: 118.32, as_of: "2026-09-16" },
  { account_id: "acc_1", instrument_id: "ins_12", quantity: 40, cost_basis: 6800.00, price: 186.40, as_of: "2026-09-16" },
  { account_id: "acc_1", instrument_id: "ins_2", quantity: 55, cost_basis: 13750.00, price: 246.10, as_of: "2026-09-16" },
  { account_id: "acc_1", instrument_id: "ins_9", quantity: 15000, cost_basis: 14700.00, price: 98.60, as_of: "2026-09-16" },
  { account_id: "acc_2", instrument_id: "ins_4", quantity: 310, cost_basis: 25420.00, price: 96.80, as_of: "2026-09-16" },
  { account_id: "acc_2", instrument_id: "ins_5", quantity: 140, cost_basis: 12180.00, price: 98.40, as_of: "2026-09-16" },
  { account_id: "acc_2", instrument_id: "ins_10", quantity: 900, cost_basis: 4230.00, price: 4.86, as_of: "2026-09-16" },
  { account_id: "acc_3", instrument_id: "ins_7", quantity: 0.21, cost_basis: 9400.00, price: 61800.00, as_of: "2026-09-16" },
  { account_id: "acc_3", instrument_id: "ins_8", quantity: 2.4, cost_basis: 5100.00, price: 2870.00, as_of: "2026-09-16" },
];

const TRANSACTION_TYPES = ["BUY","SELL","DIVIDEND","INTEREST","FEE","TAX_WITHHOLDING","FX_CONVERSION","CORPORATE_ACTION","DEPOSIT","WITHDRAWAL"];

const TRANSACTIONS = [
  { id: "txn_1001", account_id: "acc_1", instrument_id: "ins_1", type: "BUY", trade_date: "2026-09-15", settlement_date: "2026-09-17", quantity: 20, price: 224.10, amount: -4482.00, fee: 1.00, currency: "USD", broker_ref: "IB-8841021", status: "committed" },
  { id: "txn_1002", account_id: "acc_1", instrument_id: "ins_3", type: "SELL", trade_date: "2026-09-12", settlement_date: "2026-09-14", quantity: 10, price: 418.30, amount: 4183.00, fee: 1.00, currency: "USD", broker_ref: "IB-8839902", status: "committed" },
  { id: "txn_1003", account_id: "acc_1", instrument_id: "ins_1", type: "DIVIDEND", trade_date: "2026-08-15", settlement_date: "2026-08-17", quantity: null, price: null, amount: 30.00, fee: 0, tax_withheld: 4.50, currency: "USD", broker_ref: "IB-DIV-2291", status: "committed" },
  { id: "txn_1004", account_id: "acc_1", instrument_id: "ins_6", type: "BUY", trade_date: "2026-08-01", settlement_date: "2026-08-03", quantity: 30, price: 112.40, amount: -3372.00, fee: 1.00, currency: "USD", broker_ref: "IB-8801233", status: "committed" },
  { id: "txn_1005", account_id: "acc_1", instrument_id: null, type: "DEPOSIT", trade_date: "2026-07-28", settlement_date: "2026-07-28", quantity: null, price: null, amount: 10000.00, fee: 0, currency: "USD", broker_ref: "IB-CASH-771", status: "committed" },
  { id: "txn_1006", account_id: "acc_1", instrument_id: "ins_2", type: "SELL", trade_date: "2026-07-19", settlement_date: "2026-07-21", quantity: 15, price: 252.80, amount: 3792.00, fee: 1.00, currency: "USD", broker_ref: "IB-8790021", status: "committed" },
  { id: "txn_1007", account_id: "acc_1", instrument_id: "ins_9", type: "INTEREST", trade_date: "2026-07-01", settlement_date: "2026-07-01", quantity: null, price: null, amount: 187.50, fee: 0, currency: "USD", broker_ref: "IB-INT-334", status: "committed" },
  { id: "txn_1008", account_id: "acc_2", instrument_id: "ins_4", type: "BUY", trade_date: "2026-09-10", settlement_date: "2026-09-12", quantity: 25, price: 95.90, amount: -2397.50, fee: 2.00, currency: "EUR", broker_ref: "T212-55021", status: "committed" },
  { id: "txn_1009", account_id: "acc_2", instrument_id: "ins_5", type: "BUY", trade_date: "2026-08-22", settlement_date: "2026-08-24", quantity: 12, price: 97.20, amount: -1166.40, fee: 2.00, currency: "EUR", broker_ref: "T212-54810", status: "committed" },
  { id: "txn_1010", account_id: "acc_2", instrument_id: "ins_10", type: "DIVIDEND", trade_date: "2026-08-05", settlement_date: "2026-08-06", quantity: null, price: null, amount: 41.20, fee: 0, tax_withheld: 6.18, currency: "EUR", broker_ref: "T212-DIV-119", status: "committed" },
  { id: "txn_1011", account_id: "acc_3", instrument_id: "ins_7", type: "BUY", trade_date: "2026-09-08", settlement_date: "2026-09-08", quantity: 0.05, price: 60100.00, amount: -3005.00, fee: 4.50, currency: "USD", broker_ref: "BIN-991021", status: "committed" },
  { id: "txn_1012", account_id: "acc_3", instrument_id: "ins_8", type: "SELL", trade_date: "2026-08-29", settlement_date: "2026-08-29", quantity: 0.6, price: 2760.00, amount: 1656.00, fee: 2.20, currency: "USD", broker_ref: "BIN-990410", status: "committed" },
  { id: "txn_1013", account_id: "acc_1", instrument_id: "ins_1", type: "BUY", trade_date: "2026-01-14", settlement_date: "2026-01-16", quantity: 50, price: 195.20, amount: -9760.00, fee: 1.00, currency: "USD", broker_ref: "IB-8601102", status: "committed" },
  { id: "txn_1014", account_id: "acc_1", instrument_id: "ins_3", type: "BUY", trade_date: "2026-02-02", settlement_date: "2026-02-04", quantity: 70, price: 388.10, amount: -27167.00, fee: 1.00, currency: "USD", broker_ref: "IB-8620044", status: "committed" },
  { id: "txn_1015", account_id: "acc_1", instrument_id: "ins_2", type: "BUY", trade_date: "2026-03-19", settlement_date: "2026-03-21", quantity: 70, price: 198.30, amount: -13881.00, fee: 1.00, currency: "USD", broker_ref: "IB-8655012", status: "committed" },
  { id: "txn_1016", account_id: "acc_1", instrument_id: "ins_1", type: "TAX_WITHHOLDING", trade_date: "2026-08-15", settlement_date: "2026-08-15", quantity: null, price: null, amount: -4.50, fee: 0, currency: "USD", broker_ref: "IB-DIV-2291-WHT", status: "committed" },
  { id: "txn_1017", account_id: "acc_2", instrument_id: null, type: "FX_CONVERSION", trade_date: "2026-06-11", settlement_date: "2026-06-11", quantity: null, price: null, amount: 0, fee: 3.10, fx_rate: 1.0821, currency: "EUR", broker_ref: "T212-FX-0087", status: "committed" },
  { id: "txn_1018", account_id: "acc_1", instrument_id: "ins_6", type: "CORPORATE_ACTION", trade_date: "2024-06-10", settlement_date: "2024-06-10", quantity: 60, price: null, amount: 0, fee: 0, currency: "USD", broker_ref: "CA-NVDA-SPLIT-10-1", status: "committed" },
];

const STAGED_TRANSACTIONS = [
  { id: "st_1", row_index: 2, raw: { Date: "2026/09/15", Ticker: "AAPL", Side: "BUY", Qty: "20", Price: "224.10" }, mapped: { trade_date: "2026-09-15", instrument: "AAPL", type: "BUY", quantity: 20, price: 224.10, amount: -4482.00 }, status: "PENDING_REVIEW", issue: null },
  { id: "st_2", row_index: 3, raw: { Date: "2026/09/16", Ticker: "GOOGL", Side: "BUY", Qty: "5", Price: "192.40" }, mapped: { trade_date: "2026-09-16", instrument: "GOOGL", type: "BUY", quantity: 5, price: 192.40, amount: -962.00 }, status: "PENDING_REVIEW", issue: "Unresolvable instrument — no ISIN/ticker match. Resolve manually." },
  { id: "st_3", row_index: 4, raw: { Date: "16-09-2026", Ticker: "MSFT", Side: "SELL", Qty: "8", Price: "421.10" }, mapped: { trade_date: "2026-09-16", instrument: "MSFT", type: "SELL", quantity: 8, price: 421.10, amount: 3368.80 }, status: "PENDING_REVIEW", issue: "Ambiguous date format (DD-MM-YYYY vs MM-DD-YYYY) — confirm interpretation." },
  { id: "st_4", row_index: 5, raw: { Date: "2026/09/12", Ticker: "TSLA", Side: "SELL", Qty: "10", Price: "418.30" }, mapped: { trade_date: "2026-09-12", instrument: "TSLA", type: "SELL", quantity: 10, price: 418.30, amount: 4183.00 }, status: "REJECTED", issue: "Likely duplicate of committed transaction txn_1002 (same broker ref)." },
  { id: "st_5", row_index: 6, raw: { Date: "2026/09/01", Ticker: "AAPL", Side: "DIV", Qty: "", Price: "" }, mapped: { trade_date: "2026-09-01", instrument: "AAPL", type: "DIVIDEND", amount: 32.00 }, status: "ACCEPTED", issue: null },
  { id: "st_6", row_index: 7, raw: { Date: "2026/08/29", Ticker: "NVDA", Side: "BUY", Qty: "12", Price: "" }, mapped: { trade_date: "2026-08-29", instrument: "NVDA", type: "BUY", quantity: 12, price: null }, status: "PENDING_REVIEW", issue: "Missing required field: price." },
];

const IMPORT_BATCHES = [
  { id: "ib_1", account_id: "acc_1", filename: "IBKR_Statement_2026-09.csv", file_type: "CSV", status: "NEEDS_REVIEW", rows: 6, flagged: 3, created_at: "2026-09-16 09:12", uploaded_by: "Petros Rodinos" },
  { id: "ib_2", account_id: "acc_2", filename: "trading212_export_aug.xlsx", file_type: "XLSX", status: "COMMITTED", rows: 18, flagged: 0, created_at: "2026-08-30 18:44", uploaded_by: "Petros Rodinos", committed_at: "2026-08-30 19:02" },
  { id: "ib_3", account_id: "acc_1", filename: "report-2025.xlsx", file_type: "XLSX", status: "COMMITTED", rows: 142, flagged: 2, created_at: "2026-02-01 10:03", uploaded_by: "Petros Rodinos", committed_at: "2026-02-01 10:20" },
  { id: "ib_4", account_id: "acc_3", filename: "binance_trades_q3.csv", file_type: "CSV", status: "PARTIALLY_COMMITTED", rows: 24, flagged: 4, created_at: "2026-09-09 08:15", uploaded_by: "Petros Rodinos", committed_at: "2026-09-09 08:40" },
  { id: "ib_5", account_id: "acc_2", filename: "isa_statement_scan.pdf", file_type: "PDF", status: "NEEDS_REVIEW", rows: 9, flagged: 2, created_at: "2026-09-14 21:30", uploaded_by: "Petros Rodinos" },
  { id: "ib_6", account_id: "acc_1", filename: "ibkr_2024_full_year.csv", file_type: "CSV", status: "FAILED", rows: 0, flagged: 0, created_at: "2026-09-05 12:00", uploaded_by: "Petros Rodinos", error: "Header row not found within first 40 rows — file may be malformed or password-protected." },
  { id: "ib_7", account_id: "acc_1", filename: "revolut_trading_export.csv", file_type: "CSV", status: "NEEDS_MAPPING", rows: 0, flagged: 0, created_at: "2026-09-15 14:20", uploaded_by: "Petros Rodinos" },
];

const MAPPING_TEMPLATES = [
  { id: "mt_1", name: "Interactive Brokers — Activity Statement (CSV)", scope: "Global", file_type: "CSV", uses: 482, updated_at: "2026-08-02" },
  { id: "mt_2", name: "Trading212 — Export (XLSX)", scope: "Global", file_type: "XLSX", uses: 311, updated_at: "2026-07-11" },
  { id: "mt_3", name: "invest-tax reference — ExecTrades/SecIncome (XLSX)", scope: "Global", file_type: "XLSX", uses: 96, updated_at: "2026-01-20" },
  { id: "mt_4", name: "Binance — Trade History (CSV)", scope: "Global", file_type: "CSV", uses: 205, updated_at: "2026-06-30" },
  { id: "mt_5", name: "Petros — Custom broker X mapping", scope: "Personal", file_type: "CSV", uses: 3, updated_at: "2026-05-14" },
];

const CORPORATE_ACTIONS = [
  { id: "ca_1", instrument_id: "ins_6", type: "SPLIT", effective_date: "2024-06-10", ratio: "10:1", details: "NVIDIA 10-for-1 stock split." },
  { id: "ca_2", instrument_id: "ins_2", type: "SPLIT", effective_date: "2022-08-25", ratio: "3:1", details: "Tesla 3-for-1 stock split." },
  { id: "ca_3", instrument_id: "ins_1", type: "DIVIDEND_REINVESTMENT", effective_date: "2026-05-15", ratio: null, details: "Optional DRIP election, 0.11 shares reinvested." },
  { id: "ca_4", instrument_id: "ins_10", type: "MERGER", effective_date: "2023-11-01", ratio: "1:0.92", details: "Fund merger into successor share class." },
];

const LOTS = [
  { id: "lot_1", account_id: "acc_1", instrument_id: "ins_1", opened_at: "2026-01-14", quantity_remaining: 50, cost_basis_per_unit: 195.20, closed_at: null },
  { id: "lot_2", account_id: "acc_1", instrument_id: "ins_1", opened_at: "2026-09-15", quantity_remaining: 20, cost_basis_per_unit: 224.10, closed_at: null },
  { id: "lot_3", account_id: "acc_1", instrument_id: "ins_1", opened_at: "2025-11-02", quantity_remaining: 50, cost_basis_per_unit: 172.40, closed_at: null },
  { id: "lot_4", account_id: "acc_1", instrument_id: "ins_2", opened_at: "2026-03-19", quantity_remaining: 55, cost_basis_per_unit: 198.30, closed_at: null },
  { id: "lot_5", account_id: "acc_1", instrument_id: "ins_2", opened_at: "2025-09-02", quantity_remaining: 0, cost_basis_per_unit: 240.10, closed_at: "2026-07-19" },
];

const TAX_YEARS = [
  { year: 2025, account_id: "acc_1", country: "LT", status: "FINALIZED", method: "FIFO", realized_gain: 8420.55, income: 612.30, est_liability: 1353.71, finalized_at: "2026-03-28" },
  { year: 2026, account_id: "acc_1", country: "LT", status: "DRAFT", method: "FIFO", realized_gain: 3190.20, income: 218.70, est_liability: 511.34, finalized_at: null },
  { year: 2025, account_id: "acc_2", country: "LT", status: "FINALIZED", method: "AVERAGE_COST", realized_gain: 1120.00, income: 140.10, est_liability: 189.62, finalized_at: "2026-03-28" },
  { year: 2026, account_id: "acc_2", country: "LT", status: "DRAFT", method: "AVERAGE_COST", realized_gain: 640.50, income: 41.20, est_liability: 102.90, finalized_at: null },
];

const REALIZED_LOTS_2026 = [
  { instrument: "TSLA", acquire_date: "2025-09-02", dispose_date: "2026-07-19", quantity: 15, proceeds: 3792.00, cost_basis: 3601.50, gain: 190.50, holding_days: 320, term: "Short-term" },
  { instrument: "MSFT", acquire_date: "2024-11-08", dispose_date: "2026-09-12", quantity: 10, proceeds: 4183.00, cost_basis: 3050.00, gain: 1133.00, holding_days: 673, term: "Long-term" },
  { instrument: "ETH", acquire_date: "2026-02-14", dispose_date: "2026-08-29", quantity: 0.6, proceeds: 1656.00, cost_basis: 1512.00, gain: 144.00, holding_days: 196, term: "Short-term" },
];

const DOCUMENTS = [
  { id: "doc_1", filename: "IBKR_Statement_2026-09.csv", type: "DOCUMENT", category: "STATEMENT", size: "128 KB", uploaded_at: "2026-09-16", linked: "Import batch ib_1" },
  { id: "doc_2", filename: "trading212_export_aug.xlsx", type: "DOCUMENT", category: "STATEMENT", size: "84 KB", uploaded_at: "2026-08-30", linked: "Import batch ib_2" },
  { id: "doc_3", filename: "LT-2025-tax-summary.pdf", type: "PDF", category: "TAX_FORM", size: "212 KB", uploaded_at: "2026-03-28", linked: "Tax year 2025 — IBKR Main" },
  { id: "doc_4", filename: "LT-2025-realized-gains.csv", type: "DOCUMENT", category: "TAX_FORM", size: "18 KB", uploaded_at: "2026-03-28", linked: "Tax year 2025 — IBKR Main" },
  { id: "doc_5", filename: "portfolio-report-Q2-2026.pdf", type: "PDF", category: "REPORT", size: "1.1 MB", uploaded_at: "2026-07-02", linked: "Manual report" },
  { id: "doc_6", filename: "binance_trades_q3.csv", type: "DOCUMENT", category: "STATEMENT", size: "62 KB", uploaded_at: "2026-09-09", linked: "Import batch ib_4" },
  { id: "doc_7", filename: "full-data-export-2026-06-30.zip", type: "OTHER", category: "GENERAL", size: "4.8 MB", uploaded_at: "2026-06-30", linked: "Self-service export" },
];

const NOTIFICATIONS = [
  { id: "n_1", title: "Import needs review", body: "IBKR_Statement_2026-09.csv has 3 rows flagged for review.", time: "2 hours ago", read: false, kind: "warning" },
  { id: "n_2", title: "Import committed", body: "trading212_export_aug.xlsx — 18 rows committed to Trading212 — ISA.", time: "Yesterday", read: false, kind: "success" },
  { id: "n_3", title: "Tax year finalized", body: "2025 tax computation for Interactive Brokers — Main was finalized.", time: "5 months ago", read: true, kind: "info" },
  { id: "n_4", title: "Filing deadline approaching", body: "Lithuania 2026 tax year filing deadline is in 46 days.", time: "1 day ago", read: false, kind: "warning" },
  { id: "n_5", title: "Import failed", body: "ibkr_2024_full_year.csv could not be parsed — header row not found.", time: "12 days ago", read: true, kind: "destructive" },
  { id: "n_6", title: "Portfolio digest", body: "Your August summary: +$1,842.30 (+1.1%) across 3 accounts.", time: "18 days ago", read: true, kind: "info" },
];

const AI_USAGE = [
  { date: "2026-09-16", user: "petros@hosperly.com", feature: "PDF statement extraction", tokens_in: 8210, tokens_out: 1120, cost_usd: 0.0421, batch: "ib_5" },
  { date: "2026-09-14", user: "petros@hosperly.com", feature: "PDF statement extraction", tokens_in: 6410, tokens_out: 940, cost_usd: 0.0332, batch: "ib_5" },
  { date: "2026-08-02", user: "anna@example.com", feature: "Mapping suggestion", tokens_in: 2100, tokens_out: 310, cost_usd: 0.0098, batch: "ib_x1" },
  { date: "2026-07-28", user: "marius@example.com", feature: "PDF statement extraction", tokens_in: 11200, tokens_out: 1560, cost_usd: 0.0564, batch: "ib_x2" },
  { date: "2026-07-15", user: "anna@example.com", feature: "Direct extraction (no template)", tokens_in: 4380, tokens_out: 720, cost_usd: 0.0247, batch: "ib_x3" },
];

const ADMIN_TRIAGE = [
  { id: "ib_5", user: "petros@hosperly.com", filename: "isa_statement_scan.pdf", status: "NEEDS_REVIEW", reason: "AI-extracted directly (PDFs never use mapping templates) — 2 rows below confidence threshold.", created_at: "2026-09-14" },
  { id: "ib_6", user: "petros@hosperly.com", filename: "ibkr_2024_full_year.csv", status: "FAILED", reason: "Header row not found within first 40 rows.", created_at: "2026-09-05" },
  { id: "ib_7", user: "petros@hosperly.com", filename: "revolut_trading_export.csv", status: "NEEDS_MAPPING", reason: "New broker format, no existing template match. AI mapping suggestion available.", created_at: "2026-09-15" },
  { id: "ib_x1", user: "anna@example.com", filename: "swedbank_export.csv", status: "NEEDS_MAPPING", reason: "New broker format, no existing template match. AI mapping suggestion available.", created_at: "2026-09-10" },
  { id: "ib_x2", user: "marius@example.com", filename: "scan_2026_07.pdf", status: "NEEDS_REVIEW", reason: "6 rows below extraction confidence threshold.", created_at: "2026-07-28" },
];

const AUDIT_LOG = [
  { id: "al_1", entity: "Transaction", entity_id: "txn_1001", action: "CREATE", user: "petros@hosperly.com", at: "2026-09-16 09:20" },
  { id: "al_2", entity: "ImportBatch", entity_id: "ib_2", action: "COMMIT", user: "petros@hosperly.com", at: "2026-08-30 19:02" },
  { id: "al_3", entity: "TaxYearComputation", entity_id: "tyc_2025_acc1", action: "FINALIZE", user: "petros@hosperly.com", at: "2026-03-28 11:14" },
  { id: "al_4", entity: "Account", entity_id: "acc_3", action: "CREATE", user: "petros@hosperly.com", at: "2024-01-19 16:02" },
  { id: "al_5", entity: "User", entity_id: "u_1", action: "LOGIN", user: "petros@hosperly.com", at: "2026-09-17 08:01" },
];

/* ---------- helpers ---------- */
const fmtMoney = (v, ccy = "USD", opts = {}) => {
  if (v === null || v === undefined) return "—";
  const sign = v < 0 ? "-" : "";
  const n = Math.abs(v);
  return sign + new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, minimumFractionDigits: 2, maximumFractionDigits: 2, ...opts }).format(n);
};
const fmtNum = (v, digits = 2) => v === null || v === undefined ? "—" : new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(v);
const fmtPct = (v) => (v === null || v === undefined) ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
const instrumentById = (id) => INSTRUMENTS.find((i) => i.id === id);
const accountById = (id) => ACCOUNTS.find((a) => a.id === id);
const totalPortfolioValue = () => ACCOUNTS.reduce((s, a) => s + a.value, 0);
