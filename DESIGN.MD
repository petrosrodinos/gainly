# invest-tax — Technical Design

See `PRODUCT.md` for the pitch/roadmap and `docs/Product_Specification.md` for full functional requirements. This document describes how the product is built, on top of the SaaS boilerplate already scaffolded in this repo.

## 1. Architecture Overview

Nothing here replaces the existing scaffold — it's extended.

**Backend (`api/`)** — NestJS 11 + Prisma 7 + PostgreSQL, already providing:
- Auth (`api/src/modules/auth/`): JWT, email/password, password reset.
- `api/src/core/databases/prisma/`, `api/src/core/databases/redis/`: DB and cache access, reused as-is.
- `api/src/core/queues/` (BullMQ + bull-board): reused for import processing and recomputation jobs; new queue name constants added to `queues.constants.ts`.
- `api/src/integrations/storage/gcs/`: GCS file storage, reused for statement uploads and generated reports/forms; new folder keys added to `gcs-folders.config.ts`.
- `api/src/integrations/ai/services/ai.service.ts`: `AiService.generateTextWithSchema` (Zod-schema-constrained `generateObject`, 3x retry) is reused directly for PDF/AI-assisted statement extraction — no new AI plumbing needed, just new prompts/schemas for transaction rows.
- `api/src/integrations/notifications/`: Resend/SMTP email + Twilio SMS, reused for invites and import/tax notifications.
- `api/src/modules/stripe/`: present, **not wired into any v1 feature**.

**Frontend (`app/`)** — React 19 + Vite 7 + shadcn/Tailwind + TanStack Query + Zustand + React Router 7, already providing the app shell, auth flow, file-upload and data-table components, and a websocket provider used here to stream import-processing progress.

**New pieces this product adds:** the investment domain data model, the statement ingestion pipeline, the tax engine, and the dashboards/reports built on top of them.

## 2. Data Isolation

**Decision: row-level isolation via `user_id`, no tenant layer.**

There is no organization/tenant concept — every domain table (except shared reference data like the global `Instrument` catalog and market-data tables) carries a `user_id` directly. Isolation is enforced in two layers:
1. **Application layer** — a Prisma Client Extension (or a request-scoped repository base) that automatically injects the current request's `user_id` into every query, so individual services can't forget to scope a query.
2. **Database layer (defense in depth)** — Postgres Row-Level Security policies keyed on a session variable (`SET app.current_user_id`) set per request, so even a bug that bypasses the application-layer scoping still can't leak another user's data.

## 3. Domain Data Model

Extends `api/prisma/schema.prisma` (currently just `User`, `PasswordResetToken`, `Document`). New models:

| Model | Purpose | Key fields |
|---|---|---|
| `Account` | A user's portfolio | user_id, name, currency, jurisdiction |
| `MappingTemplate` | Reusable "columns → canonical fields" definition | user_id (nullable = global), file_type, detection_signature, column_mapping |
| `ImportBatch` | One upload/processing run | user_id, account_id, status, source Document, error_summary |
| `StagedTransaction` | Pre-commit parsed row | import_batch_id, raw_data, mapped_data, status, validation_errors |
| `Instrument` | Shared security catalog | isin (nullable), ticker, name, asset_class, currency |
| `Transaction` | The immutable ledger | user_id, account_id, instrument_id, type, dates, quantity/price/amount/fee (Decimal), currency, fx_rate, broker_ref, `supersedes_id` |
| `CorporateAction` | Split/merger/spin-off events | instrument_id, type, effective_date, ratio |
| `Lot` | Explicit cost-basis lot for FIFO/LIFO/avg-cost | account_id, instrument_id, open_transaction_id, quantity_remaining, cost_basis_per_unit |
| `PositionSnapshot` | Computed/cached holdings (never source of truth) | recomputed by background jobs |
| `PriceSnapshot` / `FxRateSnapshot` | Valuation & conversion data | instrument/currency, date, rate/price, source |
| `TaxJurisdictionModule` | Registry of available country rule modules | country_code, version, is_active, default cost-basis method |
| `TaxYearComputation` | A year's tax result for an account | country_code, tax_year, status (`DRAFT/FINALIZED`), result JSON, versioned |
| `TaxForm` | Generated filing output | tax_year_computation_id, form_type, document_id, format |
| `Document` (extended) | Reuse existing model | + user_uuid, optional import_batch_id, category (STATEMENT/TAX_FORM/REPORT/...) |
| `AuditLog` | Append-only mutation trail | user_id, entity_type/id, action, before/after JSON |

