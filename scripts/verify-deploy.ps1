# Post-deploy verification
param(
    [string]$BackendUrl = "http://localhost:8000",
    [string]$FrontendUrl = "http://localhost:5173"
)

$BackendUrl = $BackendUrl.TrimEnd("/")
$FrontendUrl = $FrontendUrl.TrimEnd("/")

Write-Host "`n=== Deploy Verification ===" -ForegroundColor Cyan

try {
    $health = Invoke-RestMethod -Uri "$BackendUrl/health" -TimeoutSec 30
    Write-Host "[OK] Backend health: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Backend health: $_" -ForegroundColor Red
}

try {
    $docs = Invoke-WebRequest -Uri "$BackendUrl/docs" -UseBasicParsing -TimeoutSec 30
    if ($docs.StatusCode -eq 200) {
        Write-Host "[OK] API docs reachable" -ForegroundColor Green
    }
} catch {
    Write-Host "[FAIL] API docs: $_" -ForegroundColor Red
}

try {
    $fe = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 30
    if ($fe.StatusCode -eq 200) {
        Write-Host "[OK] Frontend reachable" -ForegroundColor Green
    }
} catch {
    Write-Host "[FAIL] Frontend: $_" -ForegroundColor Red
}

Write-Host "`nManual checks:"
Write-Host "  - Sign up on frontend"
Write-Host "  - Run analyze with a test transcript"
Write-Host "  - Export PDF"
Write-Host "  - Confirm CORS_ORIGINS on backend includes: $FrontendUrl"
