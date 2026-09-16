# invest-tax — Product Specification

See `PRODUCT.md` for the one-page pitch and roadmap, and `DESIGN.MD` for how this is implemented technically. This document is the functional specification: what the product must do.

## 1. Overview & Goals

invest-tax lets an investor upload the statements they already receive from their brokers/platforms (PDF, XLS/XLSX, CSV — images/scans later) and get back: a consolidated, correct portfolio; statistics and diagrams; exportable reports; and country-specific tax computations and forms.

**Goals:**
- Never present a number the system isn't confident is correct — ambiguity is surfaced to the user, not resolved by guessing.
- Support any investor regardless of which brokers they use or which country taxes their investment income.
- Make the annual tax-filing exercise a byproduct of good data, not a separate manual effort.

**Target users:** individual investors, initially self-directed and comfortable reviewing/correcting parsed data; later, their accountants/advisors as collaborators.

**Out of scope for v1:** billing/subscriptions, live broker API sync, image/scan (OCR) ingestion, any hardcoded per-broker integration, more than one active tax jurisdiction module (the *architecture* supports multiple from day one; the MVP *ships* one, fully correct, plus the scaffolding to add more).

## 2. Accounts & Organizations

- A user registers and automatically gets a personal **Organization** — every user belongs to at least one org; this is what makes the product multi-tenant from the start rather than bolted on later.
- An org has **Membership**s with roles: `OWNER`, `ADMIN`, `MEMBER`, `ACCOUNTANT_READONLY` (the last for inviting a tax preparer or advisor with read-only cross-account visibility).
- Invites are sent by email (reusing existing notification infra) and accepted into an existing or new user account.
- An org has a **base currency** and one or more **default tax jurisdictions**, used to pre-select conversions and available tax modules for its accounts.
- Within an org, a user can create multiple **Accounts** (portfolios) — e.g. one per broker, or one per family member — each with its own currency and jurisdiction.

## 3. Statement Ingestion

**Supported inputs (MVP):** XLS/XLSX/CSV. **v1 adds:** PDF (text-based and AI-assisted structured extraction) and image/scan (OCR). Multiple files can be uploaded in one batch.

