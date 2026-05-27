package main

type HTTPMethod string

const (
	GET     HTTPMethod = "GET"
	POST    HTTPMethod = "POST"
	PUT     HTTPMethod = "PUT"
	DELETE  HTTPMethod = "DELETE"
	PATCH   HTTPMethod = "PATCH"
	HEAD    HTTPMethod = "HEAD"
	OPTIONS HTTPMethod = "OPTIONS"
)

type KeyValue struct {
	Key     string `json:"key"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

type BodyType string

const (
	BodyNone           BodyType = "none"
	BodyJSON           BodyType = "json"
	BodyRaw            BodyType = "raw"
	BodyFormData       BodyType = "form-data"
	BodyFormURLEncoded BodyType = "x-www-form-urlencoded"
)

type RequestBody struct {
	Type     BodyType   `json:"type"`
	Content  string     `json:"content"`
	FormData []KeyValue `json:"formData"`
}

type RequestConfig struct {
	ID      string      `json:"id"`
	Name    string      `json:"name"`
	Method  HTTPMethod  `json:"method"`
	URL     string      `json:"url"`
	Headers []KeyValue  `json:"headers"`
	Params  []KeyValue  `json:"params"`
	Body    RequestBody `json:"body"`
	BodyType BodyType   `json:"bodyType"`
}

type HTTPResponse struct {
	StatusCode int               `json:"statusCode"`
	Status     string            `json:"status"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
	TimeMs     int64             `json:"timeMs"`
	SizeBytes  int64             `json:"sizeBytes"`
	Error      string            `json:"error,omitempty"`
}

type Collection struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	CreatedAt int64           `json:"createdAt"`
	Requests  []RequestConfig `json:"requests"`
}

type HistoryEntry struct {
	ID        string        `json:"id"`
	Request   RequestConfig `json:"request"`
	Response  HTTPResponse  `json:"response"`
	Timestamp int64         `json:"timestamp"`
}

type Environment struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Variables map[string]string `json:"variables"`
}

type AppState struct {
	Collections  []Collection   `json:"collections"`
	History      []HistoryEntry `json:"history"`
	Environments []Environment  `json:"environments"`
	ActiveEnvID  string         `json:"activeEnvId"`
	UpdatedAt    string         `json:"updatedAt"`
}

type PostmanCollection struct {
	Info PostmanInfo          `json:"info"`
	Item []PostmanItem        `json:"item"`
}

type PostmanInfo struct {
	Name   string `json:"name"`
	Schema string `json:"schema"`
}

type PostmanItem struct {
	Name    string           `json:"name"`
	Request *PostmanRequest  `json:"request,omitempty"`
	Item    []PostmanItem    `json:"item,omitempty"`
}

type PostmanRequest struct {
	Method string             `json:"method"`
	Header []PostmanHeader    `json:"header"`
	URL    PostmanURL         `json:"url"`
	Body   *PostmanBody       `json:"body,omitempty"`
}

type PostmanHeader struct {
	Key      string `json:"key"`
	Value    string `json:"value"`
	Disabled bool   `json:"disabled"`
}

type PostmanURL struct {
	Raw      string          `json:"raw"`
	Query    []PostmanParam  `json:"query"`
}

type PostmanParam struct {
	Key      string `json:"key"`
	Value    string `json:"value"`
	Disabled bool   `json:"disabled"`
}

type PostmanBody struct {
	Mode       string              `json:"mode"`
	Raw        string              `json:"raw,omitempty"`
	FormData   []PostmanFormField  `json:"formdata,omitempty"`
	URLEncoded []PostmanFormField  `json:"urlencoded,omitempty"`
}

type PostmanFormField struct {
	Key      string `json:"key"`
	Value    string `json:"value"`
	Disabled bool   `json:"disabled"`
}

type UpdateInfo struct {
	CurrentVersion  string `json:"currentVersion"`
	LatestVersion   string `json:"latestVersion"`
	UpdateAvailable bool   `json:"updateAvailable"`
	DownloadURL     string `json:"downloadUrl"`
	Error           string `json:"error,omitempty"`
}
