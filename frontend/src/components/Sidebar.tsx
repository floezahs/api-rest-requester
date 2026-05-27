import { useState, useEffect, useRef } from 'react';
import { Collection, HistoryEntry, RequestConfig, METHOD_COLORS } from '../types';

interface ContextMenu {
  x: number;
  y: number;
  collectionId: string;
}

interface SidebarProps {
  collections: Collection[];
  history: HistoryEntry[];
  activeRequestId: string | null;
  activeCollectionId: string | null;
  onCollectionCreate: (name: string) => void;
  onCollectionDelete: (id: string) => void;
  onRequestSelect: (collectionId: string, request: RequestConfig) => void;
  onRequestDelete: (collectionId: string, requestId: string) => void;
  onNewRequest: (collectionId: string) => void;
  onHistorySelect: (entry: HistoryEntry) => void;
  onHistoryClear: () => void;
  onHistoryDelete: (id: string) => void;
  onImportFile: (content: string) => void;
  onImportPaste: () => void;
}

export default function Sidebar({
  collections, history, activeRequestId, activeCollectionId,
  onCollectionCreate, onCollectionDelete,
  onRequestSelect, onRequestDelete, onNewRequest,
  onHistorySelect, onHistoryClear, onHistoryDelete,
  onImportFile, onImportPaste,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'collections' | 'history'>('collections');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedCollections);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedCollections(next);
  };

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      onCollectionCreate(newCollectionName.trim());
      setNewCollectionName('');
      setShowNewInput(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, collectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, collectionId });
  };

  const handleFileImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      onImportFile(text);
    } catch {
      onImportFile('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-secondary border-r border-border-secondary">
      <div className="flex border-b border-border-secondary">
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'collections'
              ? 'bg-surface-primary text-content-primary border-b-2 border-accent'
              : 'text-content-muted hover:text-content-secondary'
          }`}
        >
          Collections
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'history'
              ? 'bg-surface-primary text-content-primary border-b-2 border-accent'
              : 'text-content-muted hover:text-content-secondary'
          }`}
        >
          History
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelected}
        className="hidden"
      />

      {activeTab === 'collections' && (
        <div className="flex-1 overflow-auto flex flex-col">
          <div className="px-2 py-2 flex items-center justify-between border-b border-border-secondary">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewInput(!showNewInput)}
                className="btn-icon text-xs"
                title="New collection"
              >
                <span className="text-lg leading-none">+</span>
              </button>
              <button
                onClick={handleFileImport}
                className="btn-icon text-xs"
                title="Import Postman file"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </button>
              <button
                onClick={onImportPaste}
                className="btn-icon text-xs"
                title="Import from clipboard"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            </div>
            <span className="text-[10px] text-content-muted">{collections.length} collections</span>
          </div>
          {showNewInput && (
            <div className="px-2 py-2 flex gap-1.5">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                placeholder="Collection name"
                className="flex-1 bg-surface-tertiary border border-border-primary rounded px-2 py-1 text-xs outline-none focus:border-accent"
                autoFocus
              />
              <button onClick={handleCreateCollection} className="btn-primary text-xs px-3">OK</button>
            </div>
          )}
          <div className="flex-1 overflow-auto py-1">
            {collections.map((col) => (
              <div key={col.id}>
                <div
                  className="flex items-center gap-1 px-2 py-1 hover:bg-surface-hover cursor-pointer group"
                  onContextMenu={(e) => handleContextMenu(e, col.id)}
                >
                  <button
                    onClick={() => toggleExpand(col.id)}
                    className="text-content-muted text-[10px] w-4 flex-shrink-0 hover:text-content-primary"
                  >
                    {expandedCollections.has(col.id) ? '\u25BC' : '\u25B6'}
                  </button>
                  <span className="flex-1 text-xs text-content-secondary font-medium truncate">{col.name}</span>
                  <span className="text-[10px] text-content-muted bg-surface-tertiary px-1.5 py-0.5 rounded">{col.requests.length}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onNewRequest(col.id); }}
                    className="text-content-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all text-xs p-0.5"
                    title="New request"
                  >
                    <span className="text-base leading-none">+</span>
                  </button>
                  <button
                    onClick={() => onCollectionDelete(col.id)}
                    className="btn-danger opacity-0 group-hover:opacity-100 text-[10px] ml-0.5"
                    title="Delete collection"
                  >
                    &#x2715;
                  </button>
                </div>
                {expandedCollections.has(col.id) && (
                  <div className="ml-5 border-l border-border-secondary">
                    <button
                      onClick={() => onNewRequest(col.id)}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-content-muted hover:text-accent hover:bg-surface-hover transition-colors"
                    >
                      <span className="text-sm leading-none">+</span> Add request
                    </button>
                    {col.requests.length === 0 && (
                      <div className="px-3 py-2 text-[11px] text-content-muted italic">
                        Empty collection
                      </div>
                    )}
                    {col.requests.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => onRequestSelect(col.id, req)}
                        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer group text-xs border-l-2 transition-colors ${
                          activeRequestId === req.id
                            ? 'bg-surface-active border-accent'
                            : 'border-transparent hover:bg-surface-hover'
                        }`}
                      >
                        <span className={`font-bold uppercase text-[10px] w-10 ${METHOD_COLORS[req.method] || 'text-content-muted'}`}>
                          {req.method}
                        </span>
                        <span className="flex-1 truncate text-content-muted">{req.name || req.url || 'Untitled'}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onRequestDelete(col.id, req.id); }}
                          className="btn-danger opacity-0 group-hover:opacity-100 text-[10px]"
                          title="Delete request"
                        >
                          &#x2715;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {collections.length === 0 && !showNewInput && (
              <div className="px-3 py-6 text-xs text-content-muted text-center leading-relaxed">
                No collections yet.<br/>
                <span className="text-content-muted/70">Create one or import a Postman collection</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex-1 overflow-auto flex flex-col">
          <div className="px-2 py-2 flex items-center justify-between border-b border-border-secondary">
            <span className="text-[10px] text-content-muted">{history.length} requests</span>
            {history.length > 0 && (
              <button
                onClick={onHistoryClear}
                className="text-[10px] text-content-muted hover:text-danger transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {history.map((entry) => (
              <div
                key={entry.id}
                onClick={() => onHistorySelect(entry)}
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-surface-hover group text-xs"
              >
                <span className={`font-bold uppercase w-10 text-[10px] ${METHOD_COLORS[entry.request.method] || 'text-content-muted'}`}>
                  {entry.request.method}
                </span>
                <span className="flex-1 truncate text-content-muted">{entry.request.url}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onHistoryDelete(entry.id); }}
                  className="btn-danger opacity-0 group-hover:opacity-100 text-[10px]"
                  title="Remove"
                >
                  &#x2715;
                </button>
              </div>
            ))}
            {history.length === 0 && (
              <div className="px-3 py-6 text-xs text-content-muted text-center">
                No history yet
              </div>
            )}
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-50 bg-surface-secondary border border-border-primary rounded shadow-xl py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => { onNewRequest(contextMenu.collectionId); setContextMenu(null); }}
            className="w-full text-left px-3 py-1.5 text-xs text-content-secondary hover:bg-surface-hover hover:text-content-primary flex items-center gap-2"
          >
            <span className="text-sm">+</span> New request
          </button>
          <button
            onClick={() => { onCollectionDelete(contextMenu.collectionId); setContextMenu(null); }}
            className="w-full text-left px-3 py-1.5 text-xs text-danger hover:bg-surface-hover flex items-center gap-2"
          >
            <span>&#x2715;</span> Delete collection
          </button>
        </div>
      )}
    </div>
  );
}
