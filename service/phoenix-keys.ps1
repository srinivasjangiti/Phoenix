# Phoenix Keybindings — Global hotkey listener
# Registers hotkeys and calls Phoenix server actions
# Runs alongside the Phoenix service, started by phoenix-tray or installer
#
# Default bindings (configurable via Phoenix dashboard settings):
#   Ctrl+Shift+D  → Start/stop dictation (Phoenix STT → paste)
#   Ctrl+Shift+P  → Quick Phoenix query (voice or text)

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class HotkeyManager : Form {
    [DllImport("user32.dll")] public static extern bool RegisterHotKey(IntPtr hWnd, int id, int fsModifiers, int vk);
    [DllImport("user32.dll")] public static extern bool UnregisterHotKey(IntPtr hWnd, int id);

    public event Action<int> HotkeyPressed;

    protected override void WndProc(ref Message m) {
        if (m.Msg == 0x0312) { // WM_HOTKEY
            HotkeyPressed?.Invoke(m.WParam.ToInt32());
        }
        base.WndProc(ref m);
    }
}
"@ -ReferencedAssemblies System.Windows.Forms

$PHOENIX_URL = if ($env:PHOENIX_URL) { $env:PHOENIX_URL } elseif ($env:PAN_URL) { $env:PAN_URL } else { "http://127.0.0.1:7777" }
$form = New-Object HotkeyManager
$form.ShowInTaskbar = $false
$form.WindowState = 'Minimized'
$form.Visible = $false

# MOD_CONTROL=2, MOD_SHIFT=4, MOD_ALT=1
# Ctrl+Shift+D (D=0x44) → Dictation
[HotkeyManager]::RegisterHotKey($form.Handle, 1, 6, 0x44)
# Ctrl+Shift+P (P=0x50) → Phoenix Query
[HotkeyManager]::RegisterHotKey($form.Handle, 2, 6, 0x50)

Write-Host "[Phoenix Keys] Hotkeys registered:"
Write-Host "  Ctrl+Shift+D = Dictation"
Write-Host "  Ctrl+Shift+P = Phoenix Query"
Write-Host ""

$recording = $false
$dictateJob = $null

$form.add_HotkeyPressed({
    param($id)

    switch ($id) {
        1 {
            # Dictation toggle
            if (-not $recording) {
                $recording = $true
                Write-Host "[Phoenix Keys] Recording... (press again to stop)"

                # Start recording via Phoenix server
                $dictateJob = Start-Job -ScriptBlock {
                    param($url)
                    # Record 10 seconds of audio, send to Phoenix for STT
                    try {
                        $body = @{ action = "dictate"; duration = 10 } | ConvertTo-Json
                        $result = Invoke-RestMethod -Uri "$url/api/v1/dictate" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 15
                        return $result.text
                    } catch {
                        return ""
                    }
                } -ArgumentList $PHOENIX_URL
            } else {
                $recording = $false
                Write-Host "[Phoenix Keys] Stopping recording..."

                if ($dictateJob) {
                    $text = Receive-Job -Job $dictateJob -Wait -AutoRemoveJob
                    if ($text) {
                        # Type the result into the active window
                        Add-Type -AssemblyName System.Windows.Forms
                        [System.Windows.Forms.SendKeys]::SendWait($text)
                        Write-Host "[Phoenix Keys] Typed: $text"
                    }
                    $dictateJob = $null
                }
            }
        }
        2 {
            # Quick Phoenix query — open a small input dialog
            Write-Host "[Phoenix Keys] Phoenix Query (not implemented yet)"
        }
    }
})

Write-Host "[Phoenix Keys] Listening for hotkeys... (Ctrl+C to stop)"

# Run the message loop
[System.Windows.Forms.Application]::Run($form)

# Cleanup
[HotkeyManager]::UnregisterHotKey($form.Handle, 1)
[HotkeyManager]::UnregisterHotKey($form.Handle, 2)
