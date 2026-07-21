param(
  [string]$HostIp = "192.168.1.8",
  [switch]$StopExisting
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $Root ".codex-logs"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if ($StopExisting) {
  Get-CimInstance Win32_Process |
    Where-Object {
      $_.CommandLine -like "*$Root*" -and
      ($_.Name -eq "node.exe" -or $_.Name -eq "cmd.exe")
    } |
    ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

function Start-MatchAProcess {
  param(
    [string]$Name,
    [string]$Command
  )

  Start-Process `
    -FilePath "cmd.exe" `
    -ArgumentList "/c $Command" `
    -WorkingDirectory $Root `
    -RedirectStandardOutput (Join-Path $LogDir "$Name.log") `
    -RedirectStandardError (Join-Path $LogDir "$Name.err.log") `
    -WindowStyle Hidden
}

Start-MatchAProcess -Name "backend-host" -Command "corepack pnpm --filter @matcha/backend start"
Start-MatchAProcess -Name "web-host" -Command "corepack pnpm --filter @matcha/web exec next start --hostname 0.0.0.0 --port 3000"
Start-MatchAProcess -Name "admin-host" -Command "corepack pnpm --filter @matcha/admin exec next start --hostname 0.0.0.0 --port 3001"

Write-Host "MatchA host started."
Write-Host "Web:   http://$HostIp`:3000"
Write-Host "Admin: http://$HostIp`:3001"
Write-Host "API:   http://$HostIp`:5000/api/health"
Write-Host "Logs:  $LogDir"
