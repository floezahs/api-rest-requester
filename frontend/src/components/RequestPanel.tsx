import { useState } from 'react';
import { RequestConfig, KeyValue } from '../types';
import UrlBar from './UrlBar';
import KeyValueEditor from './KeyValueEditor';
import BodyEditor from './BodyEditor';

interface RequestPanelProps {
  config: RequestConfig;
  loading: boolean;
  onConfigChange: (config: RequestConfig) => void;
  onSend: () => void;
}

type Tab = 'params' | 'headers' | 'body';

export default function RequestPanel({ config, loading, onConfigChange, onSend }: RequestPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('params');

  const updateMethod = (method: string) => onConfigChange({ ...config, method });
  const updateUrl = (url: string) => onConfigChange({ ...config, url });
  const updateHeaders = (headers: KeyValue[]) => onConfigChange({ ...config, headers });
  const updateParams = (params: KeyValue[]) => onConfigChange({ ...config, params });
  const updateBodyType = (bodyType: string) => onConfigChange({
    ...config,
    bodyType,
    body: { ...config.body, type: bodyType },
  });
  const updateBodyContent = (content: string) => onConfigChange({
    ...config,
    body: { ...config.body, content },
  });
  const updateFormData = (formData: KeyValue[]) => onConfigChange({
    ...config,
    body: { ...config.body, formData },
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: 'params', label: 'Params' },
    { id: 'headers', label: 'Headers' },
    { id: 'body', label: 'Body' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-0">
        <input
          type="text"
          value={config.name}
          onChange={(e) => onConfigChange({ ...config, name: e.target.value })}
          placeholder="Request name..."
          className="w-full bg-transparent border-none text-sm text-content-muted mb-1.5 px-0 py-0 outline-none focus:text-content-secondary"
        />
        <UrlBar
          method={config.method}
          url={config.url}
          loading={loading}
          onMethodChange={updateMethod}
          onUrlChange={updateUrl}
          onSend={onSend}
        />
      </div>
      <div className="flex gap-0 border-b border-border-secondary px-3 mt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-xs transition-colors ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3">
        {activeTab === 'params' && (
          <KeyValueEditor
            items={config.params}
            onChange={updateParams}
            keyPlaceholder="Parameter name"
            valuePlaceholder="Parameter value"
          />
        )}
        {activeTab === 'headers' && (
          <KeyValueEditor
            items={config.headers}
            onChange={updateHeaders}
            keyPlaceholder="Header name"
            valuePlaceholder="Header value"
          />
        )}
        {activeTab === 'body' && (
          <BodyEditor
            bodyType={config.bodyType}
            content={config.body.content}
            formData={config.body.formData}
            onBodyTypeChange={updateBodyType}
            onContentChange={updateBodyContent}
            onFormDataChange={updateFormData}
          />
        )}
      </div>
    </div>
  );
}
