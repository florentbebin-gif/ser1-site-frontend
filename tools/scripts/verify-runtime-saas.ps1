param(
  [string]$SupabaseUrl = $env:SUPABASE_URL,
  [string]$SupabaseAnonKey = $env:SUPABASE_ANON_KEY,
  [string]$SupabaseDbUrl = $env:SUPABASE_DB_URL,
  [switch]$SkipSignupProbe,
  [string]$ProbeEmail = "ser1-signup-probe@ser1.invalid",
  [string]$ProbePassword = "Ser1-Temp-Probe-123!"
)

$ErrorActionPreference = 'Stop'

function Write-Section([string]$Title) {
  Write-Host ""
  Write-Host "=== $Title ==="
}

function Write-Result([string]$Key, [string]$Value) {
  Write-Output ("{0}={1}" -f $Key, $Value)
}

$summary = [ordered]@{
  SIGNUP_PROBE = 'UNKNOWN'
  PROFILES_POLICIES = 'UNKNOWN'
  PROFILES_RLS = 'UNKNOWN'
  CABINET_ISOLATION = 'UNKNOWN'
}

Write-Section "B3 Runtime Verification (read-only)"

if (-not $SkipSignupProbe) {
  Write-Section "Signup Probe (P0-01)"
  if ([string]::IsNullOrWhiteSpace($SupabaseUrl) -or [string]::IsNullOrWhiteSpace($SupabaseAnonKey)) {
    Write-Result "SIGNUP_PROBE" "UNKNOWN (missing SUPABASE_URL or SUPABASE_ANON_KEY)"
  } else {
    $signupUri = "$($SupabaseUrl.TrimEnd('/'))/auth/v1/signup"
    $payload = @{
      email = $ProbeEmail
      password = $ProbePassword
    } | ConvertTo-Json

    try {
      $response = Invoke-WebRequest -Uri $signupUri -Method Post -ContentType 'application/json' -Headers @{ apikey = $SupabaseAnonKey } -Body $payload -UseBasicParsing
      $body = $response.Content
      if ($body -match 'Signups not allowed' -or $body -match 'signup_disabled') {
        $summary.SIGNUP_PROBE = 'PASS'
      } else {
        $summary.SIGNUP_PROBE = 'FAIL'
      }
      Write-Result "SIGNUP_STATUS" $response.StatusCode
      Write-Result "SIGNUP_BODY" ($body -replace "\r|\n", ' ')
      Write-Result "SIGNUP_PROBE" $summary.SIGNUP_PROBE
    } catch {
      $status = $_.Exception.Response.StatusCode.value__
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $body = $reader.ReadToEnd()
      if ($body -match 'Signups not allowed' -or $body -match 'signup_disabled') {
        $summary.SIGNUP_PROBE = 'PASS'
      } else {
        $summary.SIGNUP_PROBE = 'UNKNOWN'
      }
      Write-Result "SIGNUP_STATUS" $status
      Write-Result "SIGNUP_BODY" ($body -replace "\r|\n", ' ')
      Write-Result "SIGNUP_PROBE" $summary.SIGNUP_PROBE
    }
  }
} else {
  Write-Result "SIGNUP_PROBE" "SKIPPED"
}

Write-Section "SQL checks (P0-02)"
if ([string]::IsNullOrWhiteSpace($SupabaseDbUrl)) {
  Write-Result "PROFILES_POLICIES" "UNKNOWN (missing SUPABASE_DB_URL)"
  Write-Result "PROFILES_RLS" "UNKNOWN (missing SUPABASE_DB_URL)"
  Write-Result "CABINET_ISOLATION" "UNKNOWN (manual SQL required)"
} else {
  $policySql = "select schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check from pg_policies where tablename = 'profiles' order by policyname;"
  $rlsSql = "select relrowsecurity from pg_class where relname = 'profiles';"

  try {
    Write-Host "-- pg_policies(profiles) --"
    psql "$SupabaseDbUrl" -c "$policySql"
    $summary.PROFILES_POLICIES = 'PASS'
  } catch {
    $summary.PROFILES_POLICIES = 'FAIL'
  }

  try {
    Write-Host "-- relrowsecurity(profiles) --"
    $rlsOutput = psql "$SupabaseDbUrl" -t -A -c "$rlsSql"
    Write-Output $rlsOutput
    if ($rlsOutput -match 't') {
      $summary.PROFILES_RLS = 'PASS'
    } else {
      $summary.PROFILES_RLS = 'FAIL'
    }
  } catch {
    $summary.PROFILES_RLS = 'FAIL'
  }

  Write-Host "-- cabinet isolation SQL template --"
  Write-Output "-- Remplacer <admin_a_uuid> et <admin_b_uuid>"
  Write-Output "select id, cabinet_id, role from profiles where id in ('<admin_a_uuid>', '<admin_b_uuid>');"
  Write-Output "-- Vérifier qu'admin A ne voit pas les profils du cabinet de B via session JWT admin A (test applicatif recommandé)."
  $summary.CABINET_ISOLATION = 'UNKNOWN'
}

Write-Section "Summary"
$summary.GetEnumerator() | ForEach-Object { Write-Result $_.Key $_.Value }
