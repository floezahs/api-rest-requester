package main

import (
	"context"
)

type App struct {
	ctx        context.Context
	http       *HTTPHandler
	collection *CollectionHandler
}

func NewApp(store *FileStore) *App {
	return &App{
		http:       NewHTTPHandler(),
		collection: NewCollectionHandler(store),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.http.startup(ctx)
}

func (a *App) SendRequest(config RequestConfig) HTTPResponse {
	vars := a.collection.GetActiveEnvVars()
	resp := a.http.SendRequest(config, vars)
	entry := HistoryEntry{
		ID:       genID(),
		Request:  config,
		Response: resp,
	}
	a.collection.AddHistoryEntry(entry)
	return resp
}

func (a *App) GetCollections() []Collection {
	return a.collection.GetCollections()
}

func (a *App) CreateCollection(name string) Collection {
	return a.collection.CreateCollection(name)
}

func (a *App) UpdateCollection(id string, name string) error {
	return a.collection.UpdateCollection(id, name)
}

func (a *App) DeleteCollection(id string) error {
	return a.collection.DeleteCollection(id)
}

func (a *App) AddRequest(collectionID string, config RequestConfig) (*RequestConfig, error) {
	return a.collection.AddRequest(collectionID, config)
}

func (a *App) UpdateRequest(collectionID string, config RequestConfig) error {
	return a.collection.UpdateRequest(collectionID, config)
}

func (a *App) DeleteRequest(collectionID string, requestID string) error {
	return a.collection.DeleteRequest(collectionID, requestID)
}

func (a *App) GetHistory() []HistoryEntry {
	return a.collection.GetHistory()
}

func (a *App) ClearHistory() {
	a.collection.ClearHistory()
}

func (a *App) DeleteHistoryEntry(id string) error {
	return a.collection.DeleteHistoryEntry(id)
}

func (a *App) GetEnvironments() []Environment {
	return a.collection.GetEnvironments()
}

func (a *App) CreateEnvironment(name string) Environment {
	return a.collection.CreateEnvironment(name)
}

func (a *App) UpdateEnvironment(id string, name string, variables map[string]string) error {
	return a.collection.UpdateEnvironment(id, name, variables)
}

func (a *App) DeleteEnvironment(id string) error {
	return a.collection.DeleteEnvironment(id)
}

func (a *App) SetActiveEnvironment(id string) {
	a.collection.SetActiveEnvironment(id)
}

func (a *App) GetActiveEnvironment() *Environment {
	return a.collection.GetActiveEnvironment()
}

func (a *App) ImportPostmanJSON(jsonContent string) ImportResult {
	return a.collection.ImportPostmanJSON(jsonContent)
}
