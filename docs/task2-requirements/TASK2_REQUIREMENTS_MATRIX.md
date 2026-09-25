# Milestone 5 / Task 2 — Requirements-to-Status Matrix

Every requirement from the SOW and the five requirements PDFs, checked against the live
Supabase project (`mavbnybtyfewfsihmuri`) and the `main` branch of this repo.

- **Verified date:** 2026-09-25
- **Method:** read-only SQL against the live database, plus source inspection. Claims marked
  *verified* were checked directly; claims marked *unverified* need a running app or a person.
- **Baseline:** 80/80 vitest tests pass; production build and `tsc --noEmit` both clean.

Status legend: **DONE** · **PARTIAL** · **NOT STARTED** · **BLOCKED** · **NEEDS DECISION**

---

## Task 2A

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| A1 | Align Directory Tables with correct join profiles | SOW + UI/UX p1 | **NOT STARTED** | The UI/UX doc states the cause outright: *"The developer used an AI generator to make changes to the DB resulting in misalignment."* Target pattern is `User > Directory > join with Profile > category, type, subtype Array`. Largest item in 2A. |
| A2 | Sidebar Theme changes (6 sub-items) | UI/UX p1 | **NOT STARTED** | Celebration dropdowns; Dining>Buffet sub-types; Health/Wellness mixing Sporting types; Marketplace missing sub-tasks; Meetup mixed with Marketplace; theme category labels (Recommend / Coming Soon / unlabeled). |
| A3 | Venue Directory > Vineyard/Winery is empty | UI/UX p1 | **CONFIRMED — broader than reported** | `Vineyard_Winery` is 0/28 rows. But `Hospitality` and `Restaurant` are **also** 0. Wider population gap, not one category. |
| A4 | Save Task Assignment → "Something went wrong", no exit | UI/UX p1 | **PARTIAL** | The *"no exit from page"* half is already fixed — `ErrorBoundary.tsx:9` documents it from the 08/08/2026 acceptance test and now offers real navigation out. The underlying save failure is **not** diagnosed. |
| A5 | Sidebar Resources location search has only MD test data | UI/UX p2 | **CONFIRMED** | See *Two location systems* below. `resources.location` has 50 rows, 36 explicitly MD, 0 for DC/VA/NJ/PA/NY/IL/GA/FL. |
| A6 | Communication/Team "error fetching Users" | UI/UX p2 | **NOT STARTED** | `RoleManager.tsx:325` raises it when edge function `get-users-for-roles` fails. Root cause not yet traced. |
| A7 | Remove date (year) restrictions on event creation | UI/UX p2 | **NOT REPRODUCED** | No year bound found in `CreateEvent.tsx`, `calendar.tsx`, or `src/lib/validation/`. Likely a browser date-picker default or already resolved. Needs a repro from the tester. |
| A8 | Initiate Marketing Campaign Plan | Pro Marketing Campaign | **PARTIAL — schema DONE** | All tables exist and match the doc: `marketing_subscribers` (exact column match), `marketing_campaigns`, `marketing_emails`, `marketing_conversions`. Doc's `email_delivery` ships as `marketing_email_deliveries`. Data is near-empty: 1 subscriber, 1 campaign, 8 emails, **0 deliveries**, 9 conversions. Campaign *content* (4-week timeline, email series, creatives) not authored. |
| A9 | Initiate Vendor Marketing Plan | Vendor Marketplace | **NOT STARTED** | Doc requires a Trust Building System (Verified Vendor / Background Verified / Licensed / Insurance Confirmed), Reviews, and 4 revenue tiers. **None exist**: no `vendor_reviews`, `vendor_verification`, `vendor_tiers`, `marketplace_vendors`. Only a bare `rating` column on 6 profile tables. Tier 2/3 pricing ($49–99, $199–499/mo) needs Stripe → blocked on B4. |
| A10 | Validate Multi-location processing | CM Dashboard | **BLOCKED** | Schema and guard triggers are live (`validate_cm_change_request_location_scope`, `apply_multilocation_change_request`). `cm_locations` was **0 rows**, so the path could never execute. Seed written and validated but **not applied** (see Blockers). |
| A11 | CM Manager Dashboard views | CM Dashboard p1 | **PARTIAL — view written** | `unified_change_requests` was missing, so the doc's first sample query failed. Created in `20260925192000`, unioning cm_change_requests (5 rows) with legacy change_requests (67). Validated read-only against live data: the doc's verbatim query now returns `medium 66 / Unspecified 5 / high 1`. Migration **not yet applied**. Still outstanding: `unified_tasks.locked` is absent, so the Timeline Conflict query remains broken. |
| A12 | Resource directory update | SOW acceptance criteria | **DONE** | 6 of 13 live categories were unmapped, firing a user-visible toast every load. Fixed in `35c959b`; verified against live data — unmapped went 6 → **0**. |
| A13 | User roles directory update | SOW acceptance criteria | **DONE** | `app_role` enum has all six required roles: `host, organizer, event_planner, venue_owner, hospitality_provider, manager` (+`tester`). |
| A14 | Complete Acceptance Test (Sylvia H.) | SOW | **NOT STARTED** | Requires A1–A11 plus a human tester. |
| A15 | Launch Starter Plan | SOW | **BLOCKED** | `Subscription_Plans Directory` and `Profile` are both **0 rows**. |

