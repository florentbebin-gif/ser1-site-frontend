#!/usr/bin/env pwsh
# Install githooks - configures git to use .githooks directory
# Run: pwsh scripts/install-githooks.ps1

$ErrorActionPreference = "Stop"

Write-Host "Installation des githooks..." -ForegroundColor Cyan

# Set core.hooksPath to .githooks
git config core.hooksPath .githooks

# Verify
$hooksPath = git config --get core.hooksPath
if ($hooksPath -eq ".githooks") {
    Write-Host "Githooks installes avec succes" -ForegroundColor Green
    Write-Host "   core.hooksPath = $hooksPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Fonctionnalites activees :" -ForegroundColor Cyan
    Write-Host "   - Blocage du push direct sur main/master" -ForegroundColor Gray
    Write-Host "   - Override possible : ALLOW_PUSH_MAIN=1 git push ..." -ForegroundColor Gray
} else {
    Write-Host "Erreur lors de l'installation des githooks" -ForegroundColor Red
    exit 1
}
