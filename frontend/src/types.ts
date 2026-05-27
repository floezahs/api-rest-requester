export namespace models {
  export interface KeyValue {
    key: string;
    value: string;
    enabled: boolean;
  }
  export interface RequestBody {
    type: string;
    content: string;
    formData: KeyValue[];
  }
  export interface RequestConfig {
    id: string;
    name: string;
    method: string;
    url: string;
    headers: KeyValue[];
    params: KeyValue[];
    body: RequestBody;
    bodyType: string;
  }
  export interface HTTPResponse {
    statusCode: number;
    status: string;
    headers: Record<string, string>;
    body: string;
    timeMs: number;
    sizeBytes: number;
    error?: string;
  }
  export interface Collection {
    id: string;
    name: string;
    createdAt: number;
    requests: RequestConfig[];
  }
  export interface HistoryEntry {
    id: string;
    request: RequestConfig;
    response: HTTPResponse;
    timestamp: number;
  }
  export interface Environment {
    id: string;
    name: string;
    variables: Record<string, string>;
  }
  export interface ImportResult {
    collection: Collection | null;
    count: number;
    error: string;
  }
  export interface UpdateInfo {
    currentVersion: string;
    latestVersion: string;
    updateAvailable: boolean;
    downloadUrl: string;
    error?: string;
  }
}

export type KeyValue = models.KeyValue;
export type RequestBody = models.RequestBody;
export type RequestConfig = models.RequestConfig;
export type HTTPResponse = models.HTTPResponse;
export type Collection = models.Collection;
export type HistoryEntry = models.HistoryEntry;
export type Environment = models.Environment;
export type ImportResult = models.ImportResult;
export type UpdateInfo = models.UpdateInfo;

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type BodyType = 'none' | 'json' | 'raw' | 'form-data' | 'x-www-form-urlencoded';
export type Theme = 'dark' | 'light' | 'solarized' | 'one-dark' | 'monokai';

export const METHOD_COLORS: Record<string, string> = {
  GET: 'text-method-get',
  POST: 'text-method-post',
  PUT: 'text-method-put',
  PATCH: 'text-method-patch',
  DELETE: 'text-method-delete',
  HEAD: 'text-method-head',
  OPTIONS: 'text-method-options',
};
