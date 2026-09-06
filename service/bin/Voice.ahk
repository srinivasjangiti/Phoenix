#Requires AutoHotkey v2.0

; === Paths ===
phoenixDir := "%USERPROFILE%\Desktop\Phoenix\service\src"
if (!DirExist(phoenixDir))
    phoenixDir := "%USERPROFILE%\Desktop\Phoenix\service\src"
sndDir := "%USERPROFILE%\Desktop\Phoenix\service\bin\sounds"
if (!DirExist(sndDir))
    sndDir := "%USERPROFILE%\Desktop\Phoenix\service\bin\sounds"
phoenixTriggerFile := A_Temp "\phoenix_voice_trigger"
legacyTriggerFile  := A_Temp "\pan_voice_trigger"
phoenixStopFile    := A_Temp "\phoenix_dictate.wav.stop"
legacyStopFile     := A_Temp "\pan_dictate.wav.stop"
phoenixBusy := false

; === Blank-screen watchdog ===
; Checks every 2s if ANY Phoenix Tauri window went blank (Craft swap reload stuck).
; Watches: "Phoenix Dashboard", "Phoenix Terminal", "Phoenix Comms", or any "Phoenix " Tauri window.
; Logic: search center area for near-white pixels (text/UI elements).
;   - Loaded page always has bright elements (tabs, text, icons).
;   - Blank/loading page shows only the #0A0A0F Tauri background (R=10, G=10, B=15).
; After 6 consecutive seconds of blank following a loaded state → auto F5.
dashBlankTicks := 0
dashWasLoaded  := false
SetTimer(WatchDashboard, 2000)

; Find any open Phoenix Tauri window — checks known titles + falls back to legacy Phoenix window
FindPhoenixWindow() {
    for title in ["Phoenix Dashboard", "Phoenix Terminal", "Phoenix Comms", "Phoenix Settings", "Phoenix ", "Phoenix Dashboard", "Phoenix Terminal", "Phoenix Comms", "Phoenix Settings", "Phoenix "] {
        hwnd := WinExist(title)
        if hwnd
            return hwnd
    }
    return 0
}

WatchDashboard() {
    global dashBlankTicks, dashWasLoaded
    hwnd := FindPhoenixWindow()
    if (!hwnd) {
        dashBlankTicks := 0
        return
    }
    if (DashHasContent(hwnd)) {
        dashBlankTicks := 0
        dashWasLoaded  := true
    } else if (dashWasLoaded) {
        ; Was loaded, now blank — possible stuck reload
        dashBlankTicks++
        if (dashBlankTicks >= 3) {  ; 3 × 2s = 6 seconds blank
            WinActivate("ahk_id " hwnd)
            Sleep(120)
            Send "{F5}"
            dashBlankTicks := 0
        }
    }
    ; If never loaded yet, don't auto-press (could be intentional startup)
}

; Returns true if the window has bright content (text, UI elements).
; Near-white threshold (variation 75): catches #cdd6f4 text (R205,G214,B244)
; but NOT the #0A0A0F blank background (R=10, too far from 255).
DashHasContent(hwnd) {
    WinGetPos(&wx, &wy, &ww, &wh, "ahk_id " hwnd)
    if (!ww || ww < 100) return true  ; can't measure — assume OK
    x1 := wx + 60
    y1 := wy + 40   ; skip OS title bar
    x2 := wx + ww - 60
    y2 := wy + wh - 40
    return PixelSearch(&px, &py, x1, y1, x2, y2, 0xFFFFFF, 75, "Fast")
}

; === Signal file for dashboard mic button ===
SetTimer(CheckDashboardMicTrigger, 250)

CheckDashboardMicTrigger() {
    global phoenixTriggerFile, legacyTriggerFile
    trigFile := FileExist(phoenixTriggerFile) ? phoenixTriggerFile : (FileExist(legacyTriggerFile) ? legacyTriggerFile : "")
    if (trigFile != "") {
        try {
            content := FileRead(trigFile)
            FileDelete(trigFile)
        }
        if (content = "winh") {
            SendInput "{LWin down}h{LWin up}"
        } else if (content = "dictate") {
            DoPhoenixDictation()
        }
    }
}

; Back side button = Windows voice-to-text
XButton1:: {
    KeyWait "XButton1"
    Send "#h"
}

; Forward side button = Phoenix Dictation
XButton2:: {
    DoPhoenixDictation()
}

DoPhoenixDictation() {
    global phoenixBusy, phoenixDir, sndDir, phoenixStopFile, legacyStopFile
    if (phoenixBusy) {
        try FileAppend("stop", phoenixStopFile)
        try FileAppend("stop", legacyStopFile)
        return
    }
    phoenixBusy := true

    try SoundPlay(sndDir "\voice-start.wav")
    ToolTip("Phoenix Listening...")

    try {
        RunWait('python.exe "' phoenixDir '\dictate-vad.py" --no-sounds',, "Hide")
    } catch as e {
        ToolTip("Phoenix: Dictation failed - " e.Message)
        Sleep(2000)
    }

    try SoundPlay(sndDir "\voice-stop.wav", true)
    ToolTip()
    phoenixBusy := false
}

; ── Phoenix Activity Shell Hook ───────────────────────────────────────────────
; Track window focus changes and report to Phoenix for activity history
PHOENIX_ACTIVITY_URL := "http://127.0.0.1:7777/api/v1/activity"

MsgNum := DllCall("RegisterWindowMessage", "Str", "SHELLHOOK", "UInt")
DllCall("RegisterShellHookWindow", "Ptr", A_ScriptHwnd)
OnMessage(MsgNum, Phoenix_ShellMsg)

Phoenix_ShellMsg(wParam, lParam, *) {
    if (wParam = 4 or wParam = 32772) {
        try {
            title := WinGetTitle("ahk_id " lParam)
            procName := WinGetProcessName("ahk_id " lParam)
            if (procName != "" && procName != "explorer.exe" && procName != "ShellExperienceHost.exe") {
                body := '{"event_type":"app_focus","app_name":"' . procName . '","window_title":"' . StrReplace(title, '"', '\"') . '","source":"desktop_ahk"}'
                Run('powershell -NoProfile -WindowStyle Hidden -Command "Invoke-RestMethod -Uri ''' PHOENIX_ACTIVITY_URL ''' -Method POST -ContentType ''application/json'' -Body ''' body ''' | Out-Null"',, "Hide")
            }
        }
    }
}
