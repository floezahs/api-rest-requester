import { useState, useMemo } from 'react';
import { HTTPResponse } from '../types';
import JsonTreeViewer from './JsonTreeViewer';

interface ResponsePanelProps {
  response: HTTPResponse | null;
}

function isJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

function TextWithLineNumbers({ text }: { text: string }) {
  const lines = useMemo(() => text.split('\n'), [text]);
  const maxDigits = String(lines.length).length;

  return (
    <div className="json-tree-viewer">
      {lines.map((line, i) => (
        <div key={i} className="json-tree-line">
          <span className="json-line-number" style={{ minWidth: `${maxDigits * 8 + 28}px` }}>
            {i + 1}
          </span>
          <span className="json-line-content text-sm text-content-primary font-mono">
            {line}
          </span>
        </div>
      ))}
    </div>
  );
}

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return 'var(--success)';
  if (code >= 300 && code < 400) return 'var(--info)';
  if (code >= 400 && code < 500) return 'var(--warning)';
  if (code >= 500) return 'var(--danger)';
  return 'var(--text-muted)';
}

export default function ResponsePanel({ response }: ResponsePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!response) {
    return (
      <div className="flex items-center justify-center h-full text-content-muted text-sm">
        Send a request to see the response
      </div>
    );
  }

  if (response.error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-2 bg-surface-tertiary border-b border-border-secondary flex-shrink-0">
          <span className="text-danger font-bold text-xs uppercase tracking-wide">Error</span>
          <span className="text-xs text-content-muted">{response.timeMs}ms</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-danger text-sm whitespace-pre-wrap font-mono leading-relaxed">{response.error}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-4 py-2 bg-surface-tertiary border-b border-border-secondary flex-shrink-0">
        <span className="font-bold text-sm" style={{ color: statusColor(response.statusCode) }}>
          {response.statusCode}
        </span>
        <span className="text-xs text-content-secondary">{response.status}</span>
        <span className="text-[11px] text-content-muted ml-auto">{response.timeMs}ms</span>
        <span className="text-[11px] text-content-muted">{(response.sizeBytes / 1024).toFixed(1)} KB</span>
        <button
          onClick={() => handleCopy(response.body)}
          className="btn-icon ml-1"
          title="Copy response body"
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-success">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto">
            {isJson(response.body) ? (
              <JsonTreeViewer data={JSON.parse(response.body)} />
            ) : (
              <TextWithLineNumbers text={response.body} />
            )}
          </div>
          {Object.keys(response.headers).length > 0 && (
            <details className="border-t border-border-secondary">
              <summary className="px-4 py-2 text-xs text-content-muted cursor-pointer hover:text-content-secondary select-none">
                Response Headers ({Object.keys(response.headers).length})
              </summary>
              <div className="max-h-48 overflow-auto px-4 pb-3">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-3 text-xs py-0.5">
                    <span className="text-content-secondary font-medium min-w-[180px] break-all">{key}:</span>
                    <span className="text-content-muted break-all">{value}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
