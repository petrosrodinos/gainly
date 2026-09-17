# invest-tax

## What it is

invest-tax is a SaaS that turns the statements investors already get from their brokers — PDF, XLS/XLSX, CSV, and eventually scanned images — into a single, trustworthy source of truth for their portfolio: normalized transactions, computed holdings, portfolio statistics and diagrams, exportable reports, and country-specific investment-tax forms.

## Who it's for

Individual investors who hold accounts across multiple brokers/platforms and need to:
- see their real, consolidated portfolio in one place instead of piecing it together from broker apps and spreadsheets, and
- correctly compute and file capital-gains / investment-income taxes, without redoing the same manual reconciliation every year.

Each investor's data — accounts, transactions, documents — is owned directly by their user account, with no shared tenant in between.

## Core value props

1. **Trustworthy ingestion.** The system never silently guesses at what a row in a statement means. Anything it isn't confident about is staged for the user to review and correct before it becomes part of the permanent record. Once committed, a transaction is never silently edited — corrections are new, linked entries, so the history is always auditable.
2. **Multi-country from the ground up.** Tax rules are implemented as pluggable per-country modules behind a shared engine (lot matching, FX conversion, form export). Adding a new country is adding a module, not rewriting the tax engine — the product is not secretly shaped around one jurisdiction.
3. **Format-agnostic ingestion.** No hardcoded list of "supported brokers." Statement formats are recognized and parsed via reusable mapping templates (spreadsheet/column mappings, PDF/AI-assisted extraction, OCR for scans), so new sources are added by teaching the system a format, not shipping new integration code per broker.
4. **One place for portfolio truth.** Holdings, cost basis, realized/unrealized gains, dividend and interest income, and FX effects are all computed once, consistently, from the same immutable transaction ledger — the same numbers feed the dashboards, the reports, and the tax forms.

## High-level feature areas

See `docs/Product_Specification.md` for full detail on each of these.

- **Accounts** — per-user accounts, each with its own base currency and jurisdiction defaults.
- **Statement ingestion** — upload PDF/XLS/CSV, automatic format detection via mapping templates, staged review and correction, dedup, partial-success handling, safe re-import.
- **Portfolio & holdings** — accounts, instruments, the transaction ledger, lot-based cost basis (FIFO/avg-cost/LIFO where allowed), corporate actions, multi-currency.
- **Statistics & diagrams** — portfolio value over time, allocation breakdowns, realized vs. unrealized gains, dividend/interest income, tax-liability estimates, performance vs. benchmark.
- **Reporting & exports** — PDF portfolio reports, tax summaries (PDF + CSV/JSON), transaction ledger exports, full data export/backup.
- **Tax engine** — per-country pluggable rules, versioned/finalized yearly computations, data-driven tax form generation.
- **Admin/ops** — import failure triage, mapping-template curation, AI-usage cost visibility.

## Phased roadmap

**MVP — prove the trust loop.** One reference statement format (matching `docs/report-2025.xlsx`) parsed end-to-end, staged-review-then-commit, immutable ledger, FIFO cost basis, **one fully working country tax module** (not a stub), core dashboard (holdings, allocation, realized gains), CSV export and a basic tax summary PDF. Manual entry as a fallback. Everything here has to be *correct*, because it's someone's tax data — breadth comes later.

**v1 — breadth and robustness.** Done ahead of schedule: PDF ingestion, self-service mapping-template creation, and admin triage/AI-usage-cost tooling (all AI-assisted — see `docs/Product_Specification.md` §3/§8). Price/FX snapshots exist for unrealized-gain valuation (manual entry only so far, no live feed). Remaining: image/scan OCR, FX gain/loss as an actual taxable event (currently informational only), corporate actions beyond splits (merger/spin-off still need manual adjustment), average-cost applied to holdings (today it only affects tax computations, not the holdings dashboard), the full dashboard set, import/tax-year notifications, and a second and third country tax module to prove the plugin architecture generalizes.

**v2+ — advanced value.** Tax-loss harvesting hints and loss carryforward across years, benchmarking, a searchable document vault, optional read-only broker API integrations alongside file upload, an accountant/advisor collaborator role, full self-service data export/backup, and — at that point — Stripe-based billing tiers.

## Explicit non-goals for v1

- **Billing/monetization.** The boilerplate already has a Stripe module; it is not used or designed against in v1. The product is free/internal until the core is proven.
- **Live broker API sync.** v1 is file-upload only; API integrations are a later, additive option, not a dependency.
- **Hardcoding specific brokers.** No "Interactive Brokers module," "Trading212 module," etc. — new formats are handled through the generic mapping-template mechanism.
