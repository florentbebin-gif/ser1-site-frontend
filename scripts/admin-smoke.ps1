param (
    [string]$Action = "ping_public"
)

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_URL) {
    throw "SUPABASE_URL environment variable is required."
}

if (-not $env:SUPABASE_ANON_KEY) {
    throw "SUPABASE_ANON_KEY environment variable is required."
}

$token = $env:SUPABASE_TOKEN
if (-not $token) {
    Write-Warning "SUPABASE_TOKEN not provided. Requests requiring auth will fail."}

$rid = [guid]::NewGuid().ToString()
$body = @{ action = $Action } | ConvertTo-Json -Depth 3
$uri = "$($env:SUPABASE_URL)/functions/v1/admin"

$headers = @{ 
    "x-request-id" = $rid
    "Content-Type" = "application/json"
    "apikey" = $env:SUPABASE_ANON_KEY
}
if ($token) {
    $headers["Authorization"] = "Bearer $token"
}

Write-Host "[SMOKE] Action=$Action RID=$rid" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body -TimeoutSec 15 -SkipHeaderValidation
    Write-Host "Status: 200" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 6
} catch {
    if ($_.Exception.Response) {
        $status = $_.Exception.Response.StatusCode.value__
        Write-Host "Status: $status" -ForegroundColor Yellow
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $bodyText = $reader.ReadToEnd()
        Write-Host $bodyText
    } else {
        Write-Error $_
    }
}