**Flow:**
1. User uploads one or more files to an Account.
2. The system fingerprints each file (sheet/column headers for spreadsheets, text signature for PDFs) against a library of **mapping templates** — reusable definitions of "these columns/positions mean these canonical fields." Global templates ship with the product (starting with the format demonstrated by `docs/report-2025.xlsx`'s `ExecTrades`/`SecIncome` sheets); org-specific templates can be created when no match is found.
3. If a confident match is found, the file is parsed automatically. If not, the user is guided through a mapping wizard to define (and save, for reuse) a new template.
4. Parsed rows are **staged**, not committed — the user sees a review table with every row, its parsed interpretation, and any validation problems (unresolvable instrument, ambiguous date format, missing required field, likely duplicate).
5. The user corrects, accepts, or rejects staged rows (including re-resolving an instrument, fixing a mis-mapped column for the whole batch, or re-running the parse after adjusting the mapping).
6. On confirmation, accepted rows are committed as permanent, immutable transactions. Rows still flagged as problems can be left out and fixed later — **partial commit is allowed**, an entire batch is never blocked by a few bad rows.
7. **Deduplication:** rows matching an already-committed transaction by a natural key (account, broker reference/trade number, settlement date, amount, direction) are flagged so the same statement can be safely re-uploaded without creating duplicates.
8. **Amendment:** if a previously committed import turns out to be wrong, the fix is a new set of correcting transactions (see §4), never an edit to history — the original import batch and file remain visible for provenance.
9. **Manual entry:** a user can always add a transaction by hand instead of (or in addition to) importing, for brokers or events they don't have a statement for.

## 4. Portfolio & Holdings

- **Instrument catalog:** shared across the product (ISIN where available, else ticker+exchange), with asset class and currency; users can add custom/unlisted instruments where no catalog match exists.
- **Transaction ledger:** the single source of truth. Transaction types: buy, sell, dividend, interest, fee, tax withholding, FX conversion, corporate action, deposit, withdrawal. Every transaction is **immutable once committed** — a correction is recorded as a new, linked transaction, never an in-place edit or delete, so the full history is always reconstructable.
- **Holdings/positions** are always *computed* from the ledger (never hand-edited or treated as a source of truth), so they're guaranteed consistent with the transaction history.
- **Cost-basis methods:** FIFO is the default and always available. Average-cost is offered as a selectable alternative. LIFO is offered only where the account's tax jurisdiction explicitly permits it. The method is chosen per account and applied consistently to all its lot matching.
- **Corporate actions** (splits, mergers, spin-offs) adjust historical lots and quantities correctly rather than requiring the user to manually re-enter positions.
- **Multi-currency:** transactions are recorded in their native currency; the system also tracks the account's/org's base-currency-converted amounts using historical FX rates, and separately reports FX gain/loss where a jurisdiction taxes it.

## 5. Statistics & Diagrams

- Portfolio value over time.
- Asset allocation, viewable by asset class, instrument, currency, and country.
- Realized vs. unrealized gains by year, with drill-down to the underlying lots/transactions.
- Dividend and interest income by year and by instrument.
- Estimated tax liability by year — clearly labeled as an **estimate** until that tax year's computation is finalized.
- Cost-basis / open-lot breakdown per holding.
- Performance (time-weighted and money-weighted return) with an optional benchmark overlay.

## 6. Reporting & Exports

- **PDF portfolio report** — holdings, allocation, and performance summary for a chosen period.
- **Tax summary** — both a human-readable PDF and a machine-readable CSV/JSON, per tax year, derived from that year's tax computation.
- **Transaction ledger CSV** — full export of an account's or org's transaction history.
- **Realized gains/losses schedule CSV** — usable on its own by a tax preparer, independent of the built-in filing flow.
- **Full data export/backup** — a self-service, on-demand archive of everything a user has stored (transactions, documents, computations), covering both data-portability requests and basic user trust ("I can always get my data out").

## 7. Tax Engine

- Tax rules are implemented per country as pluggable modules behind a shared engine (see `DESIGN.MD` §5 for the technical interface). Each module encodes: which cost-basis methods it allows and its default, how gains/losses and income are classified and aggregated, allowances/exemptions, and loss carryforward rules.
- A **tax-year computation** takes an account's (or org's) transactions for a year and produces: realized gains/losses (per disposal, with acquire/dispose dates, proceeds, cost basis, and holding period), dividend and interest income totals, FX gain/loss, available withholding-tax credits, allowances applied, loss carryforward used/remaining, and an estimated total tax liability.
- Computations are **versioned**: a computation starts as `DRAFT`, can be recalculated freely as underlying data changes, and becomes `FINALIZED` (locked) when the user files it — any later change to source data produces a new draft version rather than silently altering a filed result.
- **Tax form generation** turns a finalized (or draft, for preview) computation into an actual exportable form, via a declarative per-country/per-form template — adding a new form or country does not require changing the computation engine itself.

## 8. Notifications & Admin/Ops

- Notifications: import completed / needs review / failed; tax year opened / deadline approaching; portfolio digest (periodic summary email).
- Admin tooling: a triage view for failed or low-confidence parses across users (to spot patterns and improve global mapping templates), curation of the global mapping-template library, and visibility into AI-assisted-extraction usage/cost (the existing AI integration already tracks token cost per call).

## 9. Security, Privacy & Compliance

- Strict tenant isolation: a user only ever sees data belonging to organizations they're a member of.
- Every domain mutation (imports, corrections, tax-year finalization, admin actions) is captured in an append-only audit log.
- The transaction ledger is immutable by design (§4) — this is both a trust property and an audit requirement.
- Self-service export and account/data deletion, in line with data-portability and right-to-erasure expectations for financial personal data.

## 10. Non-Functional Requirements

- **Precision:** all monetary and quantity values use fixed-point decimal arithmetic throughout — never floating point — since this is tax-relevant financial data.
- **Idempotency:** re-processing an import job (e.g. after a retry) must not create duplicate transactions.
- **Graceful degradation on ambiguity:** the system prefers leaving a row `NEEDS_REVIEW` over guessing; it never auto-commits a low-confidence interpretation.
- **Responsiveness/accessibility:** the web app works across desktop and mobile viewports, built on the existing shadcn/Tailwind component library already in `app/`.
- **Performance:** dashboards and reports should reflect recomputation from potentially thousands of transactions without blocking the UI — heavy computation runs as background jobs, with the UI reflecting progress/results asynchronously.
