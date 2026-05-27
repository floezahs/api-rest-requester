import { useState, useEffect } from 'react';
import { Environment } from '../types';

interface EnvManagerProps {
  environments: Environment[];
  activeEnvId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<Environment | null>;
  onUpdate: (id: string, name: string, variables: Record<string, string>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function EnvManager({
  environments, activeEnvId,
  onSelect, onCreate, onUpdate, onDelete,
  onClose,
}: EnvManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editVars, setEditVars] = useState<{ key: string; value: string }[]>([]);
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    const env = environments.find(e => e.id === editingId);
    if (!env) {
      setEditingId(null);
    }
  }, [environments, editingId]);

  const startEdit = (env: Environment) => {
    setEditingId(env.id);
    setEditName(env.name);
    setEditVars(
      Object.entries(env.variables || {}).map(([k, v]) => ({ key: k, value: v }))
    );
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    const vars: Record<string, string> = {};
    editVars.forEach(v => { if (v.key.trim()) vars[v.key.trim()] = v.value; });
    onUpdate(editingId, editName.trim(), vars);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const env = await onCreate(newName.trim());
      setNewName('');
      setShowNew(false);
      if (env) {
        setEditName(env.name);
        setEditVars([]);
        setEditingId(env.id);
      }
    } finally {
      setCreating(false);
    }
  };

  const activeEnv = environments.find(e => e.id === activeEnvId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-surface-secondary border border-border-primary rounded-xl shadow-2xl w-[520px] max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-secondary">
          <div>
            <h2 className="text-sm font-semibold text-content-primary">Environments</h2>
            <p className="text-[10px] text-content-muted mt-0.5">
              Define variables like {'{{api_url}}'} that will be replaced when sending requests.
              {activeEnv && <> Active: <span className="text-green-400 font-medium">{activeEnv.name}</span></>}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon text-sm">&#x2715;</button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex flex-col gap-2">
          {environments.map((env) => (
            <div key={env.id} className={`border rounded-lg overflow-hidden transition-colors ${
              editingId === env.id ? 'border-accent' : 'border-border-secondary'
            }`}>
              {editingId === env.id ? (
                <div className="p-3 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-content-muted uppercase font-semibold w-16 flex-shrink-0">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 bg-surface-tertiary border border-border-primary rounded px-2 py-1.5 text-sm outline-none focus:border-accent"
                      placeholder="e.g. Development, Production"
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-content-muted uppercase font-semibold">Variables</span>
                      <button
                        onClick={() => setEditVars([...editVars, { key: '', value: '' }])}
                        className="text-[10px] text-accent hover:text-accent-hover"
                      >+ Add</button>
                    </div>
                    {editVars.length === 0 && (
                      <div className="text-[11px] text-content-muted py-3 text-center border border-dashed border-border-secondary rounded">
                        No variables yet. Click <span className="text-accent">+ Add</span> to define one.
                      </div>
                    )}
                    {editVars.map((v, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={v.key}
                          onChange={e => {
                            const next = [...editVars];
                            next[i] = { ...next[i], key: e.target.value };
                            setEditVars(next);
                          }}
                          placeholder="VARIABLE_NAME"
                          className="flex-[2] bg-surface-tertiary border border-border-primary rounded px-2 py-1.5 text-xs font-mono outline-none focus:border-accent"
                        />
                        <input
                          type="text"
                          value={v.value}
                          onChange={e => {
                            const next = [...editVars];
                            next[i] = { ...next[i], value: e.target.value };
                            setEditVars(next);
                          }}
                          placeholder="https://..."
                          className="flex-[3] bg-surface-tertiary border border-border-primary rounded px-2 py-1.5 text-xs font-mono outline-none focus:border-accent"
                        />
                        <button
                          onClick={() => setEditVars(editVars.filter((_, j) => j !== i))}
                          className="btn-danger text-xs flex-shrink-0"
                        >&#x2715;</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-end border-t border-border-secondary pt-2.5">
                    <button onClick={() => setEditingId(null)} className="btn-secondary text-xs">Cancel</button>
                    <button onClick={saveEdit} className="btn-primary text-xs">Save changes</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    onClick={() => onSelect(env.id)}
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                      activeEnvId === env.id ? 'bg-green-400 ring-2 ring-green-400/30' : 'bg-content-muted hover:bg-content-secondary'
                    }`}
                    title={activeEnvId === env.id ? 'Active environment' : 'Click to activate'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-content-secondary truncate">{env.name}</div>
                    <div className="text-[10px] text-content-muted">
                      {Object.keys(env.variables || {}).length === 0
                        ? 'No variables'
                        : Object.entries(env.variables || {}).slice(0, 3).map(([k, v]) => (
                            <span key={k} className="inline-block bg-surface-tertiary rounded px-1 py-0.5 mr-1 mt-0.5 font-mono">
                              {'{{'}{k}{'}}'}={v}
                            </span>
                          ))
                      }
                      {Object.keys(env.variables || {}).length > 3 && (
                        <span className="text-content-muted">+{Object.keys(env.variables || {}).length - 3} more</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => startEdit(env)} className="btn-icon text-xs flex-shrink-0" title="Edit variables">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => { if (editingId === env.id) setEditingId(null); onDelete(env.id); }} className="btn-danger text-xs flex-shrink-0" title="Delete">&#x2715;</button>
                </div>
              )}
            </div>
          ))}

          {showNew && (
            <div className="flex gap-2 items-center border border-accent rounded-lg p-2">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Name (e.g. Production, Staging)"
                className="flex-1 bg-surface-tertiary border border-border-primary rounded px-2 py-1.5 text-xs outline-none focus:border-accent"
                autoFocus
              />
              <button onClick={handleCreate} disabled={creating} className="btn-primary text-xs">
                {creating ? '...' : 'Create & edit'}
              </button>
              <button onClick={() => setShowNew(false)} className="btn-secondary text-xs">Cancel</button>
            </div>
          )}

          {!showNew && (
            <button
              onClick={() => setShowNew(true)}
              className="text-xs text-accent hover:text-accent-hover self-start flex items-center gap-1 py-1"
            >
              <span className="text-base leading-none">+</span> New environment
            </button>
          )}

          {environments.length === 0 && !showNew && (
            <div className="text-xs text-content-muted text-center py-6 leading-relaxed">
              <div className="text-sm mb-2">No environments yet</div>
              Create one to define variables like <code className="bg-surface-tertiary px-1 py-0.5 rounded text-[11px]">{'{{api_url}}'}</code> that
              will be replaced in your request URLs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
