# Push migrations using --db-url.
#
# A) Password + direct host (default):
#      $env:SUPABASE_DB_PASSWORD = "..."
#      npm run db:push:with-password
#
# B) If you get "no such host" for db.<ref>.supabase.co (local DNS blocks it), use session pooler:
#      $env:SUPABASE_DB_PASSWORD = "..."
#      $env:SUPABASE_USE_SESSION_POOLER = "1"
#      npm run db:push:with-password
#
# C) Best: paste full URI from Dashboard → Settings → Database → Connection string:
#      $env:SUPABASE_DB_URL = "postgresql://..."
#      npm run db:push:with-password
#
# Optional: SUPABASE_DNS_RESOLVER = native | https (default native)
# Optional: SUPABASE_POOLER_REGION = us-east-1 (default; must match your project region)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$projectRef = "mavbnybtyfewfsihmuri"
$region = if ($env:SUPABASE_POOLER_REGION) { $env:SUPABASE_POOLER_REGION } else { "us-east-1" }
$dns = if ($env:SUPABASE_DNS_RESOLVER) { $env:SUPABASE_DNS_RESOLVER } else { "native" }

if ($env:SUPABASE_DB_URL) {
  Write-Host "Using SUPABASE_DB_URL (from Dashboard connection string)."
  npx supabase db push --include-all --dns-resolver $dns --db-url $env:SUPABASE_DB_URL
  exit $LASTEXITCODE
}

if (-not $env:SUPABASE_DB_PASSWORD) {
  Write-Error "Set SUPABASE_DB_PASSWORD, or SUPABASE_DB_URL with the full postgresql:// URI from the Supabase Dashboard."
}

$pw = $env:SUPABASE_DB_PASSWORD
$enc = [Uri]::EscapeDataString($pw)

# libpq URI: user "postgres.<project_ref>" must use %2E for the dot before password colon
$userEnc = "postgres%2E$projectRef"

if ($env:SUPABASE_USE_SESSION_POOLER -eq "1") {
  $poolerHost = "aws-0-$region.pooler.supabase.com"
  $dbUrl = "postgresql://${userEnc}:${enc}@${poolerHost}:5432/postgres"
  Write-Host "Using session pooler :5432 (dns-resolver=$dns): $poolerHost"
  Write-Host "If you see pool queue timeouts, run migrations from GitHub Actions or Supabase SQL Editor instead."
} else {
  $dbUrl = "postgresql://postgres:${enc}@db.${projectRef}.supabase.co:5432/postgres"
  Write-Host "Using direct db host (dns-resolver=$dns): db.${projectRef}.supabase.co"
  Write-Host "If you see 'no such host', run: `$env:SUPABASE_USE_SESSION_POOLER='1'; npm run db:push:with-password"
}

if ($dns -eq "https") {
  Write-Host "NOTE: dns-resolver=https uses Cloudflare 1.1.1.1:443. If refused, use native or remove SUPABASE_DNS_RESOLVER."
}

npx supabase db push --include-all --dns-resolver $dns --db-url $dbUrl
