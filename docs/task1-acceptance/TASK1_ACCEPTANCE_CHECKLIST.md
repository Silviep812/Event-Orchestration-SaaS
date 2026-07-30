# Task 1 Acceptance Checklist — IEP SaaS

**Project:** Interactive Event Planner (IEP)  
**Tester:** Sylvia H.  
**Prepared:** July 30, 2026  
**Status:** Ready for client acceptance testing  

Import tip: Upload this file to Google Drive and open with Google Docs, or copy into a Doc.

---

## Sign-off

| Field | Value |
| --- | --- |
| Tester name | |
| Date | |
| Overall result | Pass / Fail / Pass with notes |
| Notes | |

---

## A. Schema printout

| # | Test | Pass? | Notes |
| --- | --- | --- | --- |
| A1 | Open `docs/IEP_Current_System_Schema_GoogleDocs.html` | | |
| A2 | Confirm tables + attributes are readable | | |
| A3 | Import/open successfully in Google Docs | | |

---

## B. Public landing / Demo / Starter Plan

| # | Test | Pass? | Notes |
| --- | --- | --- | --- |
| B1 | `/` shows required marketing sections in order | | |
| B2 | Header Features → scrolls to Smart Tools | | |
| B3 | Header Pricing → scrolls to Simple, Transparent Pricing | | |
| B4 | Sign In → `/auth?tab=signin` | | |
| B5 | Try Starter Plan → `/auth?tab=signup` | | |
| B6 | Watch Demo opens modal with `IEP Presentation.mp4` | | |
| B7 | Demo: close button, Escape, controls, no autoplay with sound | | |
| B8 | Mobile menu opens/closes and navigates | | |
| B9 | CTA wording uses Starter Plan (not free trial) | | |
| B10 | Business plan CTA shows TBA (disabled) | | |

---

## C. Auth & post-sign-in routing

| # | Test | Pass? | Notes |
| --- | --- | --- | --- |
| C1 | New user with no events lands on Themes (Create Event path) after onboarding | | |
| C2 | Returning user with events lands on Manage Event | | |
| C3 | Starter signup creates usable free account (no Stripe required) | | |

---

## D. Themes directory hierarchy

| # | Test | Pass? | Notes |
| --- | --- | --- | --- |
| D1 | Dining shows Contemporary / Buffet / Fine Dining dropdowns | | |
| D2 | Special Event: Convention present (Charity renamed) | | |
| D3 | Social Meetup not offered | | |
| D4 | Festival Heritage category + child types available | | |

---

## E. Resource directories (`directory → type → profile → amenities`)

| # | Test | Pass? | Notes |
| --- | --- | --- | --- |
| E1 | Vendor Service Rental/Buy lists `service_rental_buy` (equipment), not personnel `vendor` | | |
| E2 | Service Vendor directory lists personnel `vendor` profiles | | |
| E3 | Venue profiles show amenities when present | | |
| E4 | Deep links: rental uses `rentalId` on vendor-service; vendor uses service-vendor | | |

---

## F. Reusable templates (2 workflows) + Budget

| # | Test | Pass? | Notes |
| --- | --- | --- | --- |
| F1 | Planning Assets seeds Host — Manage Event Starter | | |
| F2 | Planning Assets seeds Planner — Project Management Starter | | |
| F3 | Apply Manage Event template copies tasks (+ budget lines) and routes to Manage Event | | |
| F4 | Apply PM template copies tasks/budget and routes to PM Budget | | |
| F5 | Budget Tracker includes Hospitality category | | |
| F6 | Create Event → Project Management → Budget works for Starter user | | |

---

## G. M5 UI/UX (authenticated)

| # | Test | Pass? | Notes |
| --- | --- | --- | --- |
| G1 | Communication/Team has Invite + Role/Permission management | | |
| G2 | Communication/Team links to Themes / Create Event | | |
| G3 | Manage Event: no Entertainment Types menu | | |
| G4 | Manage Event: no External Vendor type menu | | |
| G5 | Manage Event: Venue booking completed checkbox removed | | |
| G6 | Manage Event: Task assignment + Back to top present | | |
| G7 | PM Collaborator: no Role Management block (moved to Communication/Team) | | |
| G8 | PM Collaborator: Assigned Tasks appear before Create change request | | |
| G9 | Task dependencies usable from PM/Task (Business Rules order) | | |

---

## H. Launch Starter Plan (non-Stripe)

| # | Test | Pass? | Notes |
| --- | --- | --- | --- |
| H1 | Public Starter CTAs reach signup | | |
| H2 | Free Starter user can create event, use templates, edit budget | | |
| H3 | No paid Stripe checkout required for Starter | | |

---

## Migrations required before D/E/F pass in production

Apply (or confirm applied):

1. `20260730150000_task1_theme_directory_alignment.sql`
2. `20260730151000_task1_templates_budget_kind.sql`
