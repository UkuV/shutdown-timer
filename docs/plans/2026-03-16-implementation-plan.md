# Shutdown Timer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Tauri desktop app for Windows that lets users set a shutdown countdown timer via a clean UI, with system tray support.

**Architecture:** Rust backend exposes two Tauri commands (`start_shutdown`, `cancel_shutdown`) that shell out to `shutdown /s /t <n>` and `shutdown /a`. Vanilla JS frontend handles all UI, countdown display, and IPC calls via `@tauri-apps/api/core`.

**Tech Stack:** Tauri v2, Rust, vanilla JS (no framework), Vite, Vitest (JS unit tests), `tauri-plugin-tray`

---

## Prerequisites (do these manually before starting)

1. Install Rust: https://rustup.rs
2. Install Node.js 20+
3. Install Tauri CLI prerequisites for Windows: https://tauri.app/start/prerequisites/

---

### Task 1: Scaffold the Tauri project

**Files:**
- Creates project structure in current directory

**Step 1: Run the Tauri scaffold command**

```bash
cd /Users/ukuvesper/git/shutdown-timer
npm create tauri-app@latest . -- --template vanilla --manager npm --yes
```

When prompted:
- App name: `shutdown-timer`
- Window title: `Shutdown Timer`
- Template: `vanilla` (no framework)

**Step 2: Verify structure**

```bash
ls
```

Expected: `src/`, `src-tauri/`, `package.json`, `index.html`

**Step 3: Install dependencies**

```bash
npm install
```

**Step 4: Verify dev build starts**

```bash
npm run tauri dev
```

Expected: app window opens (may take a few minutes on first run — Rust compiles). Close it after verifying.

**Step 5: Commit**

```bash
git add .
git commit -m "feat: scaffold Tauri project"
```

---

### Task 2: Configure window size and properties

**Files:**
- Modify: `src-tauri/tauri.conf.json`

**Step 1: Read the current config**

Open `src-tauri/tauri.conf.json` and find the `windows` array under `app`.

**Step 2: Update window config**

Replace the existing window entry with:

```json
{
  "label": "main",
  "title": "Shutdown Timer",
  "width": 400,
  "height": 300,
  "resizable": false,
  "center": true
}
```

**Step 3: Verify**

```bash
npm run tauri dev
```

Expected: window opens at ~400×300, centered, not resizable. Close after verifying.

**Step 4: Commit**

```bash
git add src-tauri/tauri.conf.json
git commit -m "feat: configure window size and properties"
```

---

### Task 3: Add Rust shutdown commands

**Files:**
- Modify: `src-tauri/src/main.rs` (or `src-tauri/src/lib.rs` depending on scaffold output)
- Modify: `src-tauri/Cargo.toml` (no changes needed — std::process is built-in)

**Step 1: Read the current main.rs**

```bash
cat src-tauri/src/main.rs
```

Note whether it uses `#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` — keep that line.

**Step 2: Add the two Tauri commands**

Add these functions before the `main()` function:

```rust
#[tauri::command]
fn start_shutdown(seconds: u32) {
    std::process::Command::new("shutdown")
        .args(["/s", "/t", &seconds.to_string()])
        .spawn()
        .ok();
}

#[tauri::command]
fn cancel_shutdown() {
    std::process::Command::new("shutdown")
        .arg("/a")
        .spawn()
        .ok();
}
```

**Step 3: Register the commands in the builder**

Find `.run(tauri::generate_context!())` and update the builder to include:

```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![start_shutdown, cancel_shutdown])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

**Step 4: Verify it compiles**

```bash
cd src-tauri && cargo build && cd ..
```

Expected: compiles without errors.

**Step 5: Commit**

```bash
git add src-tauri/src/main.rs
git commit -m "feat: add start_shutdown and cancel_shutdown Rust commands"
```

---

### Task 4: Build the UI — HTML structure

**Files:**
- Modify: `index.html`
- Delete: `src/style.css` contents (replace fully in Task 5)

**Step 1: Replace index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Shutdown Timer</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <div class="container">
      <h1>Shutdown Timer</h1>

      <div class="inputs">
        <div class="input-group">
          <label for="hours">Hours</label>
          <input type="number" id="hours" min="0" max="23" value="0" />
        </div>
        <span class="separator">:</span>
        <div class="input-group">
          <label for="minutes">Minutes</label>
          <input type="number" id="minutes" min="0" max="59" value="30" />
        </div>
        <span class="separator">:</span>
        <div class="input-group">
          <label for="seconds">Seconds</label>
          <input type="number" id="seconds-input" min="0" max="59" value="0" />
        </div>
      </div>

      <button id="start-btn" class="btn btn-primary">Start Timer</button>

      <div id="status" class="status hidden"></div>

      <button id="cancel-btn" class="btn btn-danger hidden">Cancel</button>
    </div>

    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add UI HTML structure"
```

---

### Task 5: Style the UI

**Files:**
- Modify: `src/style.css`

**Step 1: Replace src/style.css entirely**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px;
  width: 100%;
}

h1 {
  font-size: 1.4rem;
  font-weight: 600;
  color: #a0c4ff;
}

.inputs {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.input-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
}

input[type="number"] {
  width: 64px;
  padding: 8px;
  font-size: 1.5rem;
  text-align: center;
  background: #16213e;
  border: 1px solid #2a2a5a;
  border-radius: 6px;
  color: #e0e0e0;
  outline: none;
}

input[type="number"]:focus {
  border-color: #a0c4ff;
}

input[type="number"]:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* hide spinner arrows */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

.separator {
  font-size: 1.5rem;
  padding-bottom: 8px;
  color: #555;
}

.btn {
  padding: 10px 28px;
  font-size: 0.95rem;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  background: #a0c4ff;
  color: #1a1a2e;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-danger {
  background: #ff6b6b;
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  opacity: 0.85;
}

.status {
  font-size: 0.9rem;
  color: #a0c4ff;
  min-height: 1.2em;
}

.hidden {
  display: none !important;
}
```

**Step 2: Verify visually**

```bash
npm run tauri dev
```

Expected: dark themed window with centered inputs and buttons. Close after verifying.

**Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat: add UI styles"
```

---

### Task 6: Set up Vitest for JS unit tests

**Files:**
- Modify: `package.json`
- Create: `src/timer.js` (pure logic, extracted for testability)
- Create: `src/timer.test.js`

**Step 1: Install Vitest**

```bash
npm install --save-dev vitest
```

**Step 2: Add test script to package.json**

Find the `"scripts"` section and add:

```json
"test": "vitest run"
```

**Step 3: Create src/timer.js — pure calculation logic**

```js
/**
 * Converts hours, minutes, seconds to total seconds.
 * Returns 0 if any value is invalid or the total is 0.
 */
export function toTotalSeconds(hours, minutes, seconds) {
  const h = parseInt(hours, 10) || 0;
  const m = parseInt(minutes, 10) || 0;
  const s = parseInt(seconds, 10) || 0;
  if (h < 0 || m < 0 || s < 0) return 0;
  return h * 3600 + m * 60 + s;
}

/**
 * Formats a number of seconds as HH:MM:SS.
 */
export function formatCountdown(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
```

**Step 4: Write the failing tests in src/timer.test.js**

```js
import { describe, it, expect } from "vitest";
import { toTotalSeconds, formatCountdown } from "./timer.js";

describe("toTotalSeconds", () => {
  it("converts hours, minutes, seconds to total seconds", () => {
    expect(toTotalSeconds(1, 30, 0)).toBe(5400);
  });

  it("returns 0 when all inputs are 0", () => {
    expect(toTotalSeconds(0, 0, 0)).toBe(0);
  });

  it("handles seconds-only input", () => {
    expect(toTotalSeconds(0, 0, 45)).toBe(45);
  });

  it("returns 0 for negative values", () => {
    expect(toTotalSeconds(-1, 0, 0)).toBe(0);
  });

  it("handles string inputs (from HTML inputs)", () => {
    expect(toTotalSeconds("2", "15", "30")).toBe(8130);
  });
});

describe("formatCountdown", () => {
  it("formats seconds as HH:MM:SS", () => {
    expect(formatCountdown(3661)).toBe("01:01:01");
  });

  it("pads single digits with zeros", () => {
    expect(formatCountdown(65)).toBe("00:01:05");
  });

  it("formats zero as 00:00:00", () => {
    expect(formatCountdown(0)).toBe("00:00:00");
  });
});
```

