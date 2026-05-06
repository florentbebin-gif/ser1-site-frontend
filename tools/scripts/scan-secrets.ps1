# =============================================================================
# SER1 - Scan for hardcoded secrets
# =============================================================================
# Usage: .\tools\scripts\scan-secrets.ps1
# Purpose: Detect hardcoded Supabase URLs, project refs, or API keys before commit
# =============================================================================

Write-Host "[scan-secrets] Scanning for hardcoded secrets..." -ForegroundColor Cyan
Write-Host ""

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

$patterns = @(
    @{ Name = "Supabase project ref"; Pattern = 'xnpbxrqkzgimiugqtago' },
    @{ Name = "Supabase URL hardcoded"; Pattern = '\.supabase\.co(?!/functions)' },
    # JWTs typically look like 3 base64url-ish segments separated by dots.
    # Intentionally avoid embedding specific prefixes.
    @{ Name = "JWT-like token pattern"; Pattern = '[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}' },
    @{ Name = "Vercel deployment URL"; Pattern = 'ser1.*\.vercel\.app' }
)

$excludePattern = '\\(node_modules|dist|\.git|\.vercel|supabase\\\.temp)\\'
$allowedMatches = @{
    "Vercel deployment URL" = @(
        "supabase/functions/admin/cors.ts",
        "supabase/functions/admin/cors_test.ts"
    )
}

function Get-RepoRelativePath([string]$Path) {
    $fullPath = (Resolve-Path -LiteralPath $Path).Path
    if ($fullPath.StartsWith($repoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        $relative = $fullPath.Substring($repoRoot.Length).TrimStart('\', '/')
        return $relative.Replace('\', '/')
    }
    return $fullPath.Replace('\', '/')
}

function Test-AllowedMatch([string]$PatternName, [string]$Path) {
    if (-not $allowedMatches.ContainsKey($PatternName)) {
        return $false
    }

    $relative = Get-RepoRelativePath $Path
    return $allowedMatches[$PatternName] -contains $relative
}

$hasIssues = $false

foreach ($p in $patterns) {
    Write-Host "Checking: $($p.Name)" -ForegroundColor Yellow
    
    $matches = Get-ChildItem -Recurse -File -Include "*.ts","*.tsx","*.js","*.jsx","*.json","*.md","*.sql" |
        Where-Object { $_.FullName -notmatch $excludePattern } |
        Select-String -Pattern $p.Pattern -AllMatches |
        Where-Object { -not (Test-AllowedMatch $p.Name $_.Path) }
    
    if ($matches) {
        $hasIssues = $true
        Write-Host "  [FAIL] Found $($matches.Count) match(es):" -ForegroundColor Red
        $matches | ForEach-Object {
            Write-Host "     $($_.Path):$($_.LineNumber)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  [PASS] Clean" -ForegroundColor Green
    }
}

Write-Host ""
if ($hasIssues) {
    Write-Host "[scan-secrets] Issues found! Review and fix before committing." -ForegroundColor Red
    exit 1
} else {
    Write-Host "[scan-secrets] No hardcoded secrets detected." -ForegroundColor Green
    exit 0
}
