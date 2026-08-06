# Acceptance Test 3 — fixes and how to get them live

Every item in *M5_Task1 Acceptance Test 3 Results* is addressed below.

> **Read this first.** A large share of the "repeat failures" in tests 1–3 are **database** items
> (categories, types, directory alignment). Those live in `supabase/migrations/`, and the repo's
> deploy workflow (`.github/workflows/supabase-ci.yml`) is **manual-only** — the `push:` trigger is
> commented out. If nobody ran it, the migration files sit in Git while the hosted database still
> has the old data, so the app keeps showing the old menus no matter how many times the code is
> fixed. **Step 1 below is not optional.**

---

## 1. Deploy

### Database (required)

Run the manual workflow **Actions → "Supabase deploy" → Run workflow**, or locally:

```powershell
$env:SUPABASE_DB_PASSWORD = "<db password>"
npm run db:push:with-password
```

Then confirm in the Supabase SQL Editor:

```sql
-- paste scripts/at3-acceptance-verify.sql
```

Each query states the expected result inline. Anything else means the push did not land.

### Front end

```bash
npm run build     # then deploy dist/
```

---

## 2. What changed, item by item

### Website home page

| Acceptance item | Fix |
| --- | --- |
| "Demo doesn't play — should play automatically then use controls" | [LandingDemoModal.tsx](src/components/marketing/LandingDemoModal.tsx) now starts playback when the modal opens. It tries with sound first; if the browser blocks unattended audio it restarts muted and shows an **Unmute** button, so the demo always plays. Native controls stay available, and a load failure now shows a download link instead of a silent black box. |
| Containers 1) Turn your vision…, 2) Built for hosts…, 3) Why choose… "Restore to design in *Website landing page* page #2" | [Index.tsx](src/pages/Index.tsx) — all three rebuilt to the page-2 layout: emoji headings, the "With IDA Event Partners, you can:" lead-in, the ✨ bullet list, the ✔ Hosts / Event Planners / Businesses checklist, the "Most tools help you plan. / We help you execute—flawlessly." pairing, the 4 "Why choose" bullets, and the CTA under each block (*Start your free starter plan today*, *Create your first event in minutes*, *🔥 Save up to 70% of your planning time*). The card grids that had replaced these lists are gone. The third container is titled **Why Choose IDA Event Partners?** per your wording. |
| "Change 'Get Launch Updates' to 'Get Software Updates'" | Heading and submit button both updated ([Index.tsx](src/pages/Index.tsx), [MarketingWaitlistForm.tsx](src/components/marketing/MarketingWaitlistForm.tsx)). |

### Sidebar → Communication / Team

| Acceptance item | Fix |
| --- | --- |
| "Add Invite and Permission Levels" | [Collaborate.tsx](src/pages/Collaborate.tsx) gets a primary **Invite & permission levels** button in the page header. Previously the invite dialog could only be reached from inside a team card, so a user with no team had no way in. The dialog now explains when a team is required and links straight to *Create a team*. |
| "Add Task Assignment (Role)" | The **Add task assignment** button in Role Management was gated on a single selected event, but Communication/Team never rendered a control to choose one — it was permanently disabled. Added an **Event for task assignment** picker that drives it. Also fixed two bugs where the invite was written against the wrong team (`userTeam` instead of the team the dialog was opened for). |
| "If User new/signup Navigate to Theme (create event) else Manage Event" | [createEventEntryPath.ts](src/lib/createEventEntryPath.ts) sent new users to `/dashboard/collaborate`. Now new users land on **Browse event themes** (`/dashboard/themes`); users with events still land on **Manage Event**. Applies to sign-in, sign-up and post-onboarding. |
| "Create event > category > Has Double Entries" | Two layers: the migration merges duplicate `event_types` rows (moving their children and any events onto the survivor) and adds a unique index so they cannot come back; the UI also de-duplicates defensively ([eventTypeCategories.ts](src/lib/eventTypeCategories.ts)). Custom "Other (specify)…" types now reuse a matching row instead of inserting a second one. |

### Theme → Directory → category → type

The root cause of most of this section: **Browse Event Themes drew its category badges from the
legacy `Themes Directory Catalog.tags` column, not from `event_types`.** Categories added by earlier
migrations therefore never showed up, and stale tags pointed at the wrong directory.

[EventThemesDirectory.tsx](src/components/themes/EventThemesDirectory.tsx) now reads the
directory → category → type tree from `event_types` for **every** theme. `tags` only fills gaps and
can no longer produce a duplicate badge.

