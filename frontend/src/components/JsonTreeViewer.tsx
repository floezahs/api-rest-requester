import { useState, useMemo, useCallback, createContext, useContext } from 'react';

interface JsonTreeViewerProps {
  data: any;
}

interface JsonLine {
  lineNumber: number;
  depth: number;
  element: JSX.Element;
}

const CollapseContext = createContext<{
  collapsedPaths: Set<string>;
  toggle: (path: string) => void;
}>({ collapsedPaths: new Set(), toggle: () => {} });

function isExpandable(value: any): boolean {
  if (value === null) return false;
  if (typeof value !== 'object') return false;
  return Object.keys(value).length > 0;
}

function formatPrimitive(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

function getNodeType(value: any): string {
  if (value === null) return 'json-null';
  if (typeof value === 'string') return 'json-string';
  if (typeof value === 'number') return 'json-number';
  if (typeof value === 'boolean') return 'json-boolean';
  return '';
}

function getSummary(value: any): string {
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === 'object' && value !== null) return `${Object.keys(value).length} keys`;
  return '';
}

function buildLines(
  value: any,
  depth: number,
  path: string,
  key: string | null,
  isLast: boolean,
): JsonLine[] {
  const ctx = useContext(CollapseContext);
  const result: JsonLine[] = [];
  const indent = depth * 16;
  const comma = isLast ? '' : ',';

  if (key !== null) {
    if (value !== null && typeof value === 'object') {
      const expandable = isExpandable(value);
      const collapsed = expandable && ctx.collapsedPaths.has(path);
      const isArr = Array.isArray(value);
      const brace = isArr ? '[' : '{';
      const closeBrace = isArr ? ']' : '}';
      const isEmpty = !expandable;

      if (collapsed) {
        result.push({
          lineNumber: 0,
          depth,
          element: (
            <span onClick={() => ctx.toggle(path)} className="json-line-collapsible">
              <span className="json-toggle">▶ </span>
              <span className="json-key">"{key}": </span>
              <span className="json-bracket">{brace} </span>
              <span className="json-summary">{getSummary(value)}</span>
              <span className="json-bracket"> {closeBrace}</span>
              {comma}
            </span>
          ),
        });
      } else if (isEmpty) {
        result.push({
          lineNumber: 0,
          depth,
          element: (
            <span>
              <span className="json-key">"{key}": </span>
              <span className="json-bracket">{brace}{closeBrace}</span>
              {comma}
            </span>
          ),
        });
      } else {
        result.push({
          lineNumber: 0,
          depth,
          element: (
            <span onClick={() => ctx.toggle(path)} className="json-line-collapsible">
              <span className="json-toggle">▼ </span>
              <span className="json-key">"{key}": </span>
              <span className="json-bracket">{brace}</span>
            </span>
          ),
        });

        if (isArr) {
          const arr = value as any[];
          arr.forEach((item, i) => {
            result.push(...buildLines(item, depth + 1, `${path}[${i}]`, null, i === arr.length - 1));
          });
        } else {
          const keys = Object.keys(value);
          keys.forEach((k, i) => {
            result.push(...buildLines(value[k], depth + 1, `${path}.${k}`, k, i === keys.length - 1));
          });
        }

        result.push({
          lineNumber: 0,
          depth,
          element: (
            <span>
              <span className="json-bracket">{closeBrace}</span>
              {comma}
            </span>
          ),
        });
      }
    } else {
      result.push({
        lineNumber: 0,
        depth,
        element: (
          <span>
            <span className="json-key">"{key}": </span>
            <span className={getNodeType(value)}>{formatPrimitive(value)}</span>
            {comma}
          </span>
        ),
      });
    }
  } else {
    if (value !== null && typeof value === 'object') {
      const expandable = isExpandable(value);
      const collapsed = expandable && ctx.collapsedPaths.has(path);
      const isArr = Array.isArray(value);
      const brace = isArr ? '[' : '{';
      const closeBrace = isArr ? ']' : '}';
      const isEmpty = !expandable;

      if (collapsed) {
        result.push({
          lineNumber: 0,
          depth,
          element: (
            <span onClick={() => ctx.toggle(path)} className="json-line-collapsible">
              <span className="json-toggle">▶ </span>
              <span className="json-bracket">{brace} </span>
              <span className="json-summary">{getSummary(value)}</span>
              <span className="json-bracket"> {closeBrace}</span>
              {comma}
            </span>
          ),
        });
      } else if (isEmpty) {
        result.push({
          lineNumber: 0,
          depth,
          element: (
            <span>
              <span className="json-bracket">{brace}{closeBrace}</span>
              {comma}
            </span>
          ),
        });
      } else {
        result.push({
          lineNumber: 0,
          depth,
          element: (
            <span onClick={() => ctx.toggle(path)} className="json-line-collapsible">
              <span className="json-toggle">▼ </span>
              <span className="json-bracket">{brace}</span>
            </span>
          ),
        });

        if (isArr) {
          const arr = value as any[];
          arr.forEach((item, i) => {
            result.push(...buildLines(item, depth + 1, `${path}[${i}]`, null, i === arr.length - 1));
          });
        } else {
          const keys = Object.keys(value);
          keys.forEach((k, i) => {
            result.push(...buildLines(value[k], depth + 1, `${path}.${k}`, k, i === keys.length - 1));
          });
        }

        result.push({
          lineNumber: 0,
          depth,
          element: (
            <span>
              <span className="json-bracket">{closeBrace}</span>
              {comma}
            </span>
          ),
        });
      }
    } else {
      result.push({
        lineNumber: 0,
        depth,
        element: (
          <span className={getNodeType(value)}>{formatPrimitive(value)}</span>
        ),
      });
    }
  }

  return result;
}

function JsonTreeInner({ data }: { data: any }) {
  const ctx = useContext(CollapseContext);

  const lines = useMemo(() => {
    const raw = buildLines(data, 0, '', null, true);
    let num = 0;
    return raw.map(line => ({
      ...line,
      lineNumber: ++num,
    }));
  }, [data, ctx.collapsedPaths]);

  return (
    <div className="json-tree-viewer">
      {lines.map((line, i) => (
        <div key={i} className="json-tree-line">
          <span className="json-line-number">{line.lineNumber}</span>
          <span
            className="json-line-content"
            style={{ paddingLeft: `${line.depth * 16}px` }}
          >
            {line.element}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function JsonTreeViewer({ data }: JsonTreeViewerProps) {
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());

  const toggle = useCallback((path: string) => {
    setCollapsedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  return (
    <CollapseContext.Provider value={{ collapsedPaths, toggle }}>
      <JsonTreeInner data={data} />
    </CollapseContext.Provider>
  );
}
