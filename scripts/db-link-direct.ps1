# One-time: link project using direct Postgres (not pooler). Fixes many "context deadline exceeded" timeouts.
# Requires: npx supabase login, and SUPABASE_DB_PASSWORD (Settings > Database > reset password if unknown).
# Usage (PowerShell, repo root):
#   $env:SUPABASE_DB_PASSWORD = "your-db-password"
#   powershell -ExecutionPolicy Bypass -File scripts/db-link-direct.ps1

$ErrorActionPreference = 'Stop'
if (-not $env:SUPABASE_DB_PASSWORD) {
  Write-Error "Set SUPABASE_DB_PASSWORD to your Supabase database password first (Dashboard > Settings > Database)."
}
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
npx supabase link --project-ref mavbnybtyfewfsihmuri --skip-pooler -p $env:SUPABASE_DB_PASSWORD --yes
Write-Host "Done. Next: npm run db:push (or set SUPABASE_DB_PASSWORD and run npm run db:push:with-password)"
