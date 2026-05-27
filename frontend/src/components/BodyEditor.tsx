import { KeyValue } from '../types';
import KeyValueEditor from './KeyValueEditor';

interface BodyEditorProps {
  bodyType: string;
  content: string;
  formData: KeyValue[];
  onBodyTypeChange: (type: string) => void;
  onContentChange: (content: string) => void;
  onFormDataChange: (items: KeyValue[]) => void;
}

const BODY_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'raw', label: 'Raw' },
  { value: 'form-data', label: 'Form Data' },
  { value: 'x-www-form-urlencoded', label: 'URL Encoded' },
];

export default function BodyEditor({
  bodyType, content, formData,
  onBodyTypeChange, onContentChange, onFormDataChange,
}: BodyEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-0.5 border-b border-border-secondary pb-0">
        {BODY_TYPES.map((bt) => (
          <button
            key={bt.value}
            onClick={() => onBodyTypeChange(bt.value)}
            className={`px-3 py-1.5 text-xs rounded-t transition-colors -mb-[1px] ${
              bodyType === bt.value
                ? 'bg-surface-primary text-content-primary border border-border-secondary border-b-transparent'
                : 'text-content-muted hover:text-content-secondary hover:bg-surface-hover'
            }`}
          >
            {bt.label}
          </button>
        ))}
      </div>
      <div>
        {bodyType === 'none' && (
          <div className="text-content-muted text-sm py-8 text-center border border-dashed border-border-secondary rounded">
            This request does not have a body
          </div>
        )}
        {(bodyType === 'json' || bodyType === 'raw') && (
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : ''}
            className="w-full h-52 bg-surface-tertiary border border-border-primary rounded p-3 text-sm font-mono resize-none outline-none focus:border-accent"
            spellCheck={false}
          />
        )}
        {(bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') && (
          <KeyValueEditor
            items={formData}
            onChange={onFormDataChange}
            keyPlaceholder="Key"
            valuePlaceholder="Value"
          />
        )}
      </div>
    </div>
  );
}
