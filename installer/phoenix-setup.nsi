; ═══════════════════════════════════════════════════════════════════════════════
; Phoenix Setup — Professional Self-Contained Windows Installer (NSIS v3)
; ═══════════════════════════════════════════════════════════════════════════════
; Packages:
;   - Phoenix.exe (Tauri desktop supervisor & window)
;   - node\node.exe (bundled portable Node.js runtime)
;   - service\ (backend service engine, scripts, compiled dashboard, production dependencies)
;
; Creates:
;   - Desktop Shortcut: %USERPROFILE%\Desktop\Phoenix.lnk
;   - Start Menu Shortcuts: %APPDATA%\Microsoft\Windows\Start Menu\Programs\Phoenix\
;   - Windows Add/Remove Programs registration
;   - Self-contained uninstaller: uninstall.exe
;
; Safety Guarantee:
;   - Never touches or overwrites %LOCALAPPDATA%\Phoenix\data\ on install or upgrade.
;   - Uninstaller explicitly prompts the user to keep or permanently delete personal data.
; ═══════════════════════════════════════════════════════════════════════════════

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"

; ── Global Setup Parameters ───────────────────────────────────────────────────
!define PRODUCT_NAME "Phoenix"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Phoenix Project"
!define PRODUCT_DESCRIPTION "Phoenix — Personal AI Assistant"

!ifndef STAGING_DIR
  !define STAGING_DIR "..\dist\staging"
!endif

!ifndef OUTPUT_EXE
  !define OUTPUT_EXE "..\the final exe file\Phoenix-Setup.exe"
!endif

Name "${PRODUCT_NAME}"
OutFile "${OUTPUT_EXE}"
InstallDir "$LOCALAPPDATA\Programs\Phoenix"
InstallDirRegKey HKCU "Software\Phoenix" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma

; ── UI Aesthetics & Icons ─────────────────────────────────────────────────────
!define MUI_ICON "..\service\tauri\src-tauri\icons\icon.ico"
!define MUI_UNICON "..\service\tauri\src-tauri\icons\icon.ico"
!define MUI_ABORTWARNING
BrandingText "${PRODUCT_DESCRIPTION}"

; ── Wizard Pages ──────────────────────────────────────────────────────────────
; 1. Welcome Page
!define MUI_WELCOMEPAGE_TITLE "Welcome to Phoenix Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through installing Phoenix on your computer.$\r$\n$\r$\nPhoenix is your persistent, local-first personal AI assistant — keeping your conversations, memory, and automations private and on-device.$\r$\n$\r$\nClick Next to continue."
!insertmacro MUI_PAGE_WELCOME

; 2. Directory Selection Page
!define MUI_DIRECTORYPAGE_TEXT_TOP "Setup will install Phoenix in the following folder. To install in a different folder, click Browse and select another location."
!insertmacro MUI_PAGE_DIRECTORY

; 3. Component Selection Page (Shortcuts)
!define MUI_COMPONENTSPAGE_TEXT_TOP "Choose which shortcuts you want to create:"
!insertmacro MUI_PAGE_COMPONENTS

; 4. Installation Progress Page
!insertmacro MUI_PAGE_INSTFILES

; 5. Finish Page
!define MUI_FINISHPAGE_RUN "$INSTDIR\Phoenix.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Phoenix"
!insertmacro MUI_PAGE_FINISH