**Step 5: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — `toTotalSeconds` and `formatCountdown` not found yet (file doesn't exist yet).

Actually `src/timer.js` was created in Step 3, so tests should pass. Run anyway:

```bash
npm test
```

Expected: all 8 tests PASS.

**Step 6: Commit**

```bash
git add src/timer.js src/timer.test.js package.json package-lock.json
git commit -m "feat: add timer logic with unit tests"
```

---

### Task 7: Wire up the frontend JS

**Files:**
- Modify: `src/main.js`

**Step 1: Replace src/main.js entirely**

```js
import { invoke } from "@tauri-apps/api/core";
import { toTotalSeconds, formatCountdown } from "./timer.js";

const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds-input");
const startBtn = document.getElementById("start-btn");
const cancelBtn = document.getElementById("cancel-btn");
const statusEl = document.getElementById("status");

let countdownInterval = null;
let isTimerActive = false;

function getInputs() {
  return {
    hours: hoursInput.value,
    minutes: minutesInput.value,
    seconds: secondsInput.value,
  };
}

function validateInputs() {
  const { hours, minutes, seconds } = getInputs();
  const total = toTotalSeconds(hours, minutes, seconds);
  startBtn.disabled = total === 0;
}

function setTimerActive(active) {
  isTimerActive = active;
  [hoursInput, minutesInput, secondsInput].forEach((el) => {
    el.disabled = active;
  });
  startBtn.classList.toggle("hidden", active);
  cancelBtn.classList.toggle("hidden", !active);
  if (!active) {
    statusEl.classList.add("hidden");
    statusEl.textContent = "";
  }
}

function startCountdown(totalSeconds) {
  let remaining = totalSeconds;

  statusEl.classList.remove("hidden");
  statusEl.textContent = `Shutting down in ${formatCountdown(remaining)}...`;

  countdownInterval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      statusEl.textContent = "Shutting down...";
      cancelBtn.disabled = true;
    } else {
      statusEl.textContent = `Shutting down in ${formatCountdown(remaining)}...`;
    }
  }, 1000);
}

startBtn.addEventListener("click", async () => {
  const { hours, minutes, seconds } = getInputs();
  const total = toTotalSeconds(hours, minutes, seconds);
  if (total === 0) return;

  await invoke("start_shutdown", { seconds: total });
  setTimerActive(true);
  startCountdown(total);
});

cancelBtn.addEventListener("click", async () => {
  await invoke("cancel_shutdown");
  clearInterval(countdownInterval);
  countdownInterval = null;
  setTimerActive(false);
  validateInputs();
});

// Disable start when inputs are all 0
[hoursInput, minutesInput, secondsInput].forEach((el) => {
  el.addEventListener("input", validateInputs);
});

// Initial validation
validateInputs();

// Expose for tray menu cancel action
window.__isTimerActive = () => isTimerActive;
window.__cancelTimer = async () => {
  await invoke("cancel_shutdown");
  clearInterval(countdownInterval);
  countdownInterval = null;
  setTimerActive(false);
  validateInputs();
};
```

**Step 2: Verify in dev**

```bash
npm run tauri dev
```

Manual checks:
- Start button disabled when all inputs are 0
- Set 0h 0m 5s → click Start → countdown appears and ticks down
- Click Cancel → countdown stops, inputs re-enabled

**Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: wire up frontend JS with invoke calls and countdown"
```

---

### Task 8: Add system tray plugin

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/src/main.rs`
- Create: `src-tauri/icons/tray-icon.png` (use an existing icon from `src-tauri/icons/`)

**Step 1: Add the tray plugin dependency**

In `src-tauri/Cargo.toml`, under `[dependencies]`, add:

```toml
tauri-plugin-tray = "2"
```

**Step 2: Register the plugin in main.rs**

In `main.rs`, add to the builder:

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_tray::init())
    .invoke_handler(tauri::generate_handler![start_shutdown, cancel_shutdown])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

