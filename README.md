# IDA Event Partners — Event Orchestration SaaS

## Project info

**Lovable project:** https://lovable.dev/projects/8cf37313-547d-49d6-990f-d661a5976189  
**Preview URL:** https://preview--iep-trial.lovable.app  
**Custom domain:** https://idaeventpartners.com (DNS / Lovable domain config — see [`docs/CLIENT_REDIRECT_SUMMARY.md`](docs/CLIENT_REDIRECT_SUMMARY.md))  
**Supabase project:** see [`docs/REDIRECT_AND_AUTH_URLS.md`](docs/REDIRECT_AND_AUTH_URLS.md) for Auth URL setup

## Deliverable 1 status

See [`docs/DELIVERABLE1_SOW_GAP_CHECKLIST.md`](docs/DELIVERABLE1_SOW_GAP_CHECKLIST.md) for the full SOW acceptance-criteria checklist.  
Required Supabase SQL migrations to run: `supabase/migrations/202603271*` in date order.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8cf37313-547d-49d6-990f-d661a5976189) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8cf37313-547d-49d6-990f-d661a5976189) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Ship checklist (client requirements — Sylvia)

**In-app work** for the public shell, auth flow, and Create/Manage Event (per SOW) is implemented in this branch. To **fully ship**:

1. **Lovable:** Publish; point **custom domain** at this project (no separate “Coming Soon” app covering the real UI).
2. **Supabase:** [Authentication → URL Configuration](https://supabase.com/dashboard) — **Site URL** + **Redirect URLs** for production + preview; **SMTP** (e.g. Resend) for auth emails.
3. **Database:** From repo root, `npm run db push` (if the pooler times out: set `SUPABASE_DB_PASSWORD`, then `npm run db:link:direct:ps` and `npm run db:push:with-password` — see `docs/CLIENT_STEP_BY_STEP.md`).
4. **Client:** Send Q&A on main vs staging DB; obtain **Theme / Create / Details** bullet list if anything remains.

| Doc | Purpose |
|-----|---------|
| [`docs/CLIENT_STEP_BY_STEP.md`](docs/CLIENT_STEP_BY_STEP.md) | Numbered steps matching the client email |
| [`docs/CLIENT_REQUIREMENTS_FULL.md`](docs/CLIENT_REQUIREMENTS_FULL.md) | Full requirement narrative |
| [`docs/PROJECT_HANDOFF_COMPLETE.md`](docs/PROJECT_HANDOFF_COMPLETE.md) | What is done in repo vs what you finish in hosting |
| [`docs/DELIVERABLE1_SOW_GAP_CHECKLIST.md`](docs/DELIVERABLE1_SOW_GAP_CHECKLIST.md) | SOW / Deliverable 1 checklist |