| Acceptance item | Fix |
| --- | --- |
| "Restore Dining > category (contemporary, buffet and fine dining) with drop down menu selection each type" | Categories and their types come from `event_types`; the migration also rewrites `tags` to match. |
| "Add Sporting category > 5K race, Game Night" | Created under the Sporting theme's format root by the migration (re-asserted idempotently). |
| "Add Festival > category 'Heritage' > types (dropdown menu)" | The category and its five types already existed in `event_types`; they were invisible because `tags` never listed *Heritage*. Now rendered from the database. |
| "Label Celebration, Dining and Festival as 'Recommend'" | Already implemented (`isRecommendedBrowseTheme`) and shown in both grid and list views. Verify with query 9. |
| "Theme > create event > category > Has Missing Entries" | The loader silently dropped any category that had no child types. Those categories are now kept and selectable. |
| "Misaligned directory > category > type — some profiles are linked to wrong Directory" | An earlier migration reparented *every* row named Contemporary / Buffet / Fine Dining into Dining regardless of which directory it belonged to. The new migration enforces the invariant **a child's `theme_id` must equal its parent's `theme_id`** and walks the tree until it settles. |
| "'Special Events' require Directory > category > type Profile Configuration for Menu selection" | Special Event now uses the same DB-driven category → type menus as every other theme. |
| "Change 'Special Event/Charity' to 'Special Event/Convention'" | Re-asserted in the new migration. |
| "Remove 'Special Event/Social Meetup' (exists in Meetupz)" | Removed, including clearing any events that referenced it. |
| "Remove 'Special Event/Heritage' (exists in Festival)" | Removed together with its child types; Festival's Heritage is untouched. |

### Resources

| Acceptance item | Fix |
| --- | --- |
| "Enable filter searches for all Locations in resources" | [ResourceManager.tsx](src/components/ResourceManager.tsx) — the Location dropdown is now a **searchable** combobox listing every location recorded in `resources` (it previously listed only locations already on the current event's rows). The free-text box also matches location, category and status, not just the resource name. |
| "Resource > category > type profile doesn't match DB Table entries. Ex, External Vendor types show other table entries also." | [SupplierDirectory.tsx](src/pages/SupplierDirectory.tsx) built its category checkboxes from a hard-coded Business Rules array while the profiles carried `supplier_categories` values — so the list matched neither the table nor the profiles. Categories are now built from `supplier_categories` plus the categories actually present on profiles, keeping the Business Rules icons where names line up. |

### Project Management

| Acceptance item | Fix |
| --- | --- |
| "Can't Save Task Assignment" | The **Select Project/Event** field was rendered only when `events.length > 0`, but the event is a required field. Any user whose event list came back empty — including collaborators, since the list only ever contained events they personally own — saw "Please select a project/event" with no field to fill in. The picker is now always rendered when the route does not pin an event, with an explanation when the list is empty. |

### Sign-in and notifications (from your closing note)

| Issue | Fix |
| --- | --- |
| "The problem identified was sign in (user reset p/w, etc.)" | Password recovery emails pointed at `/dashboard/profile` — a protected page with no indication a new password was expected. Added a public [/reset-password](src/pages/ResetPassword.tsx) screen that owns the recovery session, validates the new password, and says plainly when a link has expired or was opened in a different browser (reset links are single-use and browser-bound), with a one-click way to request a new one. |
| Cryptic sign-in errors | [authErrors.ts](src/lib/authErrors.ts) now turns "Invalid login credentials", "Email not confirmed" and rate-limit errors into actionable guidance, and the sign-in form uses it. Unconfirmed users are pointed at the Magic Link tab. |
| "Receiving auto notifications is also a problem" | Assigning a task raised nothing for the assignee. [taskAssignmentNotifications.ts](src/lib/taskAssignmentNotifications.ts) writes a notification row on assignment (both at creation and on reassignment), so it appears in **Notification** and the header bell. |

---

## 3. Still needs your decision

- **Committed credentials.** `.github/workflows/supabase-ci.yml` contains a live Supabase access
  token and database password in plain text. Anyone with repo access has full control of the
  project. Rotate both and move them to GitHub **Secrets**.
- **Email delivery.** In-app notifications are fixed in code. Whether *emails* arrive depends on the
  Resend key and SMTP configuration in the Supabase project, which cannot be verified from the repo.
- **ESLint is broken** in this checkout (`@typescript-eslint` / ESLint 9 version mismatch) — it fails
  on untouched files too. Pre-existing; not touched here.
