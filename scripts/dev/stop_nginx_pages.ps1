$line = netstat -ano | Select-String ':8082' | Select-Object -First 1

if ($line) {
  $parts = ($line.ToString() -split '\s+') | Where-Object { $_ -ne '' }
  $owningProcess = $parts[-1]
  if ($owningProcess -match '^[0-9]+$') {
    Stop-Process -Id ([int]$owningProcess) -Force -ErrorAction SilentlyContinue
    Write-Output "Nginx pages simulation stopped (PID $owningProcess)."
  } else {
    Write-Output "Nginx pages simulation PID could not be resolved."
  }
} else {
  Write-Output "Nginx pages simulation is not running."
}

$pidFile = Join-Path $env:TEMP "automation-reporter\\nginx-pages.pid"
Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
