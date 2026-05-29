## What you're asking for

You want `idaeventpartners.com` to appear at the top of the Domains page as the project's primary URL, instead of `iep-trial.lovable.app`.

## Why this can't be changed in the app code

The top field on Project → Settings → Domains is the **Lovable subdomain slot**. It always renders the `*.lovable.app` URL because:

- Every Lovable project keeps a permanent `*.lovable.app` fallback URL. It cannot be removed, replaced, or substituted with a custom domain.
- The "primary domain" concept for a custom domain lives further down the same page, in the **Custom Domains** section. That's where `idaeventpartners.com` is already attached and marked primary.
- Nothing in this repo (React, Supabase, edge functions, configs) controls what Lovable's Domains UI shows in that header field. It's rendered by the Lovable dashboard itself.

## Current state (already correct)

- `idaeventpartners.com` — attached, primary, SSL valid, loads ✓
- `www.idaeventpartners.com` — attached, SSL valid, redirects to apex ✓
- `iep-trial.lovable.app` — permanent fallback, cannot be removed ✓

So functionally, `idaeventpartners.com` **is** your primary domain — that's the URL the public uses, that's what shows in browsers, that's what links and SEO resolve to. The Domains page just continues to display the `.lovable.app` slug in the top section because that section is reserved for the fallback subdomain, not for your custom primary.

## What you can actually do

1. **Rename the slug** (cosmetic only) — change `iep-trial` to `idaeventpartners` so the fallback becomes `idaeventpartners.lovable.app`. The `.lovable.app` suffix still stays. If that field is greyed out for you, it's a Lovable plan/UI restriction, not a code issue.
2. **Leave it as-is** — your real primary (`idaeventpartners.com`) is working. The `.lovable.app` URL is only ever used as a backup/dev URL.
3. **Send feedback to Lovable** asking them to display the custom primary domain at the top of the Domains page instead of the `.lovable.app` slug. This is a Lovable dashboard UX request, not something I can change from your project code.

## Recommendation

Option 2 + 3: keep using `idaeventpartners.com` (it already works), and I'll send a feedback note to Lovable asking them to surface the custom primary domain in that top field. There is no code change to make in this project.

## What I will do once you approve

- Send a single feedback message to Lovable describing the UX confusion (top of Domains page shows `.lovable.app` instead of the custom primary).
- No file edits, no migrations, no deploys.

If instead you want me to walk you through renaming the slug from `iep-trial` to something like `idaeventpartners`, say so and I'll give you the click-by-click steps.
