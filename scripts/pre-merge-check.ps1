param(
  [switch]$Strict
)

$ErrorActionPreference = 'Stop'

$selfRepoPath = 'tools/scripts/pre-merge-check.ps1'

function Write-Result([string]$Key, [string]$Value) {
  Write-Output ("{0}={1}" -f $Key, $Value)
}

function Run-ScanSecrets() {
  $scriptPath = Join-Path $PSScriptRoot 'scan-secrets.ps1'
  if (-not (Test-Path $scriptPath)) {
    Write-Result 'PRE_MERGE_SCAN_SECRETS' 'FAIL(missing-script)'
    return $false
  }

  # Run directly (no pipeline) so exit code is reliable.
  & powershell -NoProfile -ExecutionPolicy Bypass -File $scriptPath
  $code = $LASTEXITCODE
  if ($code -ne 0) {
    Write-Result 'PRE_MERGE_SCAN_SECRETS' ('FAIL(exit={0})' -f $code)
    return $false
  }

  Write-Result 'PRE_MERGE_SCAN_SECRETS' 'PASS'
  return $true
}

function Get-TrackedEvidenceSql() {
  $files = @()
  try {
    $out = git ls-files "docs/runbook/evidence/*.sql"
    if ($out) {
      $files = @($out -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    }
  } catch {
    # ignore
  }
  return $files
}

function Get-FilesWithMatches([string]$Pattern) {
  $rg = Get-Command rg -ErrorAction SilentlyContinue
  if ($rg) {
    $out = @(& rg --files-with-matches --hidden --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/playwright-report/**' --glob '!**/package-lock.json' --glob '!**/.env*' --glob '!tools/scripts/pre-merge-check.ps1' $Pattern 2>$null)
    $code = $LASTEXITCODE
    if ($code -eq 0) { return $out }
    if ($code -eq 1) { return @() }
    throw "rg failed (exit=$code)"
  }

  # Fallback: Select-String over tracked files only (no match content printed)
  $tracked = git ls-files
  $hits = @()
  foreach ($f in $tracked) {
    if ($f -eq $selfRepoPath) { continue }
    try {
      $m = Select-String -Path $f -Pattern $Pattern -SimpleMatch -Quiet
      if ($m) { $hits += $f }
    } catch {
      # ignore binary/unreadable
    }
  }
  return $hits
}

function Check-Patterns() {
  $patterns = @(
    @{ Name = 'JWT_PREFIX'; Pattern = 'eyJhbGci' },
    @{ Name = 'AUTH_BEARER_EQUALS'; Pattern = 'Authorization = "Bearer' },
    @{ Name = 'APIKEY_EQUALS'; Pattern = 'apikey =' },
    @{ Name = 'SUPABASE_JWT_SECRET'; Pattern = 'SUPABASE_JWT_SECRET' },
    @{ Name = 'SUPABASE_SERVICE_ROLE_KEY'; Pattern = 'SUPABASE_SERVICE_ROLE_KEY' },
    @{ Name = 'HARDCODED_PROBE'; Pattern = 'Ser1Probe' },
    @{ Name = 'TEMP_PROBE'; Pattern = 'Temp-Probe' }
  )

  $ok = $true
  foreach ($p in $patterns) {
    $files = @()
    try { $files = @(Get-FilesWithMatches -Pattern $p.Pattern) } catch { $files = @() }

    if ($files.Count -gt 0) {
      $ok = $false
      Write-Result ("PRE_MERGE_RG_{0}" -f $p.Name) ("FAIL(matches={0})" -f $files.Count)
      $files | ForEach-Object { Write-Output ("- {0}" -f $_) }
    } else {
      Write-Result ("PRE_MERGE_RG_{0}" -f $p.Name) 'PASS'
    }
  }

  return $ok
}

$allOk = $true

# 0) Prevent committing runtime SQL logs
$trackedSql = Get-TrackedEvidenceSql
if ($trackedSql.Count -gt 0) {
  $allOk = $false
  Write-Result 'PRE_MERGE_EVIDENCE_SQL_TRACKED' ("FAIL(count={0})" -f $trackedSql.Count)
  $trackedSql | ForEach-Object { Write-Output ("- {0}" -f $_) }
} else {
  Write-Result 'PRE_MERGE_EVIDENCE_SQL_TRACKED' 'PASS'
}

# 1) Run secret scan script
if (-not (Run-ScanSecrets)) { $allOk = $false }

# 2) Extra lightweight grep guardrails (no raw outputs)
if (-not (Check-Patterns)) { $allOk = $false }

if (-not $allOk) {
  if ($Strict) {
    throw 'Pre-merge checks failed.'
  }
  exit 1
}

Write-Result 'PRE_MERGE' 'PASS'
exit 0
