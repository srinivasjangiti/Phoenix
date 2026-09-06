# Phoenix Desktop Agent
# Runs in the user session, polls Phoenix service for desktop actions

$phoenixUrl = "http://127.0.0.1:7777"
$pollInterval = 2
$claudePath = "$env:APPDATA\npm\claude.cmd"
$weztermPath = "C:\Program Files\WezTerm\wezterm-gui.exe"
$useWezterm = Test-Path $weztermPath

Write-Host "[Phoenix Agent] Desktop agent started." -ForegroundColor Cyan

function Get-OriginalPath($path) {
    # Read .phoenix file to find original project path (handles renamed folders)
    $phoenixFile = Join-Path $path ".phoenix"
    if (-not (Test-Path $phoenixFile)) { return $path }

    try {
        $phoenixData = Get-Content $phoenixFile -Raw | ConvertFrom-Json
        $claudeDir = $phoenixData.claude_project_dir
        if (-not $claudeDir) { return $path }

        $indexFile = Join-Path $claudeDir "sessions-index.json"
        if (-not (Test-Path $indexFile)) { return $path }

        $idx = Get-Content $indexFile -Raw | ConvertFrom-Json
        if ($idx.entries.Count -gt 0) {
            $origPath = $idx.entries[0].projectPath
            if (Test-Path $origPath) {
                return $origPath
            }
        }
    } catch {}

    return $path
}

while ($true) {
    try {
        $response = Invoke-RestMethod -Uri "$phoenixUrl/api/v1/actions" -Method Get -TimeoutSec 5 -ErrorAction Stop

        foreach ($action in $response) {
            if ($action.type -eq "command") {
                Write-Host "[Phoenix Agent] Running command: $($action.command)" -ForegroundColor Magenta
                try {
                    Invoke-Expression $action.command
                    Write-Host "[Phoenix Agent] Command completed" -ForegroundColor Green
                } catch {
                    Write-Host "[Phoenix Agent] Command failed: $_" -ForegroundColor Red
                }
            }
            elseif ($action.type -eq "terminal") {
                $name = $action.name
                $path = $action.path

                Write-Host "[Phoenix Agent] Opening: $name at $path" -ForegroundColor Green

                # Find original path so --continue can find existing sessions
                $resumePath = Get-OriginalPath $path
                if ($resumePath -ne $path) {
                    Write-Host "[Phoenix Agent] Using original path: $resumePath" -ForegroundColor Yellow
                }

                $batPath = "$env:TEMP\phoenix-terminal-$($action.id).bat"

                @"
@echo off
cd /d "$resumePath"
echo === $name ===
"$claudePath" --continue
"@ | Out-File -FilePath $batPath -Encoding ascii

                if ($useWezterm) {
                    # WezTerm: run as admin so Claude Code has full system access
                    Start-Process $weztermPath -ArgumentList "start --cwd `"$resumePath`" -- cmd /k `"$claudePath`" --continue" -Verb RunAs
                } else {
                    # Fallback to Windows Terminal (also elevated)
                    Start-Process "wt.exe" -ArgumentList "$batPath" -Verb RunAs
                }
            }
        }
    }
    catch {}

    Start-Sleep -Seconds $pollInterval
}
