param(
  [string]$SupabaseUrl = $env:SUPABASE_URL,
  [string]$SupabaseAnonKey = $env:SUPABASE_ANON_KEY,
  [string]$SupabaseDbUrl = $env:SUPABASE_DB_URL,
  [string]$SupabaseAccessToken = $env:SUPABASE_ACCESS_TOKEN,
  [string]$ProjectRef = '',
  [switch]$SkipSignupProbe,
  [switch]$PolicyOnly,
  [switch]$ShowPolicyDefs,
  [string]$ProbeEmail = ("ser1-signup-probe+{0}@example.com" -f ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())),
  [string]$SignupDisabledPattern = 'Signups not allowed|signup_disabled|signups disabled'
)

$ErrorActionPreference = 'Stop'

function Write-Section([string]$Title) {
  Write-Host ""
  Write-Host "=== $Title ==="
}

function Write-Result([string]$Key, [string]$Value) {
  Write-Output ("{0}={1}" -f $Key, $Value)
}

function Get-DbTarget([string]$DbUrl) {
  if ([string]::IsNullOrWhiteSpace($DbUrl)) { return 'N/A' }
  try {
    $uri = [System.Uri]$DbUrl
    $dbName = $uri.AbsolutePath.Trim('/')
    return "$($uri.Host)/$dbName"
  } catch {
    return 'masked'
  }
}

function Invoke-SupabaseSqlApi([string]$Ref, [string]$Token, [string]$Sql) {
  $headers = @{
    Authorization = "Bearer $Token"
    'Content-Type' = 'application/json'
  }
  $body = @{ query = $Sql } | ConvertTo-Json
  return Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$Ref/database/query" -Headers $headers -Body $body
}

$summary = [ordered]@{
  P0_01 = 'UNKNOWN'
  P0_02 = 'UNKNOWN'
}

$probePassword = 'Ser1Probe!234abc'

Write-Section "B3 Runtime Verification (read-only)"

if (-not $SkipSignupProbe -and -not $PolicyOnly) {
  Write-Section "Signup Probe (P0-01)"
  if ([string]::IsNullOrWhiteSpace($SupabaseUrl) -or [string]::IsNullOrWhiteSpace($SupabaseAnonKey)) {
    Write-Result "SIGNUP_PROBE" "UNKNOWN (missing SUPABASE_URL or SUPABASE_ANON_KEY)"
  } else {
    $signupUri = "$($SupabaseUrl.TrimEnd('/'))/auth/v1/signup"
    $payload = @{
      email = $ProbeEmail
      password = $probePassword
    } | ConvertTo-Json

    $status = 0
    $body = ''
    try {
      $response = Invoke-WebRequest -Uri $signupUri -Method Post -ContentType 'application/json' -Headers @{ apikey = $SupabaseAnonKey; Authorization = "Bearer $SupabaseAnonKey" } -Body $payload -UseBasicParsing
      $status = [int]$response.StatusCode
      $bodyRaw = $response.Content
      if ($null -eq $bodyRaw) { $bodyRaw = '' }
      $body = ([string]$bodyRaw) -replace "\r|\n", ' '
    } catch {
      $ex = $_.Exception
      if ($ex.Response -and $ex.Response.StatusCode) {
        $status = [int]$ex.Response.StatusCode
      }
      try {
        if ($ex.Response -and $ex.Response.GetResponseStream) {
          $stream = $ex.Response.GetResponseStream()
          if ($stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            $body = ($reader.ReadToEnd()) -replace "\r|\n", ' '
            $reader.Close()
          }
        }
      } catch {
        if ([string]::IsNullOrWhiteSpace($body)) {
          $body = $ex.Message
        }
      }
    }

    if ($body -match $SignupDisabledPattern) {
      $summary.P0_01 = 'PASS'
      Write-Result "P0_01_DECISION" "PASS(body-explicit-signups-disabled)"
    } elseif ($status -in 200, 201) {
      $summary.P0_01 = 'FAIL'
      Write-Result "P0_01_DECISION" "FAIL(signup-http-success)"
    } elseif (-not [string]::IsNullOrWhiteSpace($SupabaseAccessToken) -and -not [string]::IsNullOrWhiteSpace($ProjectRef)) {
      try {
        $authConfig = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ProjectRef/config/auth" -Headers @{ Authorization = "Bearer $SupabaseAccessToken" }
        Write-Result "AUTH_CONFIG_SOURCE" "GET /v1/projects/$ProjectRef/config/auth"
        Write-Result "AUTH_DISABLE_SIGNUP" ([string]$authConfig.disable_signup)
        if ($authConfig.disable_signup -eq $true) {
          $summary.P0_01 = 'PASS'
          Write-Result "P0_01_DECISION" "PASS(auth-config-disable_signup=true)"
        } else {
          $summary.P0_01 = 'UNKNOWN'
          Write-Result "P0_01_DECISION" "UNKNOWN(auth-config-disable_signup=false-and-no-explicit-body-proof)"
        }
      } catch {
        $summary.P0_01 = 'UNKNOWN'
        Write-Result "P0_01_DECISION" "UNKNOWN(auth-config-unreachable)"
      }
    } else {
      $summary.P0_01 = 'UNKNOWN'
      Write-Result "P0_01_DECISION" "UNKNOWN(no-explicit-body-proof-and-no-auth-config-proof)"
    }

    Write-Result "SIGNUP_STATUS" "$status"
    Write-Result "SIGNUP_BODY" $body
    Write-Result "P0_01" $summary.P0_01
  }
} else {
  Write-Result "SIGNUP_PROBE" "SKIPPED"
}

