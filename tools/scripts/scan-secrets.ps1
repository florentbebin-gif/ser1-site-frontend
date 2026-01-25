# =============================================================================
# SER1 - Scan for hardcoded secrets
# =============================================================================
# Usage: .\tools\scripts\scan-secrets.ps1
# Purpose: Detect hardcoded Supabase URLs, project refs, or API keys before commit
# =============================================================================

Write-Host "🔍 Scanning for hardcoded secrets..." -ForegroundColor Cyan
Write-Host ""

$patterns = @(
    @{ Name = "Supabase project ref"; Pattern = "xnpbxrqkzgimiugqtago" },
    @{ Name = "Supabase URL hardcoded"; Pattern = "\.supabase\.co(?!/functions)" },
    @{ Name = "JWT/API key pattern"; Pattern = "eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}" },
    @{ Name = "Vercel deployment URL"; Pattern = "ser1.*\.vercel\.app" }
)

$excludeDirs = @("node_modules", "dist", ".git", ".vercel", "supabase\.temp")
$excludePattern = ($excludeDirs | ForEach-Object { "\\$_\\" }) -join "|"

$hasIssues = $false

foreach ($p in $patterns) {
    Write-Host "Checking: $($p.Name)" -ForegroundColor Yellow
    
    $matches = Get-ChildItem -Recurse -File -Include "*.ts","*.tsx","*.js","*.jsx","*.json","*.md","*.sql" |
        Where-Object { $_.FullName -notmatch $excludePattern } |
        Select-String -Pattern $p.Pattern -AllMatches
    
    if ($matches) {
        $hasIssues = $true
        Write-Host "  ❌ Found $($matches.Count) match(es):" -ForegroundColor Red
        $matches | ForEach-Object {
            Write-Host "     $($_.Path):$($_.LineNumber)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✅ Clean" -ForegroundColor Green
    }
}

Write-Host ""
if ($hasIssues) {
    Write-Host "⚠️  Issues found! Review and fix before committing." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ No hardcoded secrets detected." -ForegroundColor Green
    exit 0
}
