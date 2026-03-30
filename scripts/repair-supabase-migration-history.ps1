# Removes remote-only migration version rows so "npx supabase db push" can run.
# Safe for schema/data: only updates supabase_migrations history (see Supabase migration repair docs).
# Prereq: supabase login, supabase link --project-ref <ref>
# Usage (repo root): powershell -ExecutionPolicy Bypass -File scripts/repair-supabase-migration-history.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$file = Join-Path $PSScriptRoot 'remote-only-migration-versions.txt'
if (-not (Test-Path $file)) { throw "Missing $file" }

$versions = @(Get-Content $file | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
if ($versions.Count -eq 0) { throw "No versions in $file" }

Write-Host "Reverting $($versions.Count) remote-only migration history entries in batches of 40..."

$batchSize = 40
for ($i = 0; $i -lt $versions.Count; $i += $batchSize) {
  $take = [Math]::Min($batchSize, $versions.Count - $i)
  $batch = $versions[$i..($i + $take - 1)]
  $batchNum = [int]($i / $batchSize) + 1
  $totalBatches = [Math]::Ceiling($versions.Count / $batchSize)
  Write-Host "Batch $batchNum / $totalBatches ($take versions)..."
  & npx supabase migration repair --status reverted @batch --yes
}

Write-Host ""
Write-Host "Repair finished. Next run: npx supabase db push"
Write-Host "If push errors with 'already exists', note the migration name and ask for help or use migration repair --status applied for that version."