## Task 2B

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| B1 | Pro Plan Readiness Checklist | *(PDF not supplied)* | **BLOCKED** | The SOW cites a requirements PDF for this; it was not among the five provided. |
| B2 | Validate Merge Plan clean end to end | *(PDF not supplied)* | **BLOCKED** | Same — no Merge Plan document supplied. |
| B3 | Add marketing states | SOW + UI/UX p2 | **PARTIAL — see caveat** | `directory_service_areas` is complete: 272 rows, all 11 states incl. DC/MD/VA, with PA East/West, NYC Boroughs, MA Boston, IL Chicago, GA Atlanta Metro. **But** the UI/UX complaint (A5) is about `resources.location`, a different store that is still MD-only. |
| B4 | Validate Stripe setup process | SOW | **NOT STARTED — build, not validation** | No `stripe` dependency in `package.json`. Only two code references, both comments saying *"no Stripe in Task 1"* / *"no Stripe wiring here"*. `invoices.stripe_invoice_id` column exists; table has **0 rows**. |
| B5 | Validate User (subscribers) Invoicing system | SOW | **NOT STARTED** | `invoices` table is fully shaped (15 columns) but **0 rows**. No invoice generation code. Depends on B4. |
| B6 | Complete Acceptance Test (Sylvia H.) | SOW | **NOT STARTED** | Depends on B1–B5. |
| B7 | Launch Pro Plan | SOW | **BLOCKED** | Depends on B4/B5 and the missing B1 checklist. |

---

## Two location systems — the A5 / B3 discrepancy

These are unrelated stores, and conflating them makes A5 look already-solved when it is not:

| | `directory_service_areas` | `resources.location` |
|---|---|---|
| Consumed by | `useDirectoryServiceAreas` → the 7 **directory pages** | `ResourceManager` → **Sidebar > Resources** |
| Shape | Structured `state` / `city` / `region` | Single free-text column |
| Coverage | **Complete** — 272 rows, 11 states | **MD-only** — 50 rows, 36 MD, 0 for the other 9 states |

The remaining non-MD values are unstructured junk: `"Convention Center"`, `"Farm"`, `"Both Locations"`, `"4234"`.

> **Caution:** naive `ILIKE '%MA%'` matching gives false positives — `"Hampstead"` contains `MA`, `"Maryland"` contains both `MA` and `MD`. Verify with word boundaries.

**NEEDS DECISION:** fixing A5 means either adding structured state/city columns to
`resources`, or repointing the Resources picker at `directory_service_areas`. That is a
design call, not a mechanical fix.

---

## Blockers

1. **Production DB writes are gated.** Three migrations are committed but **not applied**:
   - `20260925190000_task2a_trim_resource_category_names.sql` — trims `"Supplier "` / `"Service "`, adds a CHECK
   - `20260925191000_task2a_seed_cm_locations.sql` — 9 locations across 4 events, scopes 5 tasks (unblocks A10)
   - `20260925192000_task2a_unified_change_requests.sql` — creates the missing dashboard view (A11)
2. **Migration ledger drift.** 402 migration files vs 389 ledger entries. The 13 missing
   ones **were** applied (their objects exist live) — the ledger is stale, not the schema.
   Several are destructive data-repair migrations, so **do not run `npm run db:push`** blindly.
3. **Two requirements PDFs were never supplied** — Pro Plan Readiness Checklist (B1) and
   Merge Plan (B2). Both are Task 2B deliverables.
4. **`IEP_Current_System_Schema2.pdf` is truncated.** Its own footers read *"Page N of 60"*,
   but the file contains **8 pages** (verified: internal `/Count` is 8). Coverage stops partway
   through `Entertainment Profile`. Since A1 is the largest item in 2A and this document defines
   its target, **the full 60-page version is needed.**
5. **Pre-existing lint breakage.** `npx eslint` crashes repo-wide on a
   `@typescript-eslint/no-unused-expressions` plugin version conflict. Not caused by Task 2 work
   (reproduced on untouched files).

## Scope observations

- **A4 and A6 are bug fixes, not optimization.** The SOW frames Milestone 5 as optimization
  against a pre-existing codebase. Worth confirming these are in scope at the fixed rate.
- **B4/B5 are build work, not validation.** The SOW says *"Validate Stripe setup"*, but there is
  no Stripe integration to validate — this is greenfield. It is the single largest risk to the
  Oct 4 date and should be raised before 2B starts.
- **A9 is largely greenfield too** — the Trust Building System and tier infrastructure do not exist.
