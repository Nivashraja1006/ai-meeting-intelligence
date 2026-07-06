# Push to GitHub and print deploy next steps
# Usage: powershell -ExecutionPolicy Bypass -File scripts/push-to-github.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "`n=== AI Meeting Intelligence — GitHub Push ===" -ForegroundColor Cyan

if (-not (Test-Path .git)) {
    git init
    git branch -M main
}

Write-Host "`n--- gh auth status ---"
gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Run: gh auth login" -ForegroundColor Yellow
    exit 1
}

$origin = git remote get-url origin 2>$null
if (-not $origin) {
    Write-Host "`n--- Creating GitHub repo ---"
    gh repo create ai-meeting-intelligence-assistant `
        --public `
        --source=. `
        --remote=origin `
        --description "AI Meeting Intelligence Assistant — GenAI portfolio with forced Claude tool_use"
} else {
    Write-Host "Remote origin already set: $origin"
}

Write-Host "`n--- Staging files ---"
git add -A
git status --short

$pending = git diff --cached --name-only
if (-not $pending) {
    Write-Host "Nothing to commit." -ForegroundColor Yellow
} else {
    git commit -m "Initial commit: AI Meeting Intelligence Assistant (Days 1-10)" -m "FastAPI backend with forced Anthropic tool_use, Whisper transcription, JWT auth, SQLite persistence, PDF export, and React frontend."
}

Write-Host "`n--- Pushing to origin/main ---"
git push -u origin main

$remoteUrl = git remote get-url origin
Write-Host "`n=== SUCCESS ===" -ForegroundColor Green
Write-Host "Repository: $remoteUrl"
Write-Host "`nNext steps:"
Write-Host "  1. Render:  https://dashboard.render.com → New Blueprint → connect repo (render.yaml)"
Write-Host "  2. Vercel:  https://vercel.com/new → import repo → Root Directory: frontend"
Write-Host "  3. Set env vars (see DEPLOY.md)"
Write-Host "  4. Run: powershell -File scripts/update-readme-urls.ps1 -BackendUrl ... -FrontendUrl ..."
Write-Host ""
