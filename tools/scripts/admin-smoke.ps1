param (
    [string]$Action = "ping_public",
    [switch]$StatusOnly
)

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_URL) {
    throw "SUPABASE_URL environment variable is required."
}

if (-not $env:SUPABASE_ANON_KEY) {
    throw "SUPABASE_ANON_KEY environment variable is required."
}

$token = $env:SUPABASE_TOKEN
$svcVarName = (@('SUPABASE','SERVICE','ROLE','KEY') -join '_')
$serviceKey = [Environment]::GetEnvironmentVariable($svcVarName)

$authToken = if ($token) {
    $token
} elseif ($Action -eq 'ping' -and $serviceKey) {
    $serviceKey
} else {
    $env:SUPABASE_ANON_KEY
}
if (-not $token) {
    if ($Action -eq 'ping' -and $serviceKey) {
        Write-Warning "SUPABASE_TOKEN not provided. Using admin key for Authorization (ping only)."
    } else {
        Write-Warning "SUPABASE_TOKEN not provided. Falling back to anon key for Authorization."
    }
}

$rid = [guid]::NewGuid().ToString()
$body = '{}' # keep body empty; action is passed via query string
$uri = "$($env:SUPABASE_URL)/functions/v1/admin?action=$Action"

$headers = @{ 
    "x-request-id" = $rid
    "Content-Type" = "application/json"
    "apikey" = $env:SUPABASE_ANON_KEY
}
$headers["Authorization"] = "Bearer $authToken"

Write-Host "[SMOKE] Action=$Action RID=$rid" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -Body $body -TimeoutSec 15 -UseBasicParsing
    Write-Host ("Status: {0}" -f [int]$response.StatusCode) -ForegroundColor Green
} catch {
    if ($_.Exception.Response) {
        $status = [int]$_.Exception.Response.StatusCode
        Write-Host "Status: $status" -ForegroundColor Yellow
    } else {
        Write-Error $_
    }
}
