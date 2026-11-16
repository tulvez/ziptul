; Ziptul — NSIS kurulum kancaları (tauri.conf.json → bundle.windows.nsis.installerHooks)
;
; Gezgin sağ tık menüsü (kullanıcı başına, HKCU — yönetici izni yok):
;   .zip dosyaları       → "Ziptul ile aç", "Ziptul ile çıkar"
;   her dosya ve klasör  → "Ziptul ile zip'le"
; Komutlar uygulamada src-tauri/src/commands/islem.rs ile karşılanır (--zip, --cikar).
; Windows 11'de bu öğeler "Daha fazla seçenek göster" altındaki klasik menüdedir.
; .zip ilişkilendirmesinin kendisini (çift tıklama) Tauri fileAssociations yazar.

!define ZT_EXE "$INSTDIR\${MAINBINARYNAME}.exe"
!define ZT_ZIP "Software\Classes\SystemFileAssociations\.zip\shell"

!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr HKCU "${ZT_ZIP}\ZiptulAc" "" "Ziptul ile aç"
  WriteRegStr HKCU "${ZT_ZIP}\ZiptulAc" "Icon" "${ZT_EXE},0"
  WriteRegStr HKCU "${ZT_ZIP}\ZiptulAc\command" "" '"${ZT_EXE}" "%1"'

  WriteRegStr HKCU "${ZT_ZIP}\ZiptulCikar" "" "Ziptul ile çıkar"
  WriteRegStr HKCU "${ZT_ZIP}\ZiptulCikar" "Icon" "${ZT_EXE},0"
  WriteRegStr HKCU "${ZT_ZIP}\ZiptulCikar\command" "" '"${ZT_EXE}" --cikar "%1"'

  WriteRegStr HKCU "Software\Classes\*\shell\ZiptulZip" "" "Ziptul ile zip'le"
  WriteRegStr HKCU "Software\Classes\*\shell\ZiptulZip" "Icon" "${ZT_EXE},0"
  WriteRegStr HKCU "Software\Classes\*\shell\ZiptulZip\command" "" '"${ZT_EXE}" --zip "%1"'

  WriteRegStr HKCU "Software\Classes\Directory\shell\ZiptulZip" "" "Ziptul ile zip'le"
  WriteRegStr HKCU "Software\Classes\Directory\shell\ZiptulZip" "Icon" "${ZT_EXE},0"
  WriteRegStr HKCU "Software\Classes\Directory\shell\ZiptulZip\command" "" '"${ZT_EXE}" --zip "%1"'

  ; Gezgin'e haber ver (menü hemen görünsün)
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey HKCU "${ZT_ZIP}\ZiptulAc"
  DeleteRegKey HKCU "${ZT_ZIP}\ZiptulCikar"
  DeleteRegKey HKCU "Software\Classes\*\shell\ZiptulZip"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\ZiptulZip"
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend
