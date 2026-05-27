import { useState, useEffect, useCallback, useRef } from 'react';
import { Collection, HistoryEntry, RequestConfig, HTTPResponse, Theme, ImportResult, Environment } from './types';
import {
  GetCollections, CreateCollection, DeleteCollection,
  AddRequest, UpdateRequest, DeleteRequest,
  GetHistory, ClearHistory, DeleteHistoryEntry,
  SendRequest, ImportPostmanJSON,
  GetEnvironments, CreateEnvironment, UpdateEnvironment, DeleteEnvironment,
  SetActiveEnvironment, GetActiveEnvironment,
} from '../wailsjs/go/main/App';
import Sidebar from './components/Sidebar';
import RequestPanel from './components/RequestPanel';
import ResponsePanel from './components/ResponsePanel';
import ThemeSwitcher from './components/ThemeSwitcher';
import SettingsMenu, { FontSize } from './components/SettingsMenu';
import EnvManager from './components/EnvManager';

function emptyRequest(): RequestConfig {
  return {
    id: '',
    name: '',
    method: 'GET',
    url: '',
    headers: [{ key: '', value: '', enabled: true }],
    params: [],
    body: { type: 'none', content: '', formData: [] },
    bodyType: 'none',
  };
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export default function App() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeRequest, setActiveRequest] = useState<RequestConfig>(emptyRequest());
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [response, setResponse] = useState<HTTPResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('api-kit-theme') as Theme) || 'dark';
  });
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem('api-kit-font-size') as FontSize) || '13';
  });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvId, setActiveEnvId] = useState('');
  const [showEnvManager, setShowEnvManager] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('api-kit-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-base', fontSize + 'px');
    localStorage.setItem('api-kit-font-size', fontSize);
  }, [fontSize]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 2500);
  };

  const loadData = useCallback(async () => {
    try {
      const [cols, hist, envs, active] = await Promise.all([
        GetCollections(), GetHistory(), GetEnvironments(), GetActiveEnvironment()
      ]);
      setCollections(cols as unknown as Collection[] || []);
      setHistory(hist as unknown as HistoryEntry[] || []);
      setEnvironments(envs as unknown as Environment[] || []);
      if (active) {
        setActiveEnvId((active as unknown as Environment).id);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await SendRequest(activeRequest as any);
      setResponse(res as unknown as HTTPResponse);
      await loadData();
    } catch (e: any) {
      setResponse({
        statusCode: 0,
        status: 'Error',
        headers: {},
        body: '',
        timeMs: 0,
        sizeBytes: 0,
        error: String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionCreate = async (name: string) => {
    try {
      await CreateCollection(name);
      await loadData();
      showToast(`Collection "${name}" created`);
    } catch (e) { console.error(e); }
  };

  const handleCollectionDelete = async (id: string) => {
    try {
      await DeleteCollection(id);
      if (activeCollectionId === id) {
        setActiveCollectionId(null);
        setActiveRequest(emptyRequest());
      }
      await loadData();
    } catch (e) { console.error(e); }
  };

  const handleRequestSelect = (collectionId: string, request: RequestConfig) => {
    setActiveCollectionId(collectionId);
    setActiveRequest(request);
    setResponse(null);
  };

  const handleRequestDelete = async (collectionId: string, requestId: string) => {
    try {
      await DeleteRequest(collectionId, requestId);
      if (activeRequest.id === requestId) {
        setActiveRequest(emptyRequest());
      }
      await loadData();
    } catch (e) { console.error(e); }
  };

  const handleNewRequest = (collectionId: string) => {
    setActiveCollectionId(collectionId);
    setActiveRequest(emptyRequest());
    setResponse(null);
    setSaved(false);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setActiveRequest(entry.request);
    setResponse(entry.response);
    setActiveCollectionId(null);
  };

  const handleHistoryClear = async () => {
    try {
      await ClearHistory();
      await loadData();
    } catch (e) { console.error(e); }
  };

  const handleHistoryDelete = async (id: string) => {
    try {
      await DeleteHistoryEntry(id);
      await loadData();
    } catch (e) { console.error(e); }
  };

  const handleSaveRequest = async () => {
    if (!activeRequest.url && !activeRequest.name) {
      showToast('Enter a URL or name before saving', 'error');
      return;
    }

    if (!activeCollectionId) {
      const name = prompt('Collection name for new request:');
      if (!name) return;
      try {
        const col = await CreateCollection(name);
        const colData = col as unknown as Collection;
        const req = { ...activeRequest, id: generateId() } as RequestConfig;
        await AddRequest(colData.id, req as any);
        setActiveCollectionId(colData.id);
        await loadData();
        setActiveRequest(emptyRequest());
        setResponse(null);
        setSaved(true);
        showToast('Saved to "' + colData.name + '"');
        setTimeout(() => setSaved(false), 2000);
      } catch (e: any) {
        showToast('Save failed: ' + String(e), 'error');
      }
    } else {
      const col = collections.find(c => c.id === activeCollectionId);
      const exists = col?.requests.some(r => r.id === activeRequest.id && activeRequest.id !== '');

      try {
        if (exists) {
          await UpdateRequest(activeCollectionId, activeRequest as any);
        } else {
          const req = { ...activeRequest, id: generateId() } as RequestConfig;
          await AddRequest(activeCollectionId, req as any);
        }
        await loadData();
        const currentCol = collections.find(c => c.id === activeCollectionId);
        const colName = currentCol?.name || 'collection';
        setActiveRequest(emptyRequest());
        setResponse(null);
        setSaved(true);
        showToast('Saved to "' + colName + '"');
        setTimeout(() => setSaved(false), 2000);
      } catch (e: any) {
        showToast('Save failed: ' + String(e), 'error');
      }
    }
  };

  const handleImportPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim().length < 10) {
        showToast('Clipboard empty or too short', 'error');
        return;
      }
      const result = await ImportPostmanJSON(text) as unknown as ImportResult;
      if (result.error) {
        showToast(result.error, 'error');
      } else if (result.collection) {
        await loadData();
        showToast('Imported "' + result.collection.name + '" (' + result.count + ' requests)');
      }
    } catch (e: any) {
      showToast('Paste import failed: ' + String(e), 'error');
    }
  };

  const handleImportFile = async (content: string) => {
    if (!content) {
      showToast('Could not read file', 'error');
      return;
    }
    try {
      const result = await ImportPostmanJSON(content) as unknown as ImportResult;
      if (result.error) {
        showToast(result.error, 'error');
      } else if (result.collection) {
        await loadData();
        showToast('Imported "' + result.collection.name + '" (' + result.count + ' requests)');
      }
    } catch (e: any) {
      showToast('Import failed: ' + String(e), 'error');
    }
  };

  const handleEnvSelect = async (id: string) => {
    try {
      await SetActiveEnvironment(id);
      setActiveEnvId(id);
      showToast('Environment activated');
    } catch (e: any) {
      showToast('Failed: ' + String(e), 'error');
    }
  };

  const handleEnvCreate = async (name: string): Promise<Environment | null> => {
    try {
      const env = await CreateEnvironment(name);
      await loadData();
      showToast('Environment created');
      return env as unknown as Environment;
    } catch (e: any) {
      showToast('Failed: ' + String(e), 'error');
      return null;
    }
  };

  const handleEnvUpdate = async (id: string, name: string, variables: Record<string, string>) => {
    try {
      await UpdateEnvironment(id, name, variables);
      await loadData();
      showToast('Environment updated');
    } catch (e: any) { showToast('Failed: ' + String(e), 'error'); }
  };

  const handleEnvDelete = async (id: string) => {
    try {
      await DeleteEnvironment(id);
      if (activeEnvId === id) setActiveEnvId('');
      await loadData();
      showToast('Environment deleted');
    } catch (e: any) { showToast('Failed: ' + String(e), 'error'); }
  };

  const activeCollection = collections.find(c => c.id === activeCollectionId);

  return (
    <div className="flex h-screen bg-surface-primary">
      <div className="w-64 flex-shrink-0">
        <Sidebar
          collections={collections}
          history={history}
          activeRequestId={activeRequest.id || null}
          activeCollectionId={activeCollectionId}
          onCollectionCreate={handleCollectionCreate}
          onCollectionDelete={handleCollectionDelete}
          onRequestSelect={handleRequestSelect}
          onRequestDelete={handleRequestDelete}
          onNewRequest={handleNewRequest}
          onHistorySelect={handleHistorySelect}
          onHistoryClear={handleHistoryClear}
          onHistoryDelete={handleHistoryDelete}
          onImportFile={handleImportFile}
          onImportPaste={handleImportPaste}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-1/2 min-h-[200px] border-b border-border-primary overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-1 border-b border-border-secondary bg-surface-secondary flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-content-muted font-semibold uppercase tracking-wider">Request</span>
              {activeCollection && (
                <span className="text-[10px] text-content-muted bg-surface-tertiary px-1.5 py-0.5 rounded">
                  {activeCollection.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEnvManager(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded border border-border-primary hover:bg-surface-hover transition-colors text-xs"
                title="Manage environments"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 18v-7a8 8 0 1 1 16 0v7"/>
                  <path d="M4 18h16"/>
                  <path d="M8 18v1a3 3 0 0 0 6 0v-1"/>
                </svg>
                {activeEnvId ? (
                  <span className="text-content-secondary">
                    {environments.find(e => e.id === activeEnvId)?.name || 'Env'}
                  </span>
                ) : (
                  <span className="text-content-muted">No Env</span>
                )}
              </button>
              <button
                onClick={handleSaveRequest}
                className={`text-[11px] transition-all flex items-center gap-1 px-2 py-1 rounded ${
                  saved
                    ? 'bg-green-900/30 text-green-400'
                    : 'text-content-muted hover:text-accent'
                }`}
                title="Save to collection"
              >
                {saved ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Saved
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                    Save
                  </>
                )}
              </button>
              <ThemeSwitcher current={theme} onChange={setTheme} />
              <SettingsMenu fontSize={fontSize} onFontSizeChange={setFontSize} />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <RequestPanel
              config={activeRequest}
              loading={loading}
              onConfigChange={setActiveRequest}
              onSend={handleSend}
            />
          </div>
        </div>
        <div className="flex-1 min-h-[150px] overflow-hidden flex flex-col">
          <div className="px-3 py-1 border-b border-border-secondary bg-surface-secondary flex-shrink-0">
            <span className="text-[11px] text-content-muted font-semibold uppercase tracking-wider">Response</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ResponsePanel response={response} />
          </div>
        </div>
      </div>
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium z-50 transition-all ${
          toast.type === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-green-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}
      {showEnvManager && (
        <EnvManager
          environments={environments}
          activeEnvId={activeEnvId}
          onSelect={handleEnvSelect}
          onCreate={handleEnvCreate}
          onUpdate={handleEnvUpdate}
          onDelete={handleEnvDelete}
          onClose={() => setShowEnvManager(false)}
        />
      )}
    </div>
  );
}
