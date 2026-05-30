## Add Google Analytics 4 to the site

Wire up GA4 so you can see page views, visitor sources, devices, sessions, and custom events for `idaeventpartners.com` / `iep-trial.lovable.app`.

### What you'll get
- Real-time visitors
- Page views per route (Dashboard, Directories, Marketing pages, etc.)
- Traffic sources (Google, direct, referral, social)
- Device / country / browser breakdown
- Custom events (e.g. "waitlist_signup", "event_created")

### What I need from you
Your **GA4 Measurement ID** (format: `G-XXXXXXXXXX`).

To get one:
1. Go to https://analytics.google.com → Admin → Create Property
2. Add a Web data stream for `https://idaeventpartners.com`
3. Copy the Measurement ID it shows

### Implementation steps

1. **Add the gtag snippet to `index.html`**
   Load `gtag.js` async in `<head>` with your `G-XXXXXXXXXX` ID and the standard `gtag('config', ...)` init.

2. **Create `src/lib/analytics.ts`**
   Small helper exposing `trackPageView(path)` and `trackEvent(name, params)` that safely no-op when GA isn't loaded (dev/preview).

3. **Track SPA route changes**
   The app uses React Router, so the initial `gtag` page_view fires once. Add a tiny `useGAPageViews()` hook mounted in `App.tsx` that listens to `useLocation()` and calls `gtag('event', 'page_view', ...)` on every route change.

4. **(Optional) Track a couple of key custom events**
   - `waitlist_signup` from `MarketingWaitlistForm`
   - `event_created` from `CreateEvent`
   Only if you want — say the word and I'll wire them.

5. **Respect the Coming Soon / preview**
   Skip tracking on the Lovable preview domain (`*.lovable.app` `id-preview--…`) so it doesn't pollute your numbers — only track on the published / custom domain.

### Technical details
- Pure frontend change, no DB/edge-function work
- No new dependencies — uses the official `gtag.js` script
- Measurement ID is a public/publishable value, fine to commit in `index.html`
- Data shows up in GA4 within ~30 seconds (Realtime) and ~24h (standard reports)

### Alternatives if you'd rather not use Google
- **Plausible** or **Fathom** — privacy-friendly, no cookie banner needed, ~$9–14/mo
- **PostHog** — adds session replays + funnels, has a free tier
Tell me if you'd prefer one of these instead.

### Reply with
- Your `G-XXXXXXXXXX` ID (or "create the helper, I'll paste the ID in later"), and
- Whether to wire the two custom events in step 4.