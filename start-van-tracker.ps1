$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$logs = Join-Path $root "logs"
$pgCtl = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
New-Item -ItemType Directory -Force $logs | Out-Null

function Test-Port([int]$Port) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $attempt = $client.ConnectAsync("127.0.0.1", $Port)
    if (-not $attempt.Wait(1000)) { return $false }
    return $client.Connected
  } catch { return $false } finally { $client.Dispose() }
}

function Wait-ForUrl([string]$Url, [int]$Seconds = 45) {
  for ($i = 0; $i -lt $Seconds; $i++) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { return $true }
    } catch { Start-Sleep -Seconds 1 }
  }
  return $false
}

Write-Host "Starting SchoolRide..." -ForegroundColor Cyan

if (-not (Test-Port 5432)) { throw "PostgreSQL is not running. Start the Windows PostgreSQL service and try again." }
Write-Host "Database ready." -ForegroundColor Green

Push-Location $backend
try {
  if (-not (Test-Path (Join-Path $backend "dist\server.js"))) {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed." }
  }
} finally { Pop-Location }

if (-not (Test-Port 4000)) {
  Start-Process -FilePath "C:\Program Files\nodejs\node.exe" -ArgumentList "dist/server.js" -WorkingDirectory $backend -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logs "backend-output.log") -RedirectStandardError (Join-Path $logs "backend-error.log")
}
if (-not (Wait-ForUrl "http://localhost:4000/api/health")) {
  throw "Backend did not start. Check logs\backend-error.log."
}
Write-Host "Backend ready." -ForegroundColor Green

if (-not (Test-Port 5173)) {
  Start-Process -FilePath "C:\Program Files\nodejs\npm.cmd" -ArgumentList "run","dev","--","--host","127.0.0.1" -WorkingDirectory $frontend -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logs "frontend-output.log") -RedirectStandardError (Join-Path $logs "frontend-error.log")
}
if (-not (Wait-ForUrl "http://localhost:5173")) {
  throw "Frontend did not start. Check logs\frontend-error.log."
}
Write-Host "Frontend ready." -ForegroundColor Green
Write-Host "Opening http://localhost:5173" -ForegroundColor Cyan
Start-Process "http://localhost:5173"
exit 0
