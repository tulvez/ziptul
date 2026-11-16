/* ══════════════════════════════════════════════════════════════════════
   Tema — Tulvez Noir (koyu / açık), varsayılan: sistem
   ----------------------------------------------------------------------
   Seçim yalnız bu bilgisayarda (localStorage) tutulur; hiçbir yere gönderilmez.
   <html data-theme> değerini yazar; renkler src/styles/global.css'te.
   ══════════════════════════════════════════════════════════════════════ */
import { useEffect, useState } from 'react';

export type TemaSecimi = 'sistem' | 'koyu' | 'acik';
const ANAHTAR = 'ziptul_tema';
const sistemKoyu = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export function temaOku(): TemaSecimi {
  try {
    const v = localStorage.getItem(ANAHTAR);
    return v === 'koyu' || v === 'acik' ? v : 'sistem';
  } catch { return 'sistem'; }
}

export function temaUygula(secim: TemaSecimi = temaOku()) {
  const koyu = secim === 'koyu' || (secim === 'sistem' && sistemKoyu());
  document.documentElement.dataset.theme = koyu ? 'dark' : 'light';
}

/** Koyu → açık → sistem döngüsü */
export function useTema() {
  const [secim, setSecim] = useState<TemaSecimi>(temaOku);
  useEffect(() => {
    temaUygula(secim);
    try { localStorage.setItem(ANAHTAR, secim); } catch { /* yoksay */ }
    if (secim !== 'sistem') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const dinle = () => temaUygula('sistem');
    mq.addEventListener('change', dinle);
    return () => mq.removeEventListener('change', dinle);
  }, [secim]);
  const sonraki = () => setSecim((s) => (s === 'koyu' ? 'acik' : s === 'acik' ? 'sistem' : 'koyu'));
  return { secim, sonraki };
}
