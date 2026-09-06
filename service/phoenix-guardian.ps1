# Phoenix Guardian - External Watchdog
# Runs via Windows Task Scheduler. Completely outside Phoenix/Steward.
# Checks port 7777 every 60s. If dead, kills stuck processes and relaunches phoenix-loop.bat.

$PhoenixDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path $PhoenixDir)) {
    $PhoenixDir = "$env:USERPROFILE\Desktop\Phoenix\service"
}
$DataDir    = "$env:USERPROFILE\AppData\Local\Phoenix\data"
if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
}
$LogFile   = "$DataDir\guardian.log"
$LoopBat   = "$PhoenixDir\phoenix-loop.bat"
$CheckPort = if ($env:PHOENIX_PORT) { [int]$env:PHOENIX_PORT } else { 7777 }
$Interval  = 60   # seconds between health checks

function Log($msg) {
    $ts   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -ErrorAction SilentlyContinue
}

function Is-PhoenixUp {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $ar  = $tcp.BeginConnect("127.0.0.1", $CheckPort, $null, $null)
        $ok  = $ar.AsyncWaitHandle.WaitOne(2000)
        $tcp.Close()
        return $ok
    } catch { return $false }
}

function Kill-StuckPhoenix {
    foreach ($port in @($CheckPort, 17700)) {
        $lines = netstat -ano 2>$null | Select-String ":$port\s.*LISTENING"
        foreach ($line in $lines) {
            $pid = ($line -split '\s+')[-1]
            if ($pid -match '^\d+$' -and $pid -ne '0') {
                try {
                    Stop-Process -Id ([int]$pid) -Force -ErrorAction SilentlyContinue
                    Log "Killed PID $pid (was holding :$port)"
                } catch {}
            }
        }
    }
    Start-Sleep -Seconds 2
}

function Launch-Phoenix {
    Log "Launching phoenix-loop.bat..."
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c `"$LoopBat`"" `
        -WorkingDirectory $PhoenixDir `
        -WindowStyle Normal
    Start-Sleep -Seconds 10

    if (Is-PhoenixUp) {
        Log "Phoenix is UP on :$CheckPort"
    } else {
        Log "WARNING: Phoenix did not respond after launch. Will retry next cycle."
    }
}

# Main loop
Log "Phoenix Guardian started. Watching :$CheckPort every ${Interval}s. PID: $PID"

while ($true) {
    if (-not (Is-PhoenixUp)) {
        Log "Phoenix is DOWN on :$CheckPort - recovering"
        Kill-StuckPhoenix
        Launch-Phoenix
    }
    Start-Sleep -Seconds $Interval
}
