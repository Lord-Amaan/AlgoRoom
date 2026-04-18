$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$serverDir = Join-Path $repoRoot 'server'
$clientDir = Join-Path $repoRoot 'client'
$pythonScript = Join-Path $repoRoot 'scripts\start-python-engine.ps1'

if (-not (Test-Path $pythonScript)) {
  throw "Missing script: $pythonScript"
}

Write-Host 'Launching backend, frontend, and python engine in separate terminals...' -ForegroundColor Cyan

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location '$serverDir'; npm run dev"
)

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location '$clientDir'; npm run dev"
)

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "& '$pythonScript' -ForceRestart"
)

Write-Host 'All services launched.' -ForegroundColor Green
