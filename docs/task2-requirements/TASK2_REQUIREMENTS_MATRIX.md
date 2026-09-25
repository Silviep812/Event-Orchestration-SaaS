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
| A1 | Align Directory Tables with correct join profiles | SOW + UI/UX p1 | **INVESTIGATED — join integrity is clean** | The live app reads a **lowercase** table family (`venues`, `hospitality_profiles`, `entertainments`, `suppliers`, `vendor`). Every profile→type join was checked for orphans: **0 orphaned FKs** across all four pairs, and **0 cross-theme leaks**. No source file references the Title Case `"Venue Profile"` / `"Venue Directory"` tables at all — they appear to be a dormant parallel family. **The misalignment the doc describes is in the theme hierarchy (A2), not the directory→profile joins.** Remaining question for the client: are the Title Case tables meant to be retired? Needs the full 60-page schema PDF to answer. |
| A2 | Sidebar Theme changes (6 sub-items) | UI/UX p1 | **PARTIAL — 1 of 6 fixed, 2 already clean** | **Buffet CONFIRMED and fixed** (`20260925193000`, not yet applied): Buffet carried 30 children — 14 real buffet styles plus 16 artisan crafts (Blacksmith, Potter, Glassblower…), each with a self-duplicating child (`Buffet > Blacksmith > Blacksmith`). Migration moves the 16 to the empty `Marketplace > Artisans` root and drops 15 duplicate leaves; dry run verified 15 delete / 16 move / Buffet left with its 14 correct types. **Health/Wellness×Sporting and Meetup×Marketplace queries both return empty** — already repaired by the earlier `at6_unmix_misparented_types` work. Celebration dropdowns, Marketplace sub-tasks and theme labels still outstanding. |
| A3 | Venue Directory > Vineyard/Winery is empty | UI/UX p1 | **CONFIRMED — broader than reported** | `Vineyard_Winery` is 0/28 rows. But `Hospitality` and `Restaurant` are **also** 0. Wider population gap, not one category. |
| A4 | Save Task Assignment → "Something went wrong", no exit | UI/UX p1 | **PARTIAL** | The *"no exit from page"* half is already fixed — `ErrorBoundary.tsx:9` documents it from the 08/08/2026 acceptance test and now offers real navigation out. The underlying save failure is **not** diagnosed. |
| A5 | Sidebar Resources location search has only MD test data | UI/UX p2 | **CONFIRMED** | See *Two location systems* below. `resources.location` has 50 rows, 36 explicitly MD, 0 for DC/VA/NJ/PA/NY/IL/GA/FL. |
| A6 | Communication/Team "error fetching Users" | UI/UX p2 | **DONE** (`1e8fb2a`) | Root cause: Collaborate renders RoleManager for every member, but `fetchUsers` always called the admin-only `get-users-for-roles`, which 403s for non-admins. Only **4 of 37 users** hold any role and only **2** resolve to admin, so **33 of 37** saw the toast on every load. The permission check itself was correct — this was an error-reporting bug. Fixed by gating the call on `isAdmin()`, waiting for `usePermissions` to resolve first, and surfacing the real error message on genuine failures. |
| A7 | Remove date (year) restrictions on event creation | UI/UX p2 | **NOT REPRODUCED** | No year bound found in `CreateEvent.tsx`, `calendar.tsx`, or `src/lib/validation/`. Likely a browser date-picker default or already resolved. Needs a repro from the tester. |
| A8 | Initiate Marketing Campaign Plan | Pro Marketing Campaign | **PARTIAL — schema DONE** | All tables exist and match the doc: `marketing_subscribers` (exact column match), `marketing_campaigns`, `marketing_emails`, `marketing_conversions`. Doc's `email_delivery` ships as `marketing_email_deliveries`. Data is near-empty: 1 subscriber, 1 campaign, 8 emails, **0 deliveries**, 9 conversions. Campaign *content* (4-week timeline, email series, creatives) not authored. |
| A9 | Initiate Vendor Marketing Plan | Vendor Marketplace | **NOT STARTED** | Doc requires a Trust Building System (Verified Vendor / Background Verified / Licensed / Insurance Confirmed), Reviews, and 4 revenue tiers. **None exist**: no `vendor_reviews`, `vendor_verification`, `vendor_tiers`, `marketplace_vendors`. Only a bare `rating` column on 6 profile tables. Tier 2/3 pricing ($49–99, $199–499/mo) needs Stripe → blocked on B4. |
| A10 | Validate Multi-location processing | CM Dashboard | **UNBLOCKED — ready to test** | Seed **applied**: `cm_locations` now holds **9 locations** across the 4 events that carry change requests (Test Milestone 5 Event ×3, the others ×2 each), and **5 tasks** are scoped to their event's Main Venue. The guard triggers can now actually execute. End-to-end acceptance run still pending. |
| A11 | CM Manager Dashboard views | CM Dashboard p1 | **DONE — view live** | `unified_change_requests` was missing, so the doc's first sample query failed. Created in `20260925192000`, unioning cm_change_requests (5 rows) with legacy change_requests (67). Validated read-only against live data: the doc's verbatim query now returns `medium 66 / Unspecified 5 / high 1`. Migration **applied**; the doc's query now runs against the real view in production. Still outstanding: `unified_tasks.locked` is absent, so the Timeline Conflict query remains broken. |
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

1. **Migrations.** The first three were approved and are **applied and recorded** in the ledger
   (now 392): `20260925190000` (trim category names), `20260925191000` (seed cm_locations),
   `20260925192000` (unified_change_requests view). One remains **pending approval**:
   - `20260925193000_task2a_unmix_buffet_artisans.sql` — A2 Buffet fix. Dry-run verified
     read-only: 15 deletes, 16 moves, Buffet left with its 14 correct types.
2. **Migration ledger drift.** 402 migration files vs 389 ledger entries. The 13 missing
   ones **were** applied (their objects exist live) — the ledger is stale, not the schema.
   Several are destructive data-repair migrations, so **do not run `npm run db:push`** blindly.
3. **Two requirements PDFs were never supplied** — Pro Plan Readiness Checklist (B1) and
   Merge Plan (B2). Both are Task 2B deliverables.
4. **`IEP_Current_System_Schema2.pdf` is truncated.** Its own footers read *"Page N of 60"*,
   but the file contains **8 pages** (verified: internal `/Count` is 8). Coverage stops partway
   through `Entertainment Profile`. Since A1 is the largest item in 2A and this document defines
   its target, **the full 60-page version is needed.**
5. **`event_types` has deeper corruption than A2 covers.** 271 names appear more than once,
   30 rows are parented to a same-named row, and id 345 ("Spa Days") is a **self-loop**
   (`parent_id = id`) that can hang a recursive query. **9 of 16 typed events point at
   duplicate-named rows**, so a blanket dedupe would silently retype real events. Needs its
   own migration plus a decision on which copy is canonical. **NEEDS DECISION.**
6. **Pre-existing lint breakage.** `npx eslint` crashes repo-wide on a
   `@typescript-eslint/no-unused-expressions` plugin version conflict. Not caused by Task 2 work
   (reproduced on untouched files).

## Scope observations

- **A4 and A6 are bug fixes, not optimization.** The SOW frames Milestone 5 as optimization
  against a pre-existing codebase. Worth confirming these are in scope at the fixed rate.
- **B4/B5 are build work, not validation.** The SOW says *"Validate Stripe setup"*, but there is
  no Stripe integration to validate — this is greenfield. It is the single largest risk to the
  Oct 4 date and should be raised before 2B starts.
- **A9 is largely greenfield too** — the Trust Building System and tier infrastructure do not exist.
