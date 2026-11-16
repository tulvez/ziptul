use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;
use zip::{ZipWriter, CompressionMethod};
use tauri::{AppHandle, Emitter, State};
use crate::commands::types::{CancelFlag, Progress};

pub fn collect_files(paths: &[String]) -> Vec<(PathBuf, String)> {
    let mut files = Vec::new();
    for src_path in paths {
        let base = Path::new(src_path).parent().unwrap_or(Path::new(""));
        for entry in WalkDir::new(src_path).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path().to_path_buf();
            let name = path.strip_prefix(base).unwrap_or(&path).to_string_lossy().replace('\\', "/");
            if !name.is_empty() { files.push((path, name)); }
        }
    }
    files
}

pub fn write_files_to_zip(
    zip: &mut ZipWriter<File>,
    files: &[(PathBuf, String)],
    password: &Option<String>,
    app: &AppHandle,
    flag: &Arc<AtomicBool>,
    offset: usize,
    total: usize,
) -> Result<(), String> {
    for (i, (path, name)) in files.iter().enumerate() {
        if flag.load(Ordering::Relaxed) {
            let _ = app.emit("progress", Progress { current: 0, total: 0, file: String::new(), cancelled: true });
            return Err("İptal edildi".to_string());
        }
        let _ = app.emit("progress", Progress { current: offset + i + 1, total, file: name.clone(), cancelled: false });
        if path.is_dir() {
            zip.add_directory(name, SimpleFileOptions::default()).map_err(|e| e.to_string())?;
        } else {
            let options = if let Some(ref pw) = password {
                SimpleFileOptions::default().compression_method(CompressionMethod::Deflated).with_aes_encryption(zip::AesMode::Aes256, pw)
            } else {
                SimpleFileOptions::default().compression_method(CompressionMethod::Deflated)
            };
            zip.start_file(name, options).map_err(|e| e.to_string())?;
            let mut f = File::open(path).map_err(|e| e.to_string())?;
            let mut buf = Vec::new();
            f.read_to_end(&mut buf).map_err(|e| e.to_string())?;
            zip.write_all(&buf).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn cancel_operation(flag: State<CancelFlag>) {
    flag.0.store(true, Ordering::Relaxed);
}

/// Çift tıklanan dosyaların çıkarıldığı klasör: %TEMP%/Ziptul (ortak TEMP kökü değil).
fn gecici_klasor() -> Result<PathBuf, String> {
    let dizin = std::env::temp_dir().join("Ziptul");
    std::fs::create_dir_all(&dizin).map_err(|e| e.to_string())?;
    dizin.canonicalize().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_temp_dir() -> Result<String, String> {
    Ok(gecici_klasor()?.to_string_lossy().to_string())
}

/// Yalnız Ziptul geçici klasörünün İÇİNDEKİ dosyalar açılır. Yol kanonik hâle
/// getirilip karşılaştırılır ("..", kısayol ve sembolik bağ oyunları geçmez).
#[tauri::command]
pub fn open_file(app: AppHandle, path: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    let kok = gecici_klasor()?;
    let hedef = Path::new(&path).canonicalize().map_err(|e| e.to_string())?;
    if !hedef.starts_with(&kok) || !hedef.is_file() {
        return Err("Bu dosya açılamaz.".to_string());
    }
    // Windows kanonik yolu `\\?\C:\...` önekiyle döner; kabuk "aç" bu biçimi her zaman tanımaz
    let tam = hedef.to_string_lossy().to_string();
    let yol = match tam.strip_prefix(r"\\?\") {
        Some(kalan) if !kalan.starts_with("UNC") => kalan.to_string(),
        _ => tam.clone(),
    };
    app.opener().open_path(yol, None::<&str>).map_err(|e| e.to_string())
}

/// Yalnız https ve izinli makineler: github.com/tulvez/… ve *.tulvez.com
fn adres_izinli(url: &str) -> bool {
    let Some(kalan) = url.strip_prefix("https://") else { return false };
    if url.chars().any(|c| c.is_whitespace() || c.is_control() || c == '\\') {
        return false;
    }
    let son = kalan.find(['/', '?', '#']).unwrap_or(kalan.len());
    let makine = kalan[..son].to_ascii_lowercase();
    let yol = &kalan[son..];
    (makine == "github.com" && (yol == "/tulvez" || yol.starts_with("/tulvez/")))
        || makine == "tulvez.com"
        || makine.ends_with(".tulvez.com")
}

#[tauri::command]
pub fn open_url(app: AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    if !adres_izinli(&url) {
        return Err("Bu adres açılamaz.".to_string());
    }
    app.opener().open_url(&url, None::<&str>).map_err(|e| e.to_string())
}

#[cfg(test)]
mod testler {
    use super::adres_izinli;

    #[test]
    fn adres_izin_listesi() {
        assert!(adres_izinli("https://github.com/tulvez/ziptul/releases/tag/v0.2.0"));
        assert!(adres_izinli("https://opensource.tulvez.com/"));
        assert!(adres_izinli("https://tulvez.com"));
        assert!(!adres_izinli("http://github.com/tulvez/ziptul"));
        assert!(!adres_izinli("https://github.com/baskasi/ziptul"));
        assert!(!adres_izinli("https://github.com/tulvezx/ziptul"));
        assert!(!adres_izinli("https://eviltulvez.com/"));
        assert!(!adres_izinli("https://tulvez.com.evil.com/"));
        assert!(!adres_izinli("file:///C:/Windows/System32/calc.exe"));
        assert!(!adres_izinli("https://github.com/tulvez/ziptul x"));
    }
}
