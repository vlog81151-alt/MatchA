$ErrorActionPreference = "Stop"

$rules = @(
  @{ Name = "MatchA Web 3000"; Port = 3000 },
  @{ Name = "MatchA Admin 3001"; Port = 3001 },
  @{ Name = "MatchA API 5000"; Port = 5000 }
)

foreach ($rule in $rules) {
  if (-not (Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule `
      -DisplayName $rule.Name `
      -Direction Inbound `
      -Protocol TCP `
      -LocalPort $rule.Port `
      -Action Allow `
      -Profile Any | Out-Null
  }
}

Get-NetFirewallRule -DisplayName "MatchA*" |
  Select-Object DisplayName, Enabled, Direction, Action, Profile |
  Format-Table -AutoSize