**Immutability rule:** `Transaction` rows are never `UPDATE`d or `DELETE`d after commit — a correction is inserted as a new row linked via `supersedes_id`. `TaxYearComputation` follows the same versioning idea once `FINALIZED`.

## 4. Statement Ingestion Pipeline

1. **Upload** — frontend reuses `app/src/components/ui/file-upload.tsx`; file streams to GCS under a user-scoped path (`users/{userId}/imports/{batchId}/{filename}`), new `GcsFolders` keys (`imports`, `reports`, `tax-forms`) added alongside the existing `documents`/`avatars`/`uploads`. A `Document` row records the raw file.
2. **`ImportBatch` created** (`UPLOADED`) → job enqueued on a new `import-processing` BullMQ queue, processed by a new `api/src/modules/imports/` module (visible in bull-board automatically, same infra as existing queues).
3. **Format/broker detection** — the processor fingerprints the file (sheet names + header row for spreadsheets; text signature for PDFs) against `MappingTemplate`s (user-specific checked before global). A confident match auto-assigns the template; no match → `NEEDS_MAPPING`, and the user is walked through a mapping wizard whose result is saved as a new reusable template.
4. **Parsing strategy per file type** (one `ParserStrategy` interface, one implementation per type):
   - **XLS/XLSX/CSV** — a sheet/column-mapping engine driven by the template's JSON config (`sheet → column → canonical field`, with per-column transforms for dates, decimals, sign conventions). The first built-in global template targets exactly the format in `docs/report-2025.xlsx` (`ExecTrades`/`SecIncome` sheets).
   - **PDF** (v1) — text/table extraction first; if a layout mapping template exists, use it; otherwise fall back to AI-assisted structured extraction via `AiService.generateTextWithSchema`, given a Zod schema shaped like the canonical transaction row.
   - **Image/scan** (v1) — OCR pass, then the same AI-assisted-extraction fallback as PDF.
5. **Normalization** — rows become canonical Transaction DTOs; instruments resolved by ISIN first, then ticker+exchange; all monetary/quantity fields parsed as `Decimal`, never `number`.
6. **Validation & dedup** — per-row validation with explicit failure reasons; dedup via a composite key (`account_id + broker_ref + settlement_date + amount + direction`) against already-committed transactions.
7. **Staging** — persisted as `StagedTransaction` (`PENDING_REVIEW`); the committed `Transaction` table is never touched at this point.
8. **Review/correction** — a staged-row table (inline edit, accept/reject, re-resolve instrument, "fix mapping and re-parse"); progress streamed via the existing websocket provider/domain pattern (`app/src/features/websocket/`).
9. **Commit** — confirmed rows become immutable `Transaction`s in one DB transaction; separate `recompute-positions` and `recompute-tax-year` jobs are enqueued afterward so the commit request itself stays fast.
10. **Failure handling** — a batch can partially succeed: clean rows commit, ambiguous ones stay `NEEDS_REVIEW`; failures retain their raw/intermediate artifacts in GCS for the admin triage view rather than being discarded.

## 5. Tax Engine Architecture

One implementation per country under `api/src/modules/tax-engine/jurisdictions/{countryCode}/`, behind a shared interface:

```ts
interface TaxJurisdictionRuleModule {
  countryCode: string;                 // ISO 3166-1 alpha-2
  version: string;
  supportedCostBasisMethods: CostBasisMethod[];
  defaultCostBasisMethod: CostBasisMethod;
  computeTaxYear(input: TaxComputationInput): TaxComputationResult;
}
```