Write-Section "SQL checks (P0-02)"
if (-not [string]::IsNullOrWhiteSpace($SupabaseDbUrl)) {
  Write-Result "DB_TARGET" (Get-DbTarget $SupabaseDbUrl)
  try {
    $policyCount = psql "$SupabaseDbUrl" -t -A -c "select count(*) from pg_policies where tablename='profiles';"
    $policyNames = psql "$SupabaseDbUrl" -t -A -c "select policyname from pg_policies where tablename='profiles' order by policyname;"
    if ($ShowPolicyDefs) {
      $policyDefsRaw = psql "$SupabaseDbUrl" -t -A -F "|" -c "select policyname, coalesce(qual, ''), coalesce(with_check, '') from pg_policies where tablename='profiles' order by policyname;"
    }
    $rlsValue = psql "$SupabaseDbUrl" -t -A -c "select relrowsecurity::text from pg_class where relname='profiles';"

    $policyCountInt = [int]($policyCount.Trim())
    $rlsEnabled = ($rlsValue.Trim() -eq 'true' -or $rlsValue.Trim() -eq 't')

    Write-Result "PROFILES_POLICIES_COUNT" "$policyCountInt"
    Write-Result "PROFILES_RLS" ($rlsValue.Trim())
    Write-Result "PROFILES_POLICY_NAMES" (($policyNames -split "\r?\n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }) -join ',')
    if ($ShowPolicyDefs) {
      $policyDefLines = @($policyDefsRaw -split "\r?\n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
      $containsCabinetId = $false
      foreach ($line in $policyDefLines) {
        $parts = $line -split '\|', 3
        $pName = $parts[0]
        $pQual = if ($parts.Length -gt 1) { $parts[1] } else { '' }
        $pCheck = if ($parts.Length -gt 2) { $parts[2] } else { '' }
        if (($pQual -match 'cabinet_id') -or ($pCheck -match 'cabinet_id')) {
          $containsCabinetId = $true
        }
        Write-Result "POLICY_DEF" ("{0} | qual={1} | with_check={2}" -f $pName, $pQual, $pCheck)
      }
      Write-Result "POLICIES_INCLUDE_CABINET_ID" ([string]$containsCabinetId)
    }

    if ($policyCountInt -gt 0 -and $rlsEnabled -and ((-not $ShowPolicyDefs) -or $containsCabinetId)) {
      $summary.P0_02 = 'PASS'
    } else {
      $summary.P0_02 = 'FAIL'
    }
  } catch {
    $summary.P0_02 = 'FAIL'
    Write-Result "P0_02_ERROR" $_.Exception.Message
  }
} elseif (-not [string]::IsNullOrWhiteSpace($SupabaseAccessToken) -and -not [string]::IsNullOrWhiteSpace($ProjectRef)) {
  try {
    $policyCountResp = Invoke-SupabaseSqlApi -Ref $ProjectRef -Token $SupabaseAccessToken -Sql "select count(*) as c from pg_policies where tablename='profiles';"
    $policyNamesResp = Invoke-SupabaseSqlApi -Ref $ProjectRef -Token $SupabaseAccessToken -Sql "select policyname from pg_policies where tablename='profiles' order by policyname;"
    if ($ShowPolicyDefs) {
      $policyDefsResp = Invoke-SupabaseSqlApi -Ref $ProjectRef -Token $SupabaseAccessToken -Sql "select policyname, coalesce(qual, '') as qual, coalesce(with_check, '') as with_check from pg_policies where tablename='profiles' order by policyname;"
    }
    $rlsResp = Invoke-SupabaseSqlApi -Ref $ProjectRef -Token $SupabaseAccessToken -Sql "select relrowsecurity::text as rls from pg_class where relname='profiles';"

    $policyCountInt = [int]$policyCountResp.c
    $rlsValue = [string]$rlsResp.rls
    $rlsEnabled = ($rlsValue -eq 'true' -or $rlsValue -eq 't')

    Write-Result "PROJECT_REF" $ProjectRef
    Write-Result "PROFILES_POLICIES_COUNT" "$policyCountInt"
    Write-Result "PROFILES_RLS" $rlsValue
    Write-Result "PROFILES_POLICY_NAMES" (($policyNamesResp | ForEach-Object { $_.policyname }) -join ',')
    if ($ShowPolicyDefs) {
      $containsCabinetId = $false
      foreach ($row in $policyDefsResp) {
        $q = [string]$row.qual
        $w = [string]$row.with_check
        if (($q -match 'cabinet_id') -or ($w -match 'cabinet_id')) {
          $containsCabinetId = $true
        }
        Write-Result "POLICY_DEF" ("{0} | qual={1} | with_check={2}" -f $row.policyname, $q, $w)
      }
      Write-Result "POLICIES_INCLUDE_CABINET_ID" ([string]$containsCabinetId)
    }

    if ($policyCountInt -gt 0 -and $rlsEnabled -and ((-not $ShowPolicyDefs) -or $containsCabinetId)) {
      $summary.P0_02 = 'PASS'
    } else {
      $summary.P0_02 = 'FAIL'
    }
  } catch {
    $summary.P0_02 = 'FAIL'
    Write-Result "P0_02_ERROR" $_.Exception.Message
  }
} else {
  Write-Result "P0_02" "UNKNOWN (missing SUPABASE_DB_URL and API fallback inputs)"
}

Write-Section "Summary"
$summary.GetEnumerator() | ForEach-Object { Write-Result $_.Key $_.Value }
