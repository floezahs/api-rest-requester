import { useState, useRef, useEffect } from 'react';

export type FontSize = '11' | '13' | '15' | '17';

const SIZES: { id: FontSize; label: string; px: string }[] = [
  { id: '11', label: 'Small', px: '11px' },
  { id: '13', label: 'Normal', px: '13px' },
  { id: '15', label: 'Large', px: '15px' },
  { id: '17', label: 'Extra Large', px: '17px' },
];

interface SettingsMenuProps {
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
}

export default function SettingsMenu({ fontSize, onFontSizeChange }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded border border-border-primary hover:bg-surface-hover transition-colors text-xs"
        title="Settings"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-content-secondary">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-content-muted">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface-secondary border border-border-primary rounded-lg shadow-xl py-1 z-50 min-w-[200px]">
          <div className="px-3 py-2 text-[10px] text-content-muted uppercase tracking-wider font-semibold border-b border-border-secondary">
            Settings
          </div>
          <div className="px-3 py-2">
            <div className="text-[10px] text-content-muted uppercase tracking-wider font-semibold mb-2">
              Font Size
            </div>
            <div className="flex gap-1">
              {SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onFontSizeChange(s.id)}
                  className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                    fontSize === s.id
                      ? 'bg-surface-active border-accent text-content-primary'
                      : 'border-border-primary text-content-secondary hover:bg-surface-hover'
                  }`}
                  title={`${s.label} (${s.px})`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
