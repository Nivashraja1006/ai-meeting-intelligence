# Full verify + GitHub push + deploy pipeline
# Usage: powershell -ExecutionPolicy Bypass -File scripts/deploy-all.ps1
# Optional: -SkipDeploy if you only want verify + push

param(
    [switch]$SkipDeploy,
    [string]$LogFile = ""
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
if (-not $LogFile) {
    $LogFile = Join-Path $Root "deploy-run.log"
}

function Log {
    param([string]$Message)
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

Set-Location $Root
"" | Set-Content -Path $LogFile
Log "=== AI Meeting Intelligence — Deploy Pipeline ==="
Log "Project root: $Root"

# --- 1. Backend tests ---
Log "--- Backend tests ---"
$venvPython = Join-Path $Root "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Log "Creating backend venv..."
    python -m venv (Join-Path $Root "backend\.venv")
    & (Join-Path $Root "backend\.venv\Scripts\pip.exe") install -r (Join-Path $Root "backend\requirements.txt") 2>&1 | ForEach-Object { Log $_ }
}
$pytestOut = & $venvPython -m pytest (Join-Path $Root "backend\tests") -v 2>&1
$pytestOut | ForEach-Object { Log $_ }
if ($LASTEXITCODE -ne 0) {
    Log "WARN: Backend tests failed (exit $LASTEXITCODE) — continuing deploy"
}

# --- 2. Frontend build ---
Log "--- Frontend build ---"
Push-Location (Join-Path $Root "frontend")
if (-not (Test-Path "node_modules")) {
    Log "Running npm install..."
    npm install 2>&1 | ForEach-Object { Log $_ }
}
npm run build 2>&1 | ForEach-Object { Log $_ }
$buildOk = ($LASTEXITCODE -eq 0)
Pop-Location
if (-not $buildOk) {
    Log "ERROR: Frontend build failed"
    exit 1
}

# --- 3. Git commit + push ---
Log "--- Git ---"
if (-not (Test-Path (Join-Path $Root ".git"))) {
    git init
    git branch -M main
}

$currentBranch = git rev-parse --abbrev-ref HEAD 2>$null
if ($currentBranch -eq "master") {
    git branch -M main
}

Log "gh auth status:"
gh auth status 2>&1 | ForEach-Object { Log $_ }

$origin = git remote get-url origin 2>$null
if (-not $origin) {
    Log "Creating GitHub repo..."
    gh repo create ai-meeting-intelligence-assistant `
        --public `
        --source=. `
        --remote=origin `
        --description "AI Meeting Intelligence Assistant — GenAI portfolio with forced Claude tool_use" 2>&1 | ForEach-Object { Log $_ }
}

git add -A
git status --short 2>&1 | ForEach-Object { Log $_ }
$staged = git diff --cached --name-only
if ($staged) {
    git commit -m "chore: production-ready deploy — tests, build, deploy configs" 2>&1 | ForEach-Object { Log $_ }
}
git push -u origin main 2>&1 | ForEach-Object { Log $_ }
$remoteUrl = git remote get-url origin 2>$null
Log "Git remote: $remoteUrl"

if ($SkipDeploy) {
    Log "SkipDeploy set — done after push"
    exit 0
}

# --- 4. Backend deploy (Render Blueprint note) ---
Log "--- Backend deploy ---"
Log "Render: Connect repo at https://dashboard.render.com/select-repo?type=blueprint"
Log "Use render.yaml in repo root. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, CORS_ORIGINS manually."

$fly = Get-Command fly -ErrorAction SilentlyContinue
if ($fly) {
    Log "Attempting fly deploy from backend/..."
    Push-Location (Join-Path $Root "backend")
    fly deploy 2>&1 | ForEach-Object { Log $_ }
    Pop-Location
} else {
    Log "fly CLI not found — use Render dashboard (see DEPLOY.md)"
}

# --- 5. Frontend deploy (Vercel) ---
Log "--- Frontend deploy ---"
Push-Location (Join-Path $Root "frontend")
$vercel = Get-Command vercel -ErrorAction SilentlyContinue
if ($vercel -or (Test-Path "node_modules\.bin\vercel.cmd")) {
    Log "Attempting Vercel production deploy..."
    npx vercel --prod --yes 2>&1 | ForEach-Object { Log $_ }
} else {
    Log "Vercel: Import repo at https://vercel.com/new — Root Directory: frontend"
    Log "Set VITE_API_URL to your Render backend URL"
}
Pop-Location

Log "=== Pipeline finished — see $LogFile ==="
Log "Next: Set Render env vars, then run:"
Log "  .\scripts\verify-deploy.ps1 -BackendUrl https://YOUR-API.onrender.com -FrontendUrl https://YOUR-APP.vercel.app"
Log "  .\scripts\update-readme-urls.ps1 -BackendUrl ... -FrontendUrl ..."