- `TaxComputationInput`: tax year, transactions, lots, prior-year carryforward loss, FX rates, chosen cost-basis method.
- `TaxComputationResult`: per-disposal realized gain/loss lines (instrument, acquire/dispose date, proceeds, cost basis, gain/loss, holding period), dividend/interest income, FX gain/loss, available withholding credits, allowances applied, loss carryforward used/remaining, estimated liability, warnings.
- A `TaxRuleRegistry` provider maps `countryCode → module instance`. Shared mechanics that every country module would otherwise reimplement live in reusable services instead: `LotMatchingService` (FIFO/LIFO/avg-cost over `Lot` records) and `FxConversionService`. A country module mainly supplies allowance rules, taxable-event classification, and rate/form mapping — **adding a country means adding a folder + registry entry, not touching the shared engine.**
- **Cost-basis defaults:** FIFO by default; average-cost offered only where a module opts in; LIFO exposed only where a module explicitly allows it.
- **Form export** stays data-driven: a `TaxFormTemplate` per country/form is a declarative JSON mapping (form field → path/expression into `TaxComputationResult`), rendered to PDF or flattened to CSV as a queued job producing a `Document` linked to the `TaxYearComputation` — so a new form/country doesn't require code changes to the computation engine.

## 6. Module/Folder Layout

**`api/src/modules/`** (new): `accounts/`, `instruments/`, `imports/` (+ `imports/processors/`), `transactions/`, `positions/`, `corporate-actions/`, `tax-engine/` (core + `jurisdictions/{lt,...}/` + `computations/` + `forms/`), `market-data/`, `reports/`, `audit-log/`, `documents/` (promoting `Document` from a bare Prisma model to a real user-scoped module), `admin/` (import triage, mapping-template curation, AI-usage dashboard). Existing `integrations/ai/` gains a statement-extraction prompt/schema helper.

**`app/src/features/`** (new): `accounts/`, `imports/` (upload wizard, mapping editor, staged-row review), `transactions/`, `instruments/`, `positions/`, `dashboard/`, `tax/` (year selector, computation results, form generation, finalize), `reports/`, `documents/`, `admin/*`.

**`app/src/pages/`** (new routes): `/app/dashboard`, `/app/accounts`, `/app/imports`, `/app/imports/:batchId/review`, `/app/transactions`, `/app/holdings`, `/app/tax/:year`, `/app/reports`, `/app/documents`, `/admin/imports`.

## 7. Frontend Charting

**Decision: Recharts.** It composes naturally with the existing Tailwind/shadcn setup (SVG + className styling, no separate theming system to integrate) and covers every chart type this product needs (line/area/bar/pie) with the least setup. *Tradeoff:* it has a lower ceiling for bespoke interaction and large-dataset performance than a low-level toolkit like visx — acceptable since these charts are yearly/per-instrument aggregates, not tick-level data. Revisit only if a specific chart later needs something Recharts can't do.

## 8. Non-Functional / Technical Decisions

- **Money handling:** Postgres `numeric` / Prisma `Decimal` everywhere monetary or quantity data is stored; arithmetic in services uses a fixed-point decimal type consistently; raw JS `number` math on money is disallowed except at the UI display edge.
- **Immutability & audit:** committed `Transaction`s are append-only (§3); every domain mutation writes an `AuditLog` entry in the same DB transaction as the mutation, so it can't be bypassed; raw source files persist permanently in GCS for provenance; `TaxYearComputation` is versioned and immutable once `FINALIZED`.
- **Backup/export:** a self-service "export everything" job (transactions CSV, documents archive, tax computations JSON) reuses the report-generation pipeline to produce a downloadable archive.
- **Ambiguity handling:** low-confidence rows always route to `NEEDS_REVIEW`/`NEEDS_MAPPING` with a specific reason; batches support partial commit; the admin triage view aggregates failure patterns across users to improve global mapping templates over time.
- **Idempotency:** import-commit is safe to retry (BullMQ job retries) without producing duplicate transactions.
- **Dates:** trade_date and settlement_date are tracked separately; a jurisdiction's tax year is a property of its rule module, not assumed to be the calendar year globally.
- **AI usage:** per-user rate limits/quotas on AI-assisted extraction, reusing the AI module's existing cost-tracking utility (`api/src/integrations/ai/utils/ai-cost.ts`).
