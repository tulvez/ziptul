mod commands;

use commands::*;
use commands::islem;
use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use std::sync::Mutex;
use tauri::Emitter;

/// Açılışta komut satırından gelen işlem (sağ tık menüsü / dosya ilişkilendirmesi)
struct BekleyenIslem(Arc<Mutex<Option<islem::Islem>>>);

#[tauri::command]
fn take_pending_islem(state: tauri::State<'_, BekleyenIslem>) -> Option<islem::Islem> {
    state.0.lock().ok().and_then(|mut k| k.take())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let bekleyen = Arc::new(Mutex::new(islem::coz(&args)));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        // Ziptul açıkken gelen yeni komut: aynı pencereye "islem" olayı olarak iletilir
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(i) = islem::coz(argv.get(1..).unwrap_or_default()) {
                let _ = app.emit("islem", i);
            }
        }))
        .manage(BekleyenIslem(bekleyen))
        .manage(CancelFlag(Arc::new(AtomicBool::new(false))))
        .invoke_handler(tauri::generate_handler![
            list_zip,
            create_zip,
            add_to_zip,
            extract_zip,
            extract_selected,
            delete_from_zip,
            create_folder_in_zip,
            rename_in_zip,
            move_in_zip,
            copy_in_zip,
            zip_folder,
            get_temp_dir,
            open_file,
            open_url,
            cancel_operation,
            take_pending_islem,
            islem::benzersiz_hedef,
            islem::klasoru_goster,
        ])
        .run(tauri::generate_context!())
        .expect("Ziptul başlatılamadı");
}
