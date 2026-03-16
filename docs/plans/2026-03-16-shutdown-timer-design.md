# Shutdown Timer — Design Document

## Overview

A Windows desktop app with a full application window that lets the user set a countdown timer after which the computer shuts down. Built with Tauri (Rust backend + vanilla JS frontend). Distributable as a `.exe` installer with no runtime required.

---

## Architecture

Two layers bridged by Tauri IPC:

- **Frontend** (WebView): HTML/CSS/vanilla JS — all UI, countdown display, user interactions
- **Backend** (Rust): two Tauri commands that shell out to the Windows `shutdown` CLI

**Build output:** `npm run tauri build` produces an NSIS `.exe` installer (~5MB).

---

## Rust Commands

```rust
#[tauri::command]
fn start_shutdown(seconds: u32) {
    std::process::Command::new("shutdown")
        .args(["/s", "/t", &seconds.to_string()])
        .spawn().ok();
}

#[tauri::command]
fn cancel_shutdown() {
    std::process::Command::new("shutdown")
        .arg("/a")
        .spawn().ok();
}
```

---

## UI Layout

Single window, ~400×300px.

```
┌─────────────────────────────────┐
│         Shutdown Timer          │
│                                 │
│   Hours  :  Minutes  : Seconds  │
│   [ 00 ]    [ 30 ]     [ 00 ]   │
│                                 │
│         [ Start Timer ]         │
│                                 │
│   ⏱ Shutting down in 29:45...  │
│         [ Cancel ]              │
└─────────────────────────────────┘
```

- Three number inputs (hours / minutes / seconds)
- **Start Timer**: converts inputs to total seconds, calls `start_shutdown`, starts JS countdown
- **Status line**: JS `setInterval` countdown — cosmetic only, real timer lives in Windows
- **Cancel**: calls `cancel_shutdown`, clears interval, resets UI — visible only when timer is active

---

## System Tray

Uses `tauri-plugin-tray`. Closing the window hides it rather than quitting.

**Tray icon right-click menu:**
```
┌─────────────────────┐
│ Open                │
│ Cancel Shutdown     │  ← grayed out when no timer is active
│ ─────────────────── │
│ Quit                │
└─────────────────────┘
```

- **Open**: restores the window
- **Cancel Shutdown**: calls `shutdown /a` directly from tray
- **Quit**: exits the app — warns user if a timer is active ("A shutdown is scheduled. Quitting will not cancel it.") and offers to cancel before quitting
- Double-click tray icon: restores the window

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| All inputs are zero | Start button disabled |
| Timer reaches 0 in UI | Show "Shutting down...", disable all inputs |
| Window closed with active timer | Minimizes to tray, timer continues |
| Quit with active timer | Warning dialog, offer to cancel before quitting |
| App reopened with pending Windows shutdown | No detection — new `/t` value overwrites previous |

---

## Out of Scope (v1)

- Clock-based scheduling ("shut down at 23:30")
- Restart / sleep / hibernate actions
- Detecting a pre-existing Windows shutdown timer on launch