; ── Uninstaller Pages ─────────────────────────────────────────────────────────
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; ── Installation Sections ─────────────────────────────────────────────────────
Section "!Phoenix Application (required)" SecApp
    SectionIn RO ; Mandatory section

    DetailPrint "Checking for running instances of Phoenix..."
    nsExec::Exec 'taskkill /IM Phoenix.exe /F /T'
    nsExec::Exec 'taskkill /IM node.exe /FI "WINDOWTITLE eq Phoenix*" /F'
    Sleep 800

    ; 1. Extract Application Shell
    SetOutPath "$INSTDIR"
    File "${STAGING_DIR}\Phoenix.exe"

    ; 2. Extract Portable Node Runtime
    SetOutPath "$INSTDIR\node"
    File /r "${STAGING_DIR}\node\*.*"

    ; 3. Extract Production Service Bundle
    SetOutPath "$INSTDIR\service"
    File /r "${STAGING_DIR}\service\*.*"

    ; 4. Generate Uninstaller
    SetOutPath "$INSTDIR"
    WriteUninstaller "$INSTDIR\uninstall.exe"

    ; 5. Registry Registration (Add/Remove Programs)
    WriteRegStr HKCU "Software\Phoenix" "InstallDir" "$INSTDIR"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix" "DisplayName" "${PRODUCT_NAME}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix" "DisplayIcon" "$INSTDIR\Phoenix.exe,0"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix" "DisplayVersion" "${PRODUCT_VERSION}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix" "Publisher" "${PRODUCT_PUBLISHER}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix" "InstallLocation" "$INSTDIR"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix" "UninstallString" '"$INSTDIR\uninstall.exe"'
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix" "QuietUninstallString" '"$INSTDIR\uninstall.exe" /S'
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix" "NoModify" 1
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix" "NoRepair" 1
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix" "EstimatedSize" 668580
SectionEnd

Section "Start Menu Shortcut" SecStartMenu
    CreateDirectory "$SMPROGRAMS\Phoenix"
    CreateShortcut "$SMPROGRAMS\Phoenix\Phoenix.lnk" "$INSTDIR\Phoenix.exe" "" "$INSTDIR\Phoenix.exe" 0
    CreateShortcut "$SMPROGRAMS\Phoenix\Uninstall Phoenix.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0
SectionEnd

Section "Desktop Shortcut" SecDesktop
    CreateShortcut "$DESKTOP\Phoenix.lnk" "$INSTDIR\Phoenix.exe" "" "$INSTDIR\Phoenix.exe" 0
SectionEnd

; ── Section Descriptions ──────────────────────────────────────────────────────
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecApp} "The complete Phoenix application, local AI service, and desktop shell."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecStartMenu} "Adds Phoenix and uninstaller shortcuts to your Windows Start Menu."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} "Places a convenient shortcut to Phoenix on your Desktop."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; ── Uninstaller Section ───────────────────────────────────────────────────────
Section "Uninstall"
    DetailPrint "Stopping Phoenix services..."
    nsExec::Exec 'taskkill /IM Phoenix.exe /F /T'
    nsExec::Exec 'taskkill /IM node.exe /FI "WINDOWTITLE eq Phoenix*" /F'
    Sleep 800

    ; 1. Remove Shortcuts
    Delete "$DESKTOP\Phoenix.lnk"
    Delete "$SMPROGRAMS\Phoenix\Phoenix.lnk"
    Delete "$SMPROGRAMS\Phoenix\Uninstall Phoenix.lnk"
    RMDir "$SMPROGRAMS\Phoenix"

    ; 2. Remove Application Files
    RMDir /r "$INSTDIR\node"
    RMDir /r "$INSTDIR\service"
    Delete "$INSTDIR\Phoenix.exe"
    Delete "$INSTDIR\uninstall.exe"
    RMDir "$INSTDIR"

    ; 3. Remove Windows Add/Remove Programs Registration
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix"
    DeleteRegKey HKCU "Software\Phoenix"

    ; 4. User Personal Data Preservation / Deletion Choice
    ${IfNot} ${Silent}
        MessageBox MB_YESNO|MB_ICONQUESTION "Would you like to keep your personal memories, conversation history, and settings?$\r$\n$\r$\n• Click 'Yes' to preserve your personal data in case you reinstall later.$\r$\n• Click 'No' to permanently delete all data from this computer." IDYES keep_personal_data
        RMDir /r "$LOCALAPPDATA\Phoenix\data"
        keep_personal_data:
    ${EndIf}

    ; Clean parent folder if empty
    RMDir "$LOCALAPPDATA\Programs\Phoenix"
    RMDir "$LOCALAPPDATA\Programs"
SectionEnd
