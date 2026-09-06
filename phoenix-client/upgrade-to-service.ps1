# Upgrade phoenix-client on this machine from schtask -> nssm Windows Service.
# Idempotent. Reuses existing install dir; just adds the service wrapper.

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'

$InstallDir = "$env:LOCALAPPDATA\Phoenix\client"
if (-not (Test-Path $InstallDir) -and (Test-Path "$env:LOCALAPPDATA\PAN\client")) {
    $InstallDir = "$env:LOCALAPPDATA\PAN\client"
}
$ClientJs   = Join-Path $InstallDir 'phoenix-client.js'
if (-not (Test-Path $ClientJs) -and (Test-Path (Join-Path $InstallDir 'pan-client.js'))) {
    $ClientJs = Join-Path $InstallDir 'pan-client.js'
}
$NodeExe    = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $NodeExe) { $NodeExe = 'C:\nvm4w\nodejs\node.exe' }
$NssmExe    = Join-Path $InstallDir 'nssm.exe'
$ServiceName = 'Phoenix-Client'

Write-Host "=== phoenix-client upgrade-to-service ==="
Write-Host "InstallDir : $InstallDir"
Write-Host "ClientJs   : $ClientJs (exists=$(Test-Path $ClientJs))"
Write-Host "NodeExe    : $NodeExe (exists=$(Test-Path $NodeExe))"

if (-not (Test-Path $ClientJs)) { Write-Host 'FATAL: phoenix-client.js not found'; exit 1 }
if (-not (Test-Path $NodeExe))  { Write-Host 'FATAL: node.exe not found';     exit 1 }

# 1. Stop & disable old schtask (Phoenix Client / PAN Client)
Write-Host "`n--- Stopping old schtask 'Phoenix Client' / 'PAN Client' ---"
try { schtasks /End  /TN 'Phoenix Client' 2>&1 | Out-Null } catch {}
try { schtasks /Change /TN 'Phoenix Client' /Disable 2>&1 | Out-Null } catch {}
try { schtasks /End  /TN 'PAN Client' 2>&1 | Out-Null } catch {}
try { schtasks /Change /TN 'PAN Client' /Disable 2>&1 | Out-Null } catch {}

# 2. Kill zombie node procs running from the old install dir
Write-Host "`n--- Killing existing phoenix-client node procs ---"
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | ForEach-Object {
    $cl = $_.CommandLine
    if ($cl -and ($cl -match 'phoenix-client' -or $cl -match 'pan-client')) {
        Write-Host "Killing PID $($_.ProcessId): $cl"
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 2

# 3. Download nssm if not already present
if (-not (Test-Path $NssmExe)) {
    Write-Host "`n--- Downloading nssm ---"
    $tmpZip = "$env:TEMP\nssm.zip"
    $tmpDir = "$env:TEMP\nssm-extract"
    if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
    Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile $tmpZip -UseBasicParsing
    Expand-Archive -Path $tmpZip -DestinationPath $tmpDir -Force
    $arch = if ([Environment]::Is64BitOperatingSystem) { 'win64' } else { 'win32' }
    $src = Join-Path $tmpDir "nssm-2.24\$arch\nssm.exe"
    Copy-Item $src $NssmExe -Force
    Remove-Item $tmpZip,$tmpDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "nssm downloaded to $NssmExe"
} else {
    Write-Host "nssm already present at $NssmExe"
}

# 4. Remove any existing service (idempotent)
Write-Host "`n--- Wiping any existing $ServiceName service ---"
& $NssmExe stop   $ServiceName confirm 2>&1 | Out-Null
& $NssmExe remove $ServiceName confirm 2>&1 | Out-Null
& $NssmExe stop   'PAN-Client' confirm 2>&1 | Out-Null
& $NssmExe remove 'PAN-Client' confirm 2>&1 | Out-Null
Start-Sleep -Seconds 1

# 5. Install new service
Write-Host "`n--- Installing $ServiceName ---"
& $NssmExe install $ServiceName $NodeExe $ClientJs
& $NssmExe set $ServiceName AppDirectory  $InstallDir
& $NssmExe set $ServiceName DisplayName   'Phoenix Client'
& $NssmExe set $ServiceName Description   'Phoenix client — connects this PC to its Phoenix hub.'
& $NssmExe set $ServiceName Start         SERVICE_AUTO_START
& $NssmExe set $ServiceName AppStdout     (Join-Path $InstallDir 'phoenix-client.log')
& $NssmExe set $ServiceName AppStderr     (Join-Path $InstallDir 'phoenix-client.log')
& $NssmExe set $ServiceName AppRotateFiles 1
& $NssmExe set $ServiceName AppRotateBytes 1048576
& $NssmExe set $ServiceName AppExit       Default Restart

# 6. Start it
Write-Host "`n--- Starting $ServiceName ---"
& $NssmExe start $ServiceName

Start-Sleep -Seconds 4

# 7. Check status
Write-Host "`n--- Service Status ---"
Get-Service $ServiceName
Get-Content (Join-Path $InstallDir 'phoenix-client.log') -Tail 20 -ErrorAction SilentlyContinue
