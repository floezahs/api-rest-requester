import { KeyValue } from '../types';

interface KeyValueEditorProps {
  items: KeyValue[];
  onChange: (items: KeyValue[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export default function KeyValueEditor({ items, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value' }: KeyValueEditorProps) {
  const updateItem = (index: number, field: 'key' | 'value' | 'enabled', val: string | boolean) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: val } : item
    );
    onChange(updated);
  };

  const addItem = () => {
    onChange([...items, { key: '', value: '', enabled: true }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[11px] text-content-muted font-medium px-2 pb-1">
        <div className="w-5 flex-shrink-0"></div>
        <div className="flex-1">{keyPlaceholder}</div>
        <div className="flex-1">{valuePlaceholder}</div>
        <div className="w-8 flex-shrink-0"></div>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <div className="w-5 flex-shrink-0 flex justify-center">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(e) => updateItem(i, 'enabled', e.target.checked)}
              className="w-3.5 h-3.5 cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
            />
          </div>
          <input
            type="text"
            value={item.key}
            onChange={(e) => updateItem(i, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1 bg-surface-tertiary border border-border-primary rounded px-2 py-1.5 text-xs outline-none focus:border-accent"
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => updateItem(i, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 bg-surface-tertiary border border-border-primary rounded px-2 py-1.5 text-xs outline-none focus:border-accent"
          />
          <button
            onClick={() => removeItem(i)}
            className="w-8 flex-shrink-0 flex items-center justify-center text-content-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all text-sm"
            title="Remove"
          >
            &#x2715;
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="text-xs text-content-muted hover:text-accent self-start px-2 py-1.5 transition-colors flex items-center gap-1"
      >
        <span className="text-base leading-none">+</span> Add
      </button>
    </div>
  );
}
