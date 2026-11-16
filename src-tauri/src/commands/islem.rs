//! Sağ tık menüsü ve dosya ilişkilendirmesinden gelen işlemler.
//!
//! Kurulum (windows/hooks.nsh) Gezgin'e şu komutları ekler:
//!   Ziptul ile zip'le   → `Ziptul.exe --zip "<dosya ya da klasör>"`
//!   Ziptul ile çıkar    → `Ziptul.exe --cikar "<arşiv.zip>"`
//!   Ziptul ile aç / çift tıklama → `Ziptul.exe "<arşiv.zip>"`
//! İşin kendisi arayüzde, var olan komutlarla (create_zip / extract_zip) yapılır:
//! ilerleme ve iptal aynen çalışır. Hiçbir dosyanın üstüne yazılmaz — hedef adı
//! doluysa " (2)", " (3)"… eklenir.

use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct Islem {
    /// "ac" | "zip" | "cikar"
    pub tur: String,
    pub yollar: Vec<String>,
}

fn zip_mi(yol: &str) -> bool {
    yol.to_lowercase().ends_with(".zip")
}

/// Program adı ÇIKARILMIŞ argümanlardan işlemi çözer.
pub fn coz(args: &[String]) -> Option<Islem> {
    let ilk = args.first()?;
    match ilk.as_str() {
        "--zip" => {
            let yollar: Vec<String> = args[1..].iter().filter(|a| !a.starts_with("--")).cloned().collect();
            (!yollar.is_empty()).then(|| Islem { tur: "zip".into(), yollar })
        }
        "--cikar" => args
            .get(1)
            .filter(|p| zip_mi(p))
            .map(|p| Islem { tur: "cikar".into(), yollar: vec![p.clone()] }),
        _ => args
            .iter()
            .find(|a| zip_mi(a))
            .map(|p| Islem { tur: "ac".into(), yollar: vec![p.clone()] }),
    }
}

/// `dizin/ad + ek` dolu değilse onu, doluysa `ad (2)`, `ad (3)`… döndürür.
fn bos_yol(dizin: &Path, ad: &str, ek: &str) -> PathBuf {
    let ilk = dizin.join(format!("{ad}{ek}"));
    if !ilk.exists() {
        return ilk;
    }
    (2..10_000)
        .map(|n| dizin.join(format!("{ad} ({n}){ek}")))
        .find(|p| !p.exists())
        .unwrap_or(ilk)
}

/// tur = "zip": `rapor.pdf` → `rapor.zip`, `Belgeler` (klasör) → `Belgeler.zip`
/// tur = "klasor": `proje.zip` → `proje` klasörü
#[tauri::command]
pub fn benzersiz_hedef(kaynak: String, tur: String) -> Result<String, String> {
    let k = Path::new(&kaynak);
    let dizin = k.parent().filter(|d| !d.as_os_str().is_empty()).ok_or("Geçersiz yol")?;
    let ad = if k.is_dir() { k.file_name() } else { k.file_stem() }
        .and_then(|a| a.to_str())
        .filter(|a| !a.is_empty())
        .ok_or("Geçersiz ad")?;
    let hedef = match tur.as_str() {
        "zip" => bos_yol(dizin, ad, ".zip"),
        "klasor" => bos_yol(dizin, ad, ""),
        _ => return Err("Bilinmeyen tür".into()),
    };
    Ok(hedef.to_string_lossy().to_string())
}

/// Çıkarılan klasörü Gezgin'de gösterir (yalnız var olan bir KLASÖR; çalıştırmaz).
#[tauri::command]
pub fn klasoru_goster(app: tauri::AppHandle, yol: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    let p = Path::new(&yol);
    if !p.is_dir() {
        return Err("Klasör bulunamadı".into());
    }
    app.opener().reveal_item_in_dir(p).map_err(|e| e.to_string())
}

#[cfg(test)]
mod testler {
    use super::*;

    fn a(v: &[&str]) -> Vec<String> {
        v.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn argumanlar() {
        assert_eq!(coz(&a(&[])), None);
        assert_eq!(coz(&a(&["C:\\a\\b.ZIP"])), Some(Islem { tur: "ac".into(), yollar: a(&["C:\\a\\b.ZIP"]) }));
        assert_eq!(coz(&a(&["--zip", "C:\\a\\rapor.pdf"])).unwrap().tur, "zip");
        assert_eq!(coz(&a(&["--zip"])), None);
        assert_eq!(coz(&a(&["--cikar", "C:\\a\\b.zip"])).unwrap().tur, "cikar");
        assert_eq!(coz(&a(&["--cikar", "C:\\a\\b.txt"])), None);
        assert_eq!(coz(&a(&["notlar.txt"])), None);
    }

    #[test]
    fn bos_ad_bulur() {
        let d = std::env::temp_dir().join(format!("ziptul-test-{}", std::process::id()));
        std::fs::create_dir_all(&d).unwrap();
        assert_eq!(bos_yol(&d, "rapor", ".zip"), d.join("rapor.zip"));
        std::fs::write(d.join("rapor.zip"), b"x").unwrap();
        assert_eq!(bos_yol(&d, "rapor", ".zip"), d.join("rapor (2).zip"));
        std::fs::create_dir_all(d.join("proje")).unwrap();
        assert_eq!(bos_yol(&d, "proje", ""), d.join("proje (2)"));
        std::fs::remove_dir_all(&d).unwrap();
    }
}