**Step 3: Add tray permissions in tauri.conf.json**

In `src-tauri/tauri.conf.json`, add to the `bundle` section or wherever capabilities are defined. Add `"tray-icon"` to the `identifier` capabilities. Check the Tauri v2 docs for the exact capability name: `"tray-icon:default"`.

In the capabilities file (usually `src-tauri/capabilities/default.json`), add:

```json
"tauri:tray-icon:default"
```

to the permissions array.

**Step 4: Verify it compiles**

```bash
cd src-tauri && cargo build && cd ..
```

**Step 5: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/main.rs src-tauri/capabilities/
git commit -m "feat: add tauri-plugin-tray dependency"
```

---

### Task 9: Implement tray behavior (hide on close, tray menu)

**Files:**
- Modify: `src-tauri/src/main.rs`
- Modify: `src/main.js`

**Step 1: Update main.rs to set up tray and intercept window close**

Replace the contents of `main.rs` with:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

#[tauri::command]
fn start_shutdown(seconds: u32) {
    std::process::Command::new("shutdown")
        .args(["/s", "/t", &seconds.to_string()])
        .spawn()
        .ok();
}

#[tauri::command]
fn cancel_shutdown() {
    std::process::Command::new("shutdown")
        .arg("/a")
        .spawn()
        .ok();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_tray::init())
        .invoke_handler(tauri::generate_handler![start_shutdown, cancel_shutdown])
        .setup(|app| {
            let open_item = MenuItem::with_id(app, "open", "Open", true, None::<&str>)?;
            let cancel_item = MenuItem::with_id(app, "cancel", "Cancel Shutdown", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&open_item, &cancel_item, &quit_item])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().ok();
                            window.set_focus().ok();
                        }
                    }
                    "cancel" => {
                        std::process::Command::new("shutdown")
                            .arg("/a")
                            .spawn()
                            .ok();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.eval("window.__cancelTimer && window.__cancelTimer()");
                        }
                    }
                    "quit" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.eval(
                                "if (window.__isTimerActive && window.__isTimerActive()) { \
                                    if (confirm('A shutdown is scheduled. Cancel it before quitting?')) { \
                                        window.__cancelTimer && window.__cancelTimer(); \
                                    } \
                                } \
                                window.__confirmQuit = true;",
                            );
                        }
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().ok();
                            window.set_focus().ok();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                window.hide().ok();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 2: Verify**

```bash
npm run tauri dev
```

Manual checks:
- Close the window → app stays in system tray
- Right-click tray icon → menu shows Open / Cancel Shutdown / Quit
- Click Open → window reappears
- Click Quit → app exits

**Step 3: Commit**

```bash
git add src-tauri/src/main.rs
git commit -m "feat: implement system tray with hide-on-close and tray menu"
```

---

### Task 10: Production build

**Files:** No code changes — just build verification.

**Step 1: Run the production build**

```bash
npm run tauri build
```

Expected: produces installer at `src-tauri/target/release/bundle/nsis/shutdown-timer_*_x64-setup.exe`

**Step 2: Test the installer**

Run the `.exe` installer, install the app, launch it. Verify all behavior works in the installed build.

**Step 3: Final commit**

No code changes needed. The build artifacts are in `.gitignore` by default.

---

## Summary

| Task | What it does |
|---|---|
| 1 | Scaffold Tauri project |
| 2 | Configure window size/properties |
| 3 | Rust shutdown commands |
| 4 | HTML structure |
| 5 | CSS styles |
| 6 | Vitest + timer logic unit tests |
| 7 | Frontend JS (invoke, countdown, state) |
| 8 | Add tray plugin |
| 9 | Tray behavior (hide on close, menu) |
| 10 | Production build |
