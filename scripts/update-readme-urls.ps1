param(
    [Parameter(Mandatory = $true)]
    [string]$BackendUrl,
    [Parameter(Mandatory = $true)]
    [string]$FrontendUrl
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Readme = Join-Path $Root "README.md"

$BackendUrl = $BackendUrl.TrimEnd("/")
$FrontendUrl = $FrontendUrl.TrimEnd("/")

$content = Get-Content $Readme -Raw
$content = $content -replace 'https://YOUR-APP\.vercel\.app', $FrontendUrl
$content = $content -replace 'https://YOUR-API\.onrender\.com', $BackendUrl

Set-Content -Path $Readme -Value $content -NoNewline
Write-Host "Updated README.md live demo URLs:" -ForegroundColor Green
Write-Host "  Frontend: $FrontendUrl"
Write-Host "  Backend:  $BackendUrl"
Write-Host "`nCommit with: git add README.md && git commit -m 'docs: add live demo URLs' && git push"
