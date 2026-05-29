Current status:
- `https://www.idaeventpartners.com` has a valid SSL certificate until Aug 19, 2026.
- `https://idaeventpartners.com` fails TLS handshake, so the apex/root domain has no usable SSL certificate.
- This Lovable project currently has no custom domain connected; it is only published at `https://iep-trial.lovable.app`.
- Both apex and `www` currently resolve to `185.158.133.1`, so the issue is at the hosting/DNS certificate layer, not in the React app code.

Plan to fix:
1. Decide the canonical domain:
   - Recommended: make `www.idaeventpartners.com` canonical and redirect `idaeventpartners.com` to it.
   - Alternative: serve the app directly from `idaeventpartners.com` and optionally redirect `www` to apex.

2. Connect the domain to the correct host:
   - If this Lovable app should own the domain, add `idaeventpartners.com` and optionally `www.idaeventpartners.com` as custom domains in Lovable publishing settings.
   - Update DNS at the domain provider to the exact Lovable-provided records.
   - Wait for DNS verification and automatic SSL issuance.

3. If the current external host should keep serving the site:
   - Add/issue an SSL certificate that includes both `idaeventpartners.com` and `www.idaeventpartners.com`.
   - Configure the apex virtual host/SNI entry for `idaeventpartners.com`.
   - Add a 301 redirect from apex to `https://www.idaeventpartners.com` if `www` remains canonical.

4. Verify after DNS/SSL provisioning:
   - Confirm `https://idaeventpartners.com` loads without certificate errors.
   - Confirm redirect behavior is correct.
   - Confirm `https://www.idaeventpartners.com` still works.

What I can do next after approval:
- Re-check DNS and HTTPS once you update/connect the domain.
- If you want Lovable to host the domain, I can guide the exact DNS records once the domain is added in Lovable.