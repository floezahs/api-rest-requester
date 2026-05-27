package main

import (
	"encoding/json"
	"fmt"
	"strings"
)

type ImportResult struct {
	Collection *Collection `json:"collection"`
	Count      int         `json:"count"`
	Error      string      `json:"error,omitempty"`
}

type CollectionHandler struct {
	store *FileStore
}

func NewCollectionHandler(store *FileStore) *CollectionHandler {
	return &CollectionHandler{store: store}
}

func (h *CollectionHandler) GetCollections() []Collection {
	return h.store.GetCollections()
}

func (h *CollectionHandler) CreateCollection(name string) Collection {
	return h.store.CreateCollection(name)
}

func (h *CollectionHandler) UpdateCollection(id string, name string) error {
	return h.store.UpdateCollection(id, name)
}

func (h *CollectionHandler) DeleteCollection(id string) error {
	return h.store.DeleteCollection(id)
}

func (h *CollectionHandler) AddRequest(collectionID string, config RequestConfig) (*RequestConfig, error) {
	req, err := h.store.AddRequest(collectionID, config)
	if err != nil {
		return nil, err
	}
	return &req, nil
}

func (h *CollectionHandler) UpdateRequest(collectionID string, config RequestConfig) error {
	return h.store.UpdateRequest(collectionID, config)
}

func (h *CollectionHandler) DeleteRequest(collectionID string, requestID string) error {
	return h.store.DeleteRequest(collectionID, requestID)
}

func (h *CollectionHandler) AddHistoryEntry(entry HistoryEntry) {
	h.store.AddHistoryEntry(entry)
}

func (h *CollectionHandler) GetHistory() []HistoryEntry {
	return h.store.GetHistory()
}

func (h *CollectionHandler) ClearHistory() {
	h.store.ClearHistory()
}

func (h *CollectionHandler) DeleteHistoryEntry(id string) error {
	return h.store.DeleteHistoryEntry(id)
}

func (h *CollectionHandler) GetEnvironments() []Environment {
	return h.store.GetEnvironments()
}

func (h *CollectionHandler) CreateEnvironment(name string) Environment {
	return h.store.CreateEnvironment(name)
}

func (h *CollectionHandler) UpdateEnvironment(id string, name string, variables map[string]string) error {
	return h.store.UpdateEnvironment(id, name, variables)
}

func (h *CollectionHandler) DeleteEnvironment(id string) error {
	return h.store.DeleteEnvironment(id)
}

func (h *CollectionHandler) SetActiveEnvironment(id string) {
	h.store.SetSetting("active_env_id", id)
}

func (h *CollectionHandler) GetActiveEnvironment() *Environment {
	activeID := h.store.GetSetting("active_env_id")
	if activeID == "" {
		return nil
	}
	envs := h.store.GetEnvironments()
	for i := range envs {
		if envs[i].ID == activeID {
			return &envs[i]
		}
	}
	return nil
}

func (h *CollectionHandler) GetActiveEnvVars() map[string]string {
	env := h.GetActiveEnvironment()
	if env == nil {
		return nil
	}
	return env.Variables
}

func (h *CollectionHandler) ImportPostmanJSON(content string) ImportResult {
	var pm PostmanCollection
	if err := json.Unmarshal([]byte(content), &pm); err != nil {
		return ImportResult{Error: fmt.Sprintf("Invalid JSON: %v", err)}
	}

	col := h.store.CreateCollection(pm.Info.Name)

	requests := h.extractRequests(pm.Item)
	for _, req := range requests {
		h.store.AddRequest(col.ID, req)
	}

	if col.Name == "" {
		col.Name = "Imported Collection"
	}

	return ImportResult{
		Collection: &col,
		Count:      len(requests),
	}
}

func (h *CollectionHandler) extractRequests(items []PostmanItem) []RequestConfig {
	var result []RequestConfig
	for _, item := range items {
		if item.Item != nil && len(item.Item) > 0 {
			result = append(result, h.extractRequests(item.Item)...)
		}
		if item.Request != nil {
			result = append(result, h.convertRequest(item.Name, item.Request))
		}
	}
	return result
}

func (h *CollectionHandler) convertRequest(name string, pmReq *PostmanRequest) RequestConfig {
	req := RequestConfig{
		ID:   genID(),
		Name: name,
		Method:  HTTPMethod(strings.ToUpper(pmReq.Method)),
		URL:     pmReq.URL.Raw,
		Headers: []KeyValue{},
		Params:  []KeyValue{},
		Body: RequestBody{
			Type:     BodyNone,
			Content:  "",
			FormData: []KeyValue{},
		},
		BodyType: BodyNone,
	}

	for _, h := range pmReq.Header {
		req.Headers = append(req.Headers, KeyValue{
			Key:     h.Key,
			Value:   h.Value,
			Enabled: !h.Disabled,
		})
	}

	for _, q := range pmReq.URL.Query {
		req.Params = append(req.Params, KeyValue{
			Key:     q.Key,
			Value:   q.Value,
			Enabled: !q.Disabled,
		})
	}

	if pmReq.Body != nil {
		switch pmReq.Body.Mode {
		case "raw":
			req.Body.Type = BodyRaw
			req.Body.Content = pmReq.Body.Raw
			req.BodyType = BodyRaw
		case "json":
			req.Body.Type = BodyJSON
			req.Body.Content = pmReq.Body.Raw
			req.BodyType = BodyJSON
		case "formdata":
			req.Body.Type = BodyFormData
			req.BodyType = BodyFormData
			for _, f := range pmReq.Body.FormData {
				req.Body.FormData = append(req.Body.FormData, KeyValue{
					Key:     f.Key,
					Value:   f.Value,
					Enabled: !f.Disabled,
				})
			}
		case "urlencoded":
			req.Body.Type = BodyFormURLEncoded
			req.BodyType = BodyFormURLEncoded
			for _, f := range pmReq.Body.URLEncoded {
				req.Body.FormData = append(req.Body.FormData, KeyValue{
					Key:     f.Key,
					Value:   f.Value,
					Enabled: !f.Disabled,
				})
			}
		}
	}

	return req
}
