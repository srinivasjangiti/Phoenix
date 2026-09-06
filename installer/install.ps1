# ===========================================================================
# Phoenix Installer - Windows
# One script, zero dependencies. Downloads portable Node.js, extracts Phoenix,
# registers a Windows service, creates desktop shortcuts, and launches the dashboard.
#
# Usage:
#   irm https://get.phoenix.dev/install.ps1 | iex
#   - or -
#   .\install.ps1 [-NoService] [-NoShortcut] [-Dev]
#
# Requires: PowerShell 5.1+ (ships with Windows 10/11)
# ===========================================================================
param(
    [switch]$NoService,
    [switch]$NoShortcut,
    [switch]$Dev,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

if ($Help) {
    Write-Host "Phoenix Installer for Windows"
    Write-Host "  -NoService    Skip Windows service registration"
    Write-Host "  -NoShortcut   Skip desktop/start menu shortcuts"
    Write-Host "  -Dev          Install in dev mode (port 7781)"
    exit 0
}

# --Configuration --------------------------------------------------------
$NodeVersion   = "22.16.0"   # LTS - safer for native modules than v24
$InstallDir    = Join-Path $env:LOCALAPPDATA "Phoenix"
$DataDir       = Join-Path $InstallDir "data"
$NodeDir       = Join-Path $InstallDir "node"
$ServiceDir    = Join-Path $InstallDir "service"
$TempDir       = Join-Path $InstallDir "tmp"

# --Helpers --------------------------------------------------------------
function Step($msg) { Write-Host "`n> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  [!!] $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red; exit 1 }

function Download-File($url, $dest) {
    $ProgressPreference = 'SilentlyContinue'
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    } catch {
        # Fallback to .NET WebClient (works on older PS)
        (New-Object System.Net.WebClient).DownloadFile($url, $dest)
    }
}

# --Preflight ------------------------------------------------------------
Step "Preflight checks"

# Check we're on Windows
if ($env:OS -ne "Windows_NT") {
    Fail "This installer is for Windows. Use install.sh for Linux/macOS."
}

# Architecture
$arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
if ($arch -ne "x64") { Fail "Phoenix requires 64-bit Windows." }
Ok "Platform: Windows $arch"

# Admin check - needed for service registration and port binding
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin -and -not $NoService) {
    Warn "Not running as Administrator. Will skip service registration."
    Warn "Re-run as Administrator for auto-start, or use -NoService."
    $NoService = $true
}

# Check disk space (need ~500MB)
$drive = (Get-Item $env:LOCALAPPDATA).PSDrive
$freeGB = [math]::Round($drive.Free / 1GB, 1)
if ($freeGB -lt 1) {
    Warn "Low disk space: ${freeGB}GB free. Phoenix needs ~500MB."
}
Ok "Disk: ${freeGB}GB free"

# --Create directories --------------------------------------------------
Step "Creating directories"
foreach ($dir in @($InstallDir, $DataDir, $NodeDir, $ServiceDir, $TempDir)) {
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}
Ok "Install: $InstallDir"
Ok "Data:    $DataDir"

# --Install portable Node.js --------------------------------------------
Step "Installing Node.js $NodeVersion (portable)"

$nodeExe = Join-Path $NodeDir "node.exe"
$nodeZip = "node-v${NodeVersion}-win-${arch}.zip"
$nodeUrl = "https://nodejs.org/dist/v${NodeVersion}/${nodeZip}"
$nodeTmp = Join-Path $TempDir $nodeZip

if (Test-Path $nodeExe) {
    $existing = & $nodeExe --version 2>$null
    if ($existing -eq "v$NodeVersion") {
        Ok "Node.js v$NodeVersion already installed - skipping"
    } else {
        Warn "Updating Node.js from $existing to v$NodeVersion"
        Remove-Item $NodeDir -Recurse -Force
        New-Item -ItemType Directory -Path $NodeDir -Force | Out-Null
    }
}

if (-not (Test-Path $nodeExe)) {
    Write-Host "  Downloading $nodeUrl ..."
    Download-File $nodeUrl $nodeTmp

    Write-Host "  Extracting..."
    Expand-Archive -Path $nodeTmp -DestinationPath $TempDir -Force

    # Move contents from nested folder to NodeDir
    $extracted = Join-Path $TempDir "node-v${NodeVersion}-win-${arch}"
    Get-ChildItem $extracted | Move-Item -Destination $NodeDir -Force
    Remove-Item $extracted -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $nodeTmp -Force -ErrorAction SilentlyContinue

    Ok "Node.js v$NodeVersion installed to $NodeDir"
}

# Put our Node first in PATH for this session
$env:PATH = "$NodeDir;$env:PATH"
& $nodeExe --version | Out-Null
if ($LASTEXITCODE -ne 0) { Fail "Node.js binary not working" }

# Use npm-cli.js directly instead of npm.cmd — the .cmd shim can resolve
# against system Node instead of our portable one
$npmCli = Join-Path $NodeDir "node_modules\npm\bin\npm-cli.js"
if (-not (Test-Path $npmCli)) {
    # Fallback to npm.cmd if the internal path doesn't exist
    $npmCli = Join-Path $NodeDir "npm.cmd"
}
function npm-run { & $nodeExe $npmCli @args }

# --Copy Phoenix service ----------------------------------------------------
Step "Installing Phoenix service"

# Detect if running from inside Phoenix repo
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$phoenixRoot = Split-Path -Parent $scriptDir

if (Test-Path (Join-Path $phoenixRoot "service\src\server.js")) {
    Ok "Installing from local source: $phoenixRoot"

    # Use robocopy for fast sync (ships with Windows)
    $source = Join-Path $phoenixRoot "service"
    robocopy $source $ServiceDir /MIR /XD "node_modules" ".git" "data" "target" /XF "*.bak" /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Ok "Service files copied"
} else {
    # TODO: download release from GitHub
    Fail "Remote install not yet supported. Run install.ps1 from inside the Phoenix directory."
}

# --Install npm dependencies --------------------------------------------
Step "Installing dependencies (this takes 1-2 minutes)"

Push-Location $ServiceDir
$ErrorActionPreference = "Continue"
$npmOutput = npm-run install --omit=dev --no-audit --no-fund 2>&1
$ErrorActionPreference = "Stop"
$npmOutput | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
if ($LASTEXITCODE -ne 0) { Fail "npm install failed" }
Ok "Dependencies installed"
Pop-Location

# Build dashboard if source exists
$dashSrc = Join-Path $ServiceDir "dashboard\src"
if (Test-Path $dashSrc) {
    Step "Building dashboard"
    Push-Location (Join-Path $ServiceDir "dashboard")
    # Dashboard needs devDeps for build tools (svelte, vite)
    $ErrorActionPreference = "Continue"
    $null = npm-run install --no-audit --no-fund 2>&1
    $buildOut = npm-run run build 2>&1
    $ErrorActionPreference = "Stop"
    $buildOut | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
    Pop-Location
    Ok "Dashboard built"
}

# --Generate encryption keys --------------------------------------------
Step "Setting up data directory"

$phoenixKey = Join-Path $DataDir "phoenix.key"
if (-not (Test-Path $phoenixKey)) {
    $keyBytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($keyBytes)
    [IO.File]::WriteAllText($phoenixKey, [BitConverter]::ToString($keyBytes).Replace("-","").ToLower())
    Ok "Generated database encryption key"
} else {
    Ok "Encryption key already exists"
}

$auditKey = Join-Path $DataDir "audit.key"
if (-not (Test-Path $auditKey)) {
    $keyBytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($keyBytes)
    [IO.File]::WriteAllText($auditKey, [BitConverter]::ToString($keyBytes).Replace("-","").ToLower())
    Ok "Generated audit key"
} else {
    Ok "Audit key already exists"
}

# --Create PHOENIX.bat launcher ---------------------------------------------
Step "Creating launcher"

$phoenixBat = Join-Path $InstallDir "PHOENIX.bat"
$batContent = @"
@echo off
title Phoenix - Local-First AI Memory Layer
set "PATH=$NodeDir;%PATH%"
set "PHOENIX_DATA_DIR=$DataDir"

:: Check if already running
netstat -ano 2>nul | findstr ":7777.*LISTENING" >nul
if %ERRORLEVEL% equ 0 (
    echo Phoenix is already running.
    echo Opening dashboard...
    start "" "http://127.0.0.1:7777/v2/terminal"
    exit /b 0
)

echo Starting Phoenix...
cd /d "$ServiceDir"

:loop
"$nodeExe" phoenix.js start
set "EXIT_CODE=%ERRORLEVEL%"
if %EXIT_CODE% equ 0 (
    echo Phoenix stopped cleanly.
    exit /b 0
)
echo Phoenix crashed with code %EXIT_CODE%. Restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop
"@
[IO.File]::WriteAllText($phoenixBat, $batContent)
Ok "Launcher: $phoenixBat"

