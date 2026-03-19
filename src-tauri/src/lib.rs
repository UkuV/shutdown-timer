use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

static CANCEL_TX: Mutex<Option<std::sync::mpsc::Sender<()>>> = Mutex::new(None);

fn execute_timed_action(action: &str) {
    match action {
        "sleep" => {
            std::process::Command::new("rundll32.exe")
                .args(["powrprof.dll,SetSuspendState", "0,1,0"])
                .spawn()
                .ok();
        }
        "hibernate" => {
            std::process::Command::new("shutdown")
                .arg("/h")
                .spawn()
                .ok();
        }
        "logoff" => {
            std::process::Command::new("shutdown")
                .arg("/l")
                .spawn()
                .ok();
        }
        "lock" => {
            std::process::Command::new("rundll32.exe")
                .args(["user32.dll,LockWorkStation"])
                .spawn()
                .ok();
        }
        _ => {}
    }
}

#[tauri::command]
fn start_shutdown(seconds: u32, action: String) {
    match action.as_str() {
        "shutdown" => {
            std::process::Command::new("shutdown")
                .args(["/s", "/t", &seconds.to_string()])
                .spawn()
                .ok();
        }
        "restart" => {
            std::process::Command::new("shutdown")
                .args(["/r", "/t", &seconds.to_string()])
                .spawn()
                .ok();
        }
        _ => {
            let (tx, rx) = std::sync::mpsc::channel();
            *CANCEL_TX.lock().unwrap() = Some(tx);
            std::thread::spawn(move || {
                match rx.recv_timeout(std::time::Duration::from_secs(seconds as u64)) {
                    Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                        execute_timed_action(&action);
                    }
                    _ => {}
                }
            });
        }
    }
}

#[tauri::command]
fn cancel_shutdown() {
    std::process::Command::new("shutdown").arg("/a").spawn().ok();
    if let Ok(mut guard) = CANCEL_TX.lock() {
        if let Some(tx) = guard.take() {
            tx.send(()).ok();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                // If the frontend isn't ready yet, wait for it before showing
                let _ = window.eval(
                    "if (globalThis.__appReady) { \
                        window.__TAURI__.window.getCurrentWindow().show(); \
                        window.__TAURI__.window.getCurrentWindow().setFocus(); \
                    } else { \
                        const iv = setInterval(() => { \
                            if (globalThis.__appReady) { \
                                clearInterval(iv); \
                                window.__TAURI__.window.getCurrentWindow().show(); \
                                window.__TAURI__.window.getCurrentWindow().setFocus(); \
                            } \
                        }, 50); \
                    }"
                );
            }
        }))
        .invoke_handler(tauri::generate_handler![start_shutdown, cancel_shutdown])
        .setup(|app| {
            let open_item = MenuItem::with_id(app, "open", "Open", true, None::<&str>)?;
            let cancel_item =
                MenuItem::with_id(app, "cancel", "Cancel Shutdown", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&open_item, &cancel_item, &quit_item])?;

            TrayIconBuilder::new()
                .icon(
                    app.default_window_icon()
                        .ok_or("no window icon configured")?
                        .clone(),
                )
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().ok();
                            window.set_focus().ok();
                        }
                    }
                    "cancel" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.eval("globalThis.__cancelTimer && globalThis.__cancelTimer()");
                        }
                    }
                    "quit" => {
                        // Cancel any pending shutdown before exiting so the OS timer doesn't outlive the app
                        std::process::Command::new("shutdown")
                            .arg("/a")
                            .spawn()
                            .ok();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.eval("globalThis.__cancelTimer && globalThis.__cancelTimer()");
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
