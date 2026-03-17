# Shutdown Timer

A Windows desktop app for scheduling a system shutdown via a clean countdown UI. Built with [Tauri](https://tauri.app) (Rust + vanilla JS).

## Features

- Set a countdown timer by hours, minutes, and seconds
- Choose the action to perform: shutdown, restart, sleep, hibernate, log off, or lock
- Visual countdown display (the real timer lives in Windows — the app closing won't cancel it)
- Cancel a scheduled shutdown at any time
- Minimizes to the system tray on close — the timer keeps running in the background
- Tray menu: Open, Cancel Shutdown, Quit (quitting automatically cancels any pending shutdown)

## Download

Grab the latest `.exe` installer from the [Releases](../../releases) page. No runtime required — just install and run.

## Development

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Rust](https://rustup.rs)
- [Tauri prerequisites for Windows](https://tauri.app/start/prerequisites/)

> If developing on macOS, the app can be built and tested locally. The production `.exe` installer must be built on Windows (or via CI).

### Setup

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Run tests

```bash
npm test
```

### Releasing

Push a version tag to trigger the GitHub Actions release workflow. It builds on a Windows runner and publishes the `.exe` and `.msi` installers to a GitHub Release automatically.

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Build for production (Windows only)

```bash
npm run build
```

The installer will be at `src-tauri/target/release/bundle/nsis/shutdown-timer_*_x64-setup.exe`.

## Tech Stack

| Layer | Tech |
| --- | --- |
| UI | Vanilla HTML/CSS/JS |
| IPC | `@tauri-apps/api` |
| Backend | Rust (Tauri v2) |
| Shutdown | Windows `shutdown /s /t <n>` and `shutdown /a` |
| Tests | Vitest |

## Project Structure

```text
src/
  index.html      # App window
  styles.css      # Dark theme styles
  main.js         # UI logic, invoke calls, tray bridge
  timer.js        # Pure functions: toTotalSeconds, formatCountdown, clampValue, actionLabels
  timer.test.js   # Unit tests
src-tauri/
  src/
    lib.rs        # Rust commands + tray setup
    main.rs       # Entry point
  tauri.conf.json # Window config, bundle settings
  Cargo.toml      # Rust dependencies
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) with:

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
