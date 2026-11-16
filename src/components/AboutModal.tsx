import { useState, useEffect, type ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  APP_VERSION, DEPO_URL, otomatikAcik, otomatikAyarla, sonSurum, surumBuyuk, surumGecmisi,
} from '../guncelleme';

export { APP_VERSION };
export const APP_BUILD = '20261116';
const TULVEZ_ACIK_KAYNAK = 'https://opensource.tulvez.com/';

export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  added?: string[];
  changed?: string[];
  fixed?: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.2.0',
    date: '16 Kasım 2026',
    type: 'minor',
    added: [
      'Yeni ad: RuZip artık Ziptul — bir Tulvez açık kaynak projesi (github.com/tulvez/ziptul)',
      'Yeni ikon ve Noir koyu kurulum sihirbazı',
      'Gezgin sağ tık menüsü: Ziptul ile zip’le, Ziptul ile çıkar, Ziptul ile aç (hiçbir dosyanın üstüne yazılmaz)',
      'Tulvez Noir teması: koyu, açık ve sistem teması (araç çubuğundan)',
      'Açılışta otomatik güncelleme denetimi kapatılabilir; en çok günde bir yapılır',
      'Arşivdeki program ya da betik dosyası çift tıklanınca önce uyarı gösterilir',
    ],
    changed: [
      'Yazı tipleri uygulamaya gömüldü; açılışta internetten hiçbir şey yüklenmez',
      'Sürüm karşılaştırması sayısal yapılır (0.10.0 artık 0.9.0’dan büyük)',
    ],
    fixed: [
      'Güvenlik: pencereye sıkı içerik güvenlik politikası eklendi',
      'Güvenlik: sürüm notları HTML olarak değil düz metin olarak gösterilir',
      'Güvenlik: yalnız Ziptul’in geçici klasöründeki dosyalar açılabilir; yalnız güvenilen adresler tarayıcıda açılır',
      'Güvenlik: kullanılmayan dosya sistemi izinleri kaldırıldı',
    ],
  },
  {
    version: '0.1.5',
    date: '23 Temmuz 2026',
    type: 'patch',
    changed: [
      'Güncelleme kontrolü artık Hakkında penceresinden de yapılabiliyor',
      'Geçmiş sürüm notları GitHub API üzerinden canlı olarak gösteriliyor',
    ],
  },
  {
    version: '0.1.4',
    date: '23 Temmuz 2026',
    type: 'patch',
    added: ['Otomatik güncelleme kontrolü: yeni sürüm varsa bildirim gösterilir'],
    fixed: [
      '"Ziptul ile Aç" ile ZIP dosyası açılamıyordu (.zip dosyasına tıklayınca boş ekran geliyordu)',
      'Kes/Yapıştır farklı klasörler arasında çalışmıyordu (isim çakışması hatası düzeltildi)',
    ],
  },
  {
    version: '0.1.3',
    date: '19 Temmuz 2026',
    type: 'patch',
    fixed: [
      'Release CI yeniden yazıldı: build işleri paralel, tek release job\'u asset\'leri topluca yükler',
      'Tekrarlanan workflow çalıştırmalarında temiz yeniden yükleme (önceki release silinir)',
      'Tag koruması nedeniyle sürüm artık workflow_dispatch ile oluşturuluyor',
    ],
  },
  { version: '0.1.2', date: '19 Temmuz 2026', type: 'patch', fixed: ['CI asset upload adımı stabilize edildi'] },
  {
    version: '0.1.1',
    date: '19 Temmuz 2026',
    type: 'patch',
    fixed: ['Inno Setup kurulumunda RegCreateKeyEx Access Denied hatası giderildi (HKCU kullanıldı)'],
  },
  {
    version: '0.1.0',
    date: '19 Temmuz 2026',
    type: 'minor',
    added: [
      'ZIP oluşturma, açma ve çıkarma',
      'ZIP içi taşıma, kopyalama, yeniden adlandırma',
      'Sürükle-bırak ile ZIP açma ve içi taşıma',
      'Çoklu seçim modu (checkbox)',
      'Kes / Kopyala / Yapıştır desteği',
      'Klasör navigasyonu ve adres çubuğu',
      'Sağ tık context menü',
      'İşlem iptali (progress modal)',
      'Arşiv test aracı',
    ],
  },
];

