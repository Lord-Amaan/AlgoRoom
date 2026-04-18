param(
  [switch]$ForceRestart
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$engineDir = Join-Path $repoRoot 'server\python-engine'
$pythonExe = Join-Path $engineDir '.venv312\Scripts\python.exe'

if (-not (Test-Path $pythonExe)) {
  throw "Python engine interpreter not found at: $pythonExe"
}

$listener = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)" -ErrorAction SilentlyContinue
  if ($proc) {
    $sameInterpreter = $proc.ExecutablePath -and ($proc.ExecutablePath -ieq $pythonExe)
    if ($ForceRestart -or -not $sameInterpreter) {
      Write-Host "Stopping process $($proc.ProcessId) on port 8001 ($($proc.ExecutablePath))" -ForegroundColor Yellow
      Stop-Process -Id $proc.ProcessId -Force
      Start-Sleep -Milliseconds 300
    } else {
      Write-Host "Python engine already running with correct interpreter." -ForegroundColor Green
      exit 0
    }
  }
}

Write-Host "Starting Python engine with: $pythonExe" -ForegroundColor Cyan
Set-Location $engineDir
& $pythonExe main.py
