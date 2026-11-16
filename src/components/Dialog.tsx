import { useEffect, useRef, type ReactNode } from 'react';

export type DialogKind = 'confirm' | 'warning' | 'error' | 'info' | 'input' | 'rename' | 'password';

interface DialogProps {
  kind: DialogKind;
  title: string;
  message: string;
  inputValue?: string;
  onInputChange?: (v: string) => void;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

/* Tulvez: emoji yok, nötr çerçeve; simge çizgi SVG. Uyarı/hata onayı kırmızı
   "tehlike" düğmesiyle, diğerleri tek altın vurgu (btn-primary). */
const IKON: Record<DialogKind, ReactNode> = {
  confirm:  <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></>,
  warning:  <><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v4M12 17h.01" /></>,
  error:    <><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6M9 9l6 6" /></>,
  info:     <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  input:    <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="m13.5 6.5 4 4" /></>,
  rename:   <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="m13.5 6.5 4 4" /></>,
  password: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
};
const TEHLIKE: Partial<Record<DialogKind, true>> = { warning: true, error: true };

export default function Dialog({
  kind, title, message, inputValue, onInputChange,
  confirmLabel, cancelLabel, onConfirm, onCancel
}: DialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInput = kind === 'input' || kind === 'rename' || kind === 'password';

  useEffect(() => {
    if (hasInput && inputRef.current) {
      inputRef.current.focus();
      if (kind !== 'password') inputRef.current.select();
    }
  }, [kind, hasInput]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal dialog-modal"
        onClick={e => e.stopPropagation()}
        style={{ minWidth: 380, maxWidth: 480 }}
        onKeyDown={e => {
          if (e.key === 'Enter') onConfirm();
          if (e.key === 'Escape' && onCancel) onCancel();
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, flexShrink: 0, borderRadius: 999,
            border: '1px solid var(--border)', color: TEHLIKE[kind] ? 'var(--destructive)' : 'var(--foreground)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{IKON[kind]}</svg>
          </span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{title}</h3>
        </div>

        {/* Mesaj */}
        <p style={{ color: 'var(--muted-foreground)', fontSize: 13, lineHeight: 1.6, marginBottom: hasInput ? 14 : 20, userSelect: 'text' }}>
          {message}
        </p>

        {/* Input */}
        {hasInput && (
          <div className="modal-field" style={{ marginBottom: 20 }}>
            <input
              ref={inputRef}
              type={kind === 'password' ? 'password' : 'text'}
              placeholder={kind === 'password' ? 'Şifresiz bırakmak için boş bırak' : ''}
              value={inputValue || ''}
              onChange={e => onInputChange?.(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onConfirm();
                if (e.key === 'Escape' && onCancel) onCancel();
              }}
            />
          </div>
        )}

        {/* Butonlar */}
        <div className="modal-actions">
          {onCancel && (
            <button className="btn btn-secondary" onClick={onCancel}>
              {cancelLabel || 'İptal'}
            </button>
          )}
          <button className={`btn ${TEHLIKE[kind] ? 'btn-tehlike' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel || 'Tamam'}
          </button>
        </div>
      </div>
    </div>
  );
}
