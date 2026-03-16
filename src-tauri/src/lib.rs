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
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![start_shutdown, cancel_shutdown])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
