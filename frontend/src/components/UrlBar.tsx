interface UrlBarProps {
  method: string;
  url: string;
  loading: boolean;
  onMethodChange: (method: string) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
}

const methodReactive: Record<string, string> = {
  GET: 'text-method-get',
  POST: 'text-method-post',
  PUT: 'text-method-put',
  PATCH: 'text-method-patch',
  DELETE: 'text-method-delete',
  HEAD: 'text-method-head',
  OPTIONS: 'text-method-options',
};

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export default function UrlBar({ method, url, loading, onMethodChange, onUrlChange, onSend }: UrlBarProps) {
  return (
    <div className="flex items-stretch h-9">
      <select
        value={method}
        onChange={(e) => onMethodChange(e.target.value)}
        className={`${methodReactive[method] || ''} bg-surface-tertiary border border-border-primary rounded-l px-3 text-xs font-bold uppercase cursor-pointer outline-none min-w-[100px] appearance-none text-center`}
        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
      >
        {methods.map((m) => (
          <option key={m} value={m} className="bg-surface-tertiary text-content-primary">
            {m}
          </option>
        ))}
      </select>
      <div className="flex-1 relative">
        <input
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="https://api.example.com/endpoint"
          className="w-full h-full bg-surface-tertiary border-y border-border-primary px-3 text-sm outline-none rounded-none"
          style={{ borderLeft: 'none', borderRight: 'none' }}
        />
      </div>
      <button
        onClick={onSend}
        disabled={loading}
        className="btn-primary rounded-l-none rounded-r h-full px-6 text-xs font-bold uppercase tracking-wider"
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Sending
          </span>
        ) : 'Send'}
      </button>
    </div>
  );
}
