import { useState, useRef, useEffect } from 'react';
import { Theme } from '../types';

interface ThemeInfo {
  id: Theme;
  name: string;
  bg: string;
}

const THEMES: ThemeInfo[] = [
  { id: 'dark', name: 'Dark', bg: '#1e1e1e' },
  { id: 'light', name: 'Light', bg: '#f5f5f5' },
  { id: 'solarized', name: 'Solarized', bg: '#002b36' },
  { id: 'one-dark', name: 'One Dark Pro', bg: '#282c34' },
  { id: 'monokai', name: 'Monokai', bg: '#272822' },
];

interface ThemeSwitcherProps {
  current: Theme;
  onChange: (theme: Theme) => void;
}

export default function ThemeSwitcher({ current, onChange }: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEMES.find(t => t.id === current) || THEMES[0];

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
        className="flex items-center gap-2 px-2.5 py-1 rounded border border-border-primary hover:bg-surface-hover transition-colors text-xs"
        title="Change theme"
      >
        <span
          className="w-4 h-4 rounded-full border-2 border-border-secondary flex-shrink-0"
          style={{ background: currentTheme.bg }}
        />
        <span className="text-content-secondary hidden lg:inline">{currentTheme.name}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-content-muted">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface-secondary border border-border-primary rounded-lg shadow-xl py-1 z-50 min-w-[180px]">
          <div className="px-3 py-2 text-[10px] text-content-muted uppercase tracking-wider font-semibold border-b border-border-secondary">
            Themes
          </div>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { onChange(t.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-3 hover:bg-surface-hover transition-colors ${
                current === t.id ? 'bg-surface-active' : ''
              }`}
            >
              <span
                className="w-5 h-5 rounded-full flex-shrink-0 border-2 border-border-secondary"
                style={{ background: t.bg }}
              />
              <span className={`flex-1 ${current === t.id ? 'text-content-primary font-medium' : 'text-content-secondary'}`}>
                {t.name}
              </span>
              {current === t.id && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
