## Apex SSL fix for idaeventpartners.com

### Current verified state

- `idaeventpartners.com` → `185.158.133.1` — **TLS handshake fails** (no cert covers apex)
- `www.idaeventpartners.com` → `185.158.133.1` — Valid cert (SAN: `www.idaeventpartners.com`, expires Aug 19, 2026)
- Cert covers `www` only; apex has no SAN entry → that's why apex shows "no SSL"
- Both hostnames point to the same IP (`185.158.133.1`), which is **not a Lovable-managed IP**. Lovable's apex target is normally `185.158.133.1` only when added through Lovable's flow with the matching TXT verification. Without successful verification, Lovable will not provision the apex certificate.

### Why this is not a code problem

Nothing in the React/Supabase codebase controls SSL issuance. Apex SSL is provisioned by Lovable's hosting layer **only after** the domain is verified via DNS. The fact that `www` works but apex doesn't almost always means one of:

1. The apex `A` record was added pointing at Lovable's IP, but the **TXT verification record for the apex** was not added (or has a typo), so Lovable issued a cert for `www` only.
2. Apex is set to "redirect to www" in Lovable, but the redirect itself needs an apex cert to terminate TLS first — and that cert hasn't been issued because of (1).

### Plan

1. **Verify expected DNS in Lovable**
   - Open Project → Settings → Domains.
   - For `idaeventpartners.com` (apex, primary), Lovable will display:
     - `A @ → 185.158.133.1`
     - `TXT _lovable.idaeventpartners.com → <verification-token>`
   - For `www.idaeventpartners.com`, Lovable will display:
     - `CNAME www → <project>.lovable.app` (or an A record)
     - Possibly a TXT verification for `www`.

2. **Compare against registrar DNS**
   - At your DNS provider, list records for `idaeventpartners.com`.
   - Confirm the apex `A` and `TXT _lovable` records exist exactly as Lovable shows them. Most common failures: missing TXT, TXT on wrong host (`_lovable.www` instead of `_lovable`), or apex `A` pointing at an old host.
   - Fix any mismatch.

3. **Re-trigger verification in Lovable**
   - In Project → Settings → Domains, click "Verify" / "Retry" next to the apex entry.
   - Wait for status to flip to Verified → SSL Issued (usually 1–10 min after DNS propagates).

4. **Subdomain edit UI bug (".lovable.app" auto-appended)**
   - Reported to the Lovable team via internal feedback channel (done).
   - Workaround until fixed: leave `www.idaeventpartners.com` exactly as it was originally saved and don't re-edit that row; only touch the apex entry to drive verification.

5. **Re-verify externally**
   - After Lovable reports SSL issued, I'll re-run the DNS + TLS check. Success criteria:
     - `https://idaeventpartners.com` returns 200/301 with a valid cert whose SANs include `idaeventpartners.com`.
     - 301 redirect to `https://www.idaeventpartners.com` works.
     - `https://www.idaeventpartners.com` continues to load with a valid cert.

### What I need from you to proceed

- A screenshot (or paste) of the exact DNS records Lovable is asking for under the apex entry in Project → Settings → Domains.
- A screenshot (or paste) of the current DNS records at your registrar for `idaeventpartners.com` (apex `A` and any `TXT` on `_lovable`).

Once you share those, I can pinpoint the exact mismatch and tell you the one record to add/change. After you update DNS and Lovable shows "Verified", I'll re-run the TLS check from here to confirm the apex cert is live.

### Technical notes

- No file edits are needed in this repo to fix the SSL — this is a platform/DNS task.
- The ".lovable.app auto-append" issue is a Lovable Domains UI bug and has been forwarded to the team; it does not block apex provisioning as long as you don't re-edit the existing www row.
