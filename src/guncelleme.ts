/* ══════════════════════════════════════════════════════════════════════
   Güncelleme denetimi — gizlilik öncelikli
   ----------------------------------------------------------------------
   · Ziptul kullanıcıdan hiçbir veri toplamaz. Tek ağ isteği bu denetimdir:
     GitHub'dan son sürümün numarası okunur (api.github.com — bilgisayarın
     IP adresini GitHub görür; başka bilgi gönderilmez).
   · Açılışta otomatik denetim KAPATILABİLİR (Hakkında → Uygulama) ve en çok
     günde bir yapılır. Elle denetim her zaman çalışır.
   · Sürümler sayı olarak karşılaştırılır (metin karşılaştırması "0.10.0" <
     "0.9.0" sanardı).
   · İndirme bağlantısı yalnız github.com/tulvez/ziptul/releases altındaysa kabul edilir.
   ══════════════════════════════════════════════════════════════════════ */

export const APP_VERSION = '0.2.0';
export const DEPO = 'tulvez/ziptul';
export const DEPO_URL = `https://github.com/${DEPO}`;
const API = `https://api.github.com/repos/${DEPO}`;

const OTOMATIK = 'ziptul_guncelleme_otomatik';
const SON_DENETIM = 'ziptul_guncelleme_son';
const GUN = 24 * 60 * 60 * 1000;

const oku = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const yaz = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* yoksay */ } };

export const otomatikAcik = () => oku(OTOMATIK) !== '0';
export const otomatikAyarla = (acik: boolean) => yaz(OTOMATIK, acik ? '1' : '0');

/** a > b mi? ("v" öneki ve ön sürüm eki yok sayılır) */
export function surumBuyuk(a: string, b: string): boolean {
  const parca = (s: string) => s.replace(/^v/, '').split(/[-+]/)[0].split('.').map((x) => parseInt(x, 10) || 0);
  const x = parca(a), y = parca(b);
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  }
  return false;
}

const guvenliBaglanti = (u: unknown, tag: string) =>
  typeof u === 'string' && u.startsWith(`${DEPO_URL}/releases/`) ? u : `${DEPO_URL}/releases/tag/v${tag}`;

export interface SonSurum { tag: string; url: string; body: string }

export async function sonSurum(): Promise<SonSurum | null> {
  const r = await fetch(`${API}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
  if (r.status === 404) return null;            // henüz yayın yok
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  const j = await r.json();
  const tag = String(j.tag_name || '').replace(/^v/, '');
  if (!/^\d+\.\d+\.\d+/.test(tag)) return null;
  return { tag, url: guvenliBaglanti(j.html_url, tag), body: String(j.body || '') };
}

export async function surumGecmisi(): Promise<{ tag: string; body: string }[]> {
  const r = await fetch(`${API}/releases?per_page=20`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!r.ok) return [];
  const j = await r.json();
  return Array.isArray(j) ? j.map((x) => ({ tag: String(x.tag_name || '').replace(/^v/, ''), body: String(x.body || '') })) : [];
}

/** Açılışta: ayar açıksa ve son denetimden bu yana bir gün geçtiyse */
export async function acilistaDenetle(): Promise<SonSurum | null> {
  if (!otomatikAcik()) return null;
  const son = Number(oku(SON_DENETIM) || 0);
  if (Date.now() - son < GUN) return null;
  yaz(SON_DENETIM, String(Date.now()));
  const s = await sonSurum();
  return s && surumBuyuk(s.tag, APP_VERSION) ? s : null;
}