const ETIKET: Record<ChangelogEntry['type'], string> = { major: 'MAJOR', minor: 'MINOR', patch: 'PATCH' };

const LICENSE_TEXT = `MIT Lisansı

Telif Hakkı © 2026 Tulvez ve Ziptul katkıda bulunanlar

Bu yazılımın ve ilgili dokümantasyon dosyalarının ("Yazılım") bir kopyasını
edinen herkese, aşağıdaki koşullara tabi olmak kaydıyla, Yazılım üzerinde
ücret ödemeksizin işlem yapma izni verilmektedir. Bu izin; Yazılımı
kısıtlama olmaksızın kullanma, kopyalama, değiştirme, birleştirme, yayımlama,
dağıtma, alt lisans verme ve/veya satma haklarını kapsamaktadır.

Yazılımın tüm kopyalarına veya önemli bölümlerine yukarıdaki telif hakkı
bildirimi ve bu izin bildirimi dahil edilmelidir.

YAZILIM, HERHANGİ BİR GARANTİ OLMAKSIZIN "OLDUĞU GİBİ" SUNULMAKTADIR.
TİCARİ ELVERİŞLİLİK, BELİRLİ BİR AMACA UYGUNLUK VE İHLAL ETMEME
GARANTİLERİ DAHİL ANCAK BUNLARLA SINIRLI OLMAMAK ÜZERE HİÇBİR AÇIK VEYA
ZIMNİ GARANTİ VERİLMEMEKTEDİR. HİÇBİR DURUMDA YAZARLAR VEYA TELİF HAKKI
SAHİPLERİ; SÖZLEŞME, HAKSIZ FİİL VEYA BAŞKA BİR HUKUKI TEORI KAPSAMINDA
ORTAYA ÇIKAN ZARAR, KAYIP VEYA DİĞER YÜKÜMLÜLÜKLERDEN SORUMLU TUTULAMAZ.`;

type Tab = 'about' | 'info' | 'changelog' | 'license';

const TABS: { key: Tab; label: string }[] = [
  { key: 'info', label: 'Uygulama' },
  { key: 'about', label: 'Hakkında' },
  { key: 'changelog', label: 'Değişiklikler' },
  { key: 'license', label: 'Lisans' },
];

/* Çizgi simgeler (emoji yok) */
const Simge = ({ children }: { children: ReactNode }) => (
  <svg className="abt-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const OZELLIKLER: { simge: ReactNode; title: string; desc: string }[] = [
  { simge: <><path d="M21 8v13H3V8" /><path d="M1 3h22v5H1zM10 12h4" /></>, title: 'Arşiv oluştur', desc: 'Dosya ve klasörlerinizden ZIP arşivi oluşturun' },
  { simge: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>, title: 'Arşiv aç', desc: 'ZIP dosyalarını açın, içeriğini görüntüleyin' },
  { simge: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></>, title: 'Çıkar', desc: 'Arşiv içindeki dosyaları dışarı çıkarın' },
  { simge: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /></>, title: 'Düzenle', desc: 'Arşiv içinde taşı, kopyala, yeniden adlandır' },
  { simge: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>, title: 'AES-256 şifre', desc: 'Arşivleri parolayla AES-256 ile şifreleyin' },
  { simge: <><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></>, title: 'Hızlı ve hafif', desc: 'Rust ile yazılmış, düşük kaynak kullanımı' },
];

const GitHubSimge = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

interface Props { onClose: () => void; }

