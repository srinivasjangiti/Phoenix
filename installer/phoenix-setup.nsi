; ═══════════════════════════════════════════════════════════════════════════
; Phoenix Setup — NSIS wrapper
; Compiles install.ps1 into a self-extracting .exe that:
;   1. Extracts itself to a temp folder
;   2. Runs install.ps1 as Administrator
;   3. Cleans up
;
; Build: makensis phoenix-setup.nsi
; Output: Phoenix-Setup.exe (~2KB — the real work is in install.ps1)
; ═══════════════════════════════════════════════════════════════════════════

!include "MUI2.nsh"

Name "Phoenix — Local-First AI Memory Layer"
OutFile "Phoenix-Setup.exe"
InstallDir "$LOCALAPPDATA\Phoenix"
RequestExecutionLevel admin
SetCompressor /SOLID lzma

; ── UI ──────────────────────────────────────────────────────────────────
!define MUI_ICON "..\service\tauri\src-tauri\icons\icon.ico"
!define MUI_WELCOMEPAGE_TITLE "Phoenix — Local-First AI Memory Layer"
!define MUI_WELCOMEPAGE_TEXT "This will install Phoenix on your computer.$\r$\n$\r$\nPhoenix is your persistent AI operating system — it never forgets.$\r$\n$\r$\nClick Install to begin."
!define MUI_FINISHPAGE_RUN "$LOCALAPPDATA\Phoenix\PHOENIX.bat"
!define MUI_FINISHPAGE_RUN_TEXT "Start Phoenix now"
!define MUI_FINISHPAGE_LINK "Open Dashboard"
!define MUI_FINISHPAGE_LINK_LOCATION "http://127.0.0.1:7777/setup/"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; ── Install ─────────────────────────────────────────────────────────────
Section "Install"
    SetOutPath "$TEMP\phoenix-install"

    ; Extract the PowerShell installer
    File "install.ps1"

    ; Run the PowerShell installer
    DetailPrint "Running Phoenix installer..."
    nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -File "$TEMP\phoenix-install\install.ps1"'
    Pop $0

    ; Clean up
    RMDir /r "$TEMP\phoenix-install"
SectionEnd

; ── Uninstall ───────────────────────────────────────────────────────────
Section "Uninstall"
    ; Stop Phoenix
    nsExec::Exec 'taskkill /F /IM node.exe /FI "WINDOWTITLE eq Phoenix*"'
    nsExec::Exec 'taskkill /F /IM node.exe /FI "WINDOWTITLE eq PAN*"'
    nsExec::Exec 'sc stop Phoenix'
    nsExec::Exec 'sc delete Phoenix'
    nsExec::Exec 'sc stop PAN'
    nsExec::Exec 'sc delete PAN'

    ; Remove shortcuts
    Delete "$DESKTOP\Phoenix.lnk"
    Delete "$DESKTOP\PAN.lnk"
    Delete "$SMPROGRAMS\Phoenix\Phoenix.lnk"
    RMDir "$SMPROGRAMS\Phoenix"
    Delete "$SMPROGRAMS\PAN\PAN.lnk"
    RMDir "$SMPROGRAMS\PAN"
    Delete "$SMSTARTUP\Phoenix.lnk"
    Delete "$SMSTARTUP\PAN.lnk"

    ; Remove files (but NOT data directory)
    RMDir /r "$LOCALAPPDATA\Phoenix\node"
    RMDir /r "$LOCALAPPDATA\Phoenix\service"
    Delete "$LOCALAPPDATA\Phoenix\PHOENIX.bat"

    ; Ask about data
    MessageBox MB_YESNO "Delete all Phoenix data (conversations, memory, settings)?" IDNO skip_data
        RMDir /r "$LOCALAPPDATA\Phoenix\data"
        RMDir /r "$LOCALAPPDATA\PAN\data"
    skip_data:

    ; Remove uninstaller
    Delete "$LOCALAPPDATA\Phoenix\uninstall.exe"
    RMDir "$LOCALAPPDATA\Phoenix"
SectionEnd
