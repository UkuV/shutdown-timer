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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_tray::init())
        .invoke_handler(tauri::generate_handler![start_shutdown, cancel_shutdown])
        .setup(|app| {
            let open_item = MenuItem::with_id(app, "open", "Open", true, None::<&str>)?;
            let cancel_item = MenuItem::with_id(app, "cancel", "Cancel Shutdown", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&open_item, &cancel_item, &quit_item])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().ok_or("no window icon configured")?.clone())
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
                            let _ = window.eval("window.__cancelTimer && window.__cancelTimer()");
                        }
                    }
                    "quit" => {
                        // Cancel any pending shutdown before exiting so the OS timer doesn't outlive the app
                        std::process::Command::new("shutdown").arg("/a").spawn().ok();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.eval("window.__cancelTimer && window.__cancelTimer()");
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
