$ErrorActionPreference = "Continue"
$BackendRoot = $PSScriptRoot
$LogFile = Join-Path $BackendRoot "test_results.txt"
$Transcript = @()

function Log {
    param([string]$Message)
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Write-Host $line
    $script:Transcript += $line
}

function Flush-Log {
    $script:Transcript | Set-Content -Path $LogFile -Encoding UTF8
}

Set-Location $BackendRoot
Log "Working directory: $BackendRoot"
Log "=== Step 1: Create virtual environment ==="

if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
    $venvOut = python -m venv .venv 2>&1 | Out-String
    Log $venvOut.Trim()
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        Log "ERROR: venv creation failed with exit code $LASTEXITCODE"
        Flush-Log
        exit 1
    }
    Log "Virtual environment created."
} else {
    Log "Virtual environment already exists."
}

Log "=== Step 2: Install requirements ==="
$pipOut = & ".\.venv\Scripts\pip.exe" install -r requirements.txt 2>&1 | Out-String
Log $pipOut.Trim()
if ($LASTEXITCODE -ne 0) {
    Log "ERROR: pip install failed with exit code $LASTEXITCODE"
    Flush-Log
    exit 1
}

Log "=== Step 3: Verify .env and .gitignore ==="
$envPath = Join-Path $BackendRoot ".env"
$gitignorePath = Join-Path (Split-Path $BackendRoot -Parent) ".gitignore"

if (Test-Path $envPath) {
    Log "OK: .env exists at $envPath"
} else {
    Log "ERROR: .env does NOT exist at $envPath"
}

if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath -Raw
    if ($gitignoreContent -match '(?m)^\.env$') {
        Log "OK: .gitignore contains .env entry"
    } else {
        Log "ERROR: .gitignore does NOT contain .env entry"
    }
    Log ".gitignore path: $gitignorePath"
} else {
    Log "ERROR: .gitignore not found at $gitignorePath"
}

Log "=== Step 4: Start uvicorn in background ==="
$uvicornExe = Join-Path $BackendRoot ".venv\Scripts\uvicorn.exe"
$uvicornLog = Join-Path $BackendRoot "uvicorn.log"

if (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue) {
    Log "Port 8000 already in use; assuming server is running."
} else {
    $proc = Start-Process -FilePath $uvicornExe `
        -ArgumentList "app.main:app", "--reload", "--port", "8000" `
        -WorkingDirectory $BackendRoot `
        -RedirectStandardOutput $uvicornLog `
        -RedirectStandardError $uvicornLog `
        -PassThru `
        -WindowStyle Hidden
    Log "Started uvicorn PID $($proc.Id)"
}

Log "=== Step 5: Wait for /health ==="
$healthUrl = "http://127.0.0.1:8000/health"
$healthy = $false
for ($i = 1; $i -le 60; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 3
        Log "Health check attempt $i`: HTTP $($resp.StatusCode) - $($resp.Content)"
        if ($resp.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {
        Log "Health check attempt $i`: $($_.Exception.Message)"
    }
    Start-Sleep -Seconds 2
}

if (-not $healthy) {
    Log "ERROR: Health endpoint did not return 200 within timeout."
    if (Test-Path $uvicornLog) {
        Log "--- uvicorn.log ---"
        Log (Get-Content $uvicornLog -Raw)
    }
    Flush-Log
    exit 1
}

Log "=== Step 6: Run test_analyze_run.py ==="
$testOut = & ".\.venv\Scripts\python.exe" test_analyze_run.py 2>&1 | Out-String
Log $testOut.Trim()
Log "Test script exit code: $LASTEXITCODE"

Log "=== Done ==="
Flush-Log
exit $LASTEXITCODE