# --Shortcuts ------------------------------------------------------------
if (-not $NoShortcut) {
    Step "Creating shortcuts"

    $shell = New-Object -ComObject WScript.Shell

    # Desktop shortcut
    $desktop = [Environment]::GetFolderPath("Desktop")
    $shortcut = $shell.CreateShortcut((Join-Path $desktop "Phoenix.lnk"))
    $shortcut.TargetPath = $phoenixBat
    $shortcut.WorkingDirectory = $InstallDir
    $shortcut.Description = "Phoenix - Local-First AI Memory Layer"
    $shortcut.WindowStyle = 7  # Minimized
    # Icon from Tauri build if available
    $iconPath = Join-Path $ServiceDir "tauri\src-tauri\icons\icon.ico"
    if (Test-Path $iconPath) { $shortcut.IconLocation = $iconPath }
    $shortcut.Save()
    Ok "Desktop shortcut created"

    # Start Menu shortcut
    $startMenu = Join-Path ([Environment]::GetFolderPath("Programs")) "Phoenix"
    if (-not (Test-Path $startMenu)) { New-Item -ItemType Directory -Path $startMenu | Out-Null }
    $shortcut = $shell.CreateShortcut((Join-Path $startMenu "Phoenix.lnk"))
    $shortcut.TargetPath = $phoenixBat
    $shortcut.WorkingDirectory = $InstallDir
    $shortcut.Description = "Phoenix - Local-First AI Memory Layer"
    $shortcut.WindowStyle = 7
    if (Test-Path $iconPath) { $shortcut.IconLocation = $iconPath }
    $shortcut.Save()
    Ok "Start Menu shortcut created"
}

# --Windows Service (optional) ------------------------------------------
if (-not $NoService -and $isAdmin) {
    Step "Registering Windows service"

    $svcName = "Phoenix"
    $existing = Get-Service -Name $svcName -ErrorAction SilentlyContinue
    if ($existing) {
        Warn "Service '$svcName' already exists (status: $($existing.Status)). Skipping."
    } else {
        # Register using sc.exe (built into Windows)
        $svcBin = "`"$nodeExe`" `"$(Join-Path $ServiceDir 'phoenix.js')`" start"
        & sc.exe create $svcName binPath= $svcBin start= auto DisplayName= "Phoenix - Local-First AI Memory Layer" 2>&1 | Out-Null

        if ($LASTEXITCODE -eq 0) {
            & sc.exe description $svcName "Phoenix - persistent intelligence layer" 2>&1 | Out-Null
            # Set environment variables for the service
            $regPath = "HKLM:\SYSTEM\CurrentControlSet\Services\$svcName"
            $envBlock = @(
                "PHOENIX_DATA_DIR=$DataDir",
                "PATH=$NodeDir;$env:PATH",
                "USERPROFILE=$env:USERPROFILE",
                "APPDATA=$env:APPDATA",
                "LOCALAPPDATA=$env:LOCALAPPDATA"
            )
            Set-ItemProperty -Path $regPath -Name Environment -Value $envBlock -Type MultiString
            Ok "Windows service registered (auto-start on boot)"
        } else {
            Warn "Failed to register service. Phoenix will still work - just start it manually."
        }
    }
}

# --Auto-start on login (fallback if no service) ------------------------
if ($NoService -or -not $isAdmin) {
    Step "Setting up auto-start on login"

    $startupDir = [Environment]::GetFolderPath("Startup")
    $startupLink = Join-Path $startupDir "Phoenix.lnk"

    if (-not (Test-Path $startupLink)) {
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($startupLink)
        $shortcut.TargetPath = $phoenixBat
        $shortcut.WorkingDirectory = $InstallDir
        $shortcut.WindowStyle = 7  # Minimized
        $shortcut.Save()
        Ok "Added to Startup folder (starts on login)"
    } else {
        Ok "Startup shortcut already exists"
    }
}

# --Firewall rule --------------------------------------------------------
if ($isAdmin) {
    $fwRule = Get-NetFirewallRule -DisplayName "Phoenix Server" -ErrorAction SilentlyContinue
    if (-not $fwRule) {
        New-NetFirewallRule -DisplayName "Phoenix Server" -Direction Inbound -LocalPort 7777 -Protocol TCP -Action Allow | Out-Null
        Ok "Firewall rule added (port 7777)"
    }
}

# --Cleanup --------------------------------------------------------------
Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue

# --Done -----------------------------------------------------------------
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Green
Write-Host "  Phoenix installed successfully!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Start Phoenix: Double-click Phoenix on your Desktop" -ForegroundColor White
Write-Host "  Dashboard:    http://127.0.0.1:7777/v2/terminal" -ForegroundColor White
Write-Host "  Data:         $DataDir" -ForegroundColor Gray
Write-Host ""
Write-Host "  First run: Open the dashboard to set your name and API keys." -ForegroundColor Yellow
Write-Host ""

# Auto-start prompt (unless in Docker test)
if (-not $env:PHOENIX_TEST) {
    $start = Read-Host "Start Phoenix now? [Y/n]"
    if ($start -ne "n" -and $start -ne "N") {
        Start-Process -FilePath $phoenixBat -WindowStyle Minimized
        Start-Sleep -Seconds 8
        Start-Process "http://127.0.0.1:7777/v2/terminal"
    }
}