export default function AboutModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('info');
  const [upd, setUpd] = useState<{ checking: boolean; data: { tag: string; url: string } | null; yok: boolean; err: boolean }>({ checking: false, data: null, yok: false, err: false });
  const [releases, setReleases] = useState<{ tag: string; body: string }[] | null>(null);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [otomatik, setOtomatik] = useState(otomatikAcik);

  /* Bağlantılar Rust tarafında da izin listesinden geçer (yalnız github.com/tulvez ve *.tulvez.com) */
  const openLink = (url: string) => { invoke('open_url', { url }).catch(() => { /* izinli değil */ }); };

  const checkUpdate = async () => {
    setUpd({ checking: true, data: null, yok: false, err: false });
    try {
      const s = await sonSurum();
      setUpd({ checking: false, data: s ? { tag: s.tag, url: s.url } : null, yok: !s, err: false });
    } catch {
      setUpd({ checking: false, data: null, yok: false, err: true });
    }
  };

  useEffect(() => {
    if (tab !== 'changelog' || releases !== null || loadingReleases) return;
    setLoadingReleases(true);
    surumGecmisi().then(setReleases).catch(() => setReleases([])).finally(() => setLoadingReleases(false));
  }, [tab, releases, loadingReleases]);

  const updateBtnLabel = upd.checking ? 'Denetleniyor…' : upd.data || upd.yok ? 'Yeniden denetle' : 'Güncellemeleri denetle';
  const Bag = ({ url, children }: { url: string; children: ReactNode }) => (
    <a className="abt-link-btn" href={url} onClick={(e) => { e.preventDefault(); openLink(url); }}>{children}</a>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="abt-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Ziptul hakkında">

        <button className="abt-close" onClick={onClose} title="Kapat" aria-label="Kapat">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="abt-header">
          <div className="abt-icon-wrap">
            <img src="/ziptul.svg" alt="" style={{ width: 52, height: 52, borderRadius: 12 }} />
          </div>
          <div className="abt-header-text">
            <div className="abt-name">Ziptul</div>
            <div className="abt-desc">Tulvez açık kaynak ZIP arşiv programı</div>
            <div className="abt-ver-row">
              <span className="abt-ver-badge">v{APP_VERSION}</span>
              <span className="abt-build">© 2026 Tulvez · MIT</span>
            </div>
          </div>
        </div>

        <div className="abt-tabs" role="tablist">
          {TABS.map(t => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={`abt-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="abt-body">

          {tab === 'about' && (
            <div className="abt-about-wrap">
              <p className="abt-about-desc">
                Ziptul, Türkiye’de geliştirilen, açık kaynaklı ve Türkçe bir ZIP arşiv programıdır. Dosyalarınızı
                sıkıştırıp arşivleyebilir, ZIP dosyalarını açabilir ve içeriklerini yönetebilirsiniz. Ziptul bir
                Tulvez açık kaynak projesidir; kaynak kodu herkese açıktır ve MIT lisansıyla dağıtılır.
              </p>
              <div className="abt-feature-grid">
                {OZELLIKLER.map(f => (
                  <div key={f.title} className="abt-feature-card">
                    <Simge>{f.simge}</Simge>
                    <div>
                      <div className="abt-feature-title">{f.title}</div>
                      <div className="abt-feature-desc">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'info' && (
            <>
              <div className="abt-info-grid">
                <div className="abt-info-cell"><div className="abt-info-label">Sürüm</div><div className="abt-info-val accent">{APP_VERSION}</div></div>
                <div className="abt-info-cell"><div className="abt-info-label">Lisans</div><div className="abt-info-val">MIT</div></div>
                <div className="abt-info-cell"><div className="abt-info-label">Yayın tarihi</div><div className="abt-info-val">16 Kasım 2026</div></div>
                <div className="abt-info-cell">
                  <div className="abt-info-label">Geliştirici</div>
                  <div className="abt-info-val">
                    <a className="abt-link-inline" href={TULVEZ_ACIK_KAYNAK} onClick={e => { e.preventDefault(); openLink(TULVEZ_ACIK_KAYNAK); }}>Tulvez</a>
                  </div>
                </div>
              </div>

              <div className="abt-section-title">Bağlantılar</div>
              <div className="abt-links">
                <Bag url={DEPO_URL}><GitHubSimge /> Kaynak kodu</Bag>
                <Bag url={`${DEPO_URL}/issues`}>Sorun bildir</Bag>
                <Bag url={TULVEZ_ACIK_KAYNAK}>Tulvez açık kaynak</Bag>
              </div>

              <div className="abt-section-title">Güncellemeler</div>
              <div className="abt-update">
                <button className="btn btn-secondary" onClick={checkUpdate} disabled={upd.checking}>
                  {upd.checking && <span className="abt-spinner" />}
                  {updateBtnLabel}
                </button>
                {upd.data && (surumBuyuk(upd.data.tag, APP_VERSION) ? (
                  <div className="abt-upd-result outdated">
                    <strong>Yeni sürüm v{upd.data.tag} hazır</strong>
                    <a className="abt-upd-link" href={upd.data.url} onClick={e => { e.preventDefault(); openLink(upd.data!.url); }}>İndir</a>
                  </div>
                ) : (
                  <div className="abt-upd-result latest"><strong>En son sürümü kullanıyorsunuz.</strong></div>
                ))}
                {upd.yok && <div className="abt-upd-result latest"><strong>Henüz yayımlanmış yeni sürüm yok.</strong></div>}
                {upd.err && <div className="abt-upd-result error">Denetlenemedi. İnternet bağlantınızı kontrol edin.</div>}
                <label className="abt-ayar">
                  <span className="abt-ayar-metin">
                    <strong>Açılışta güncellemeleri denetle</strong>
                    <span>En çok günde bir kez, GitHub’dan son sürüm numarası okunur.</span>
                  </span>
                  <input type="checkbox" checked={otomatik} onChange={e => { otomatikAyarla(e.target.checked); setOtomatik(e.target.checked); }} />
                </label>
              </div>

              <div className="abt-section-title">Gizlilik</div>
              <p className="abt-feature-desc" style={{ fontSize: 12, lineHeight: 1.65 }}>
                Ziptul hiçbir kişisel veri, kullanım ölçümü ya da dosya bilgisi toplamaz ve göndermez. Arşivleriniz
                yalnız bu bilgisayarda işlenir. Tek ağ isteği güncelleme denetimidir: GitHub’dan son sürüm numarası
                okunur ve bu sırada bilgisayarınızın IP adresini GitHub görür. Otomatik denetimi yukarıdan kapatabilirsiniz.
              </p>
            </>
          )}

          {tab === 'changelog' && (
            <div className="abt-changelog">
              {loadingReleases && <div className="abt-cl-loading">Yükleniyor…</div>}
              {releases && releases.filter(r => !CHANGELOG.some(c => c.version === r.tag)).map(r => (
                <div key={r.tag} className="abt-cl-entry">
                  <div className="abt-cl-head">
                    <span className="abt-cl-ver">v{r.tag}</span>
                    <span className="abt-cl-type">GITHUB</span>
                  </div>
                  {/* Düz metin: sürüm notu HTML olarak BASILMAZ */}
                  <div className="abt-cl-api-body">{r.body}</div>
                </div>
              ))}
              {CHANGELOG.map(entry => (
                <div key={entry.version} className="abt-cl-entry">
                  <div className="abt-cl-head">
                    <span className="abt-cl-ver">v{entry.version}</span>
                    <span className="abt-cl-type">{ETIKET[entry.type]}</span>
                    <span className="abt-cl-date">{entry.date}</span>
                  </div>
                  {entry.added && (
                    <div className="abt-cl-group">
                      <div className="abt-cl-group-label">Eklendi</div>
                      <ul className="abt-cl-list">{entry.added.map((n, i) => <li key={i}>{n}</li>)}</ul>
                    </div>
                  )}
                  {entry.changed && (
                    <div className="abt-cl-group">
                      <div className="abt-cl-group-label">Değişti</div>
                      <ul className="abt-cl-list">{entry.changed.map((n, i) => <li key={i}>{n}</li>)}</ul>
                    </div>
                  )}
                  {entry.fixed && (
                    <div className="abt-cl-group">
                      <div className="abt-cl-group-label">Düzeltildi</div>
                      <ul className="abt-cl-list">{entry.fixed.map((n, i) => <li key={i}>{n}</li>)}</ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'license' && (
            <div className="abt-license">
              <div className="abt-license-header">
                <span className="abt-license-badge">MIT</span>
                <span className="abt-license-year">© 2026 Tulvez ve Ziptul katkıda bulunanlar</span>
              </div>
              <pre className="abt-license-text">{LICENSE_TEXT}</pre>
            </div>
          )}

        </div>

        <div className="abt-footer">
          <span>Ziptul v{APP_VERSION}</span>
          <span className="abt-footer-dot" />
          <span>Tulvez açık kaynak</span>
          <span className="abt-footer-dot" />
          <span>MIT</span>
        </div>

      </div>
    </div>
  );
}
