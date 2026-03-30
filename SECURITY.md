# Security Policy — IDA Event Partners SaaS

## Secrets and environment variables

| Secret | Where it lives | Never commit |
|--------|---------------|--------------|
| Supabase project URL | Lovable project env / `.env.local` → `VITE_SUPABASE_URL` | ✅ |
| Supabase anon key | Lovable project env / `.env.local` → `VITE_SUPABASE_ANON_KEY` | ✅ |
| Resend API key | Supabase Edge Function secrets (not in repo) | ✅ |
| Supabase service-role key | Supabase dashboard only — never in frontend | ✅ |

**Rule:** no secrets in source files, git history, or client-facing URLs. Use Lovable's project
environment settings (or `.env.local` for local dev) and Supabase's secret manager for Edge Functions.

## RLS (Row Level Security)

All tables that store user data have RLS enabled. Owner-based policies are applied via
`auth.uid() = user_id` checks. See [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) for the
permission-level model and [`supabase/migrations/`](supabase/migrations/) for the SQL.

Key RLS migrations for Deliverable 1:
- `20260327140000_events_rls_owner_policies.sql` — events SELECT/INSERT/UPDATE/DELETE
- `20260327160000_cm_activity_schema.sql` — cm_activity SELECT/INSERT

## Reporting a vulnerability

If you discover a security issue:

1. **Do not open a public GitHub issue.**
2. Email the project lead directly (contact details in the SOW / contract).
3. Include: affected URL or table, reproduction steps, and impact assessment.
4. Expect an acknowledgement within 48 hours and a patch timeline within 5 business days.

## Supported versions

This project is pre-1.0 (active Deliverable 1 development). All fixes apply to `main` only.
