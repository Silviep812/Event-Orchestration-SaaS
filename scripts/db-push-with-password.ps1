# Push migrations using DB password (works with direct link; use if pooler still times out).
# Usage:
#   $env:SUPABASE_DB_PASSWORD = "your-db-password"
#   powershell -ExecutionPolicy Bypass -File scripts/db-push-with-password.ps1

$ErrorActionPreference = 'Stop'
if (-not $env:SUPABASE_DB_PASSWORD) {
  Write-Error "Set SUPABASE_DB_PASSWORD to your Supabase database password first."
}
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
npx supabase db push --include-all -p $env:SUPABASE_DB_PASSWORD
