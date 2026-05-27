package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type FileStore struct {
	mu       sync.RWMutex
	dataDir  string
	state    AppState
}

func NewFileStore(dataDir string) (*FileStore, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("create data dir: %w", err)
	}

	fs := &FileStore{
		dataDir: dataDir,
		state: AppState{
			Collections:  []Collection{},
			History:      []HistoryEntry{},
			Environments: []Environment{},
		},
	}

	if err := fs.load(); err != nil && !os.IsNotExist(err) {
		return nil, fmt.Errorf("load state: %w", err)
	}

	return fs, nil
}

func (fs *FileStore) filePath() string {
	return filepath.Join(fs.dataDir, "nadir.json")
}

func (fs *FileStore) load() error {
	data, err := os.ReadFile(fs.filePath())
	if err != nil {
		return err
	}
	var state AppState
	if err := json.Unmarshal(data, &state); err != nil {
		return err
	}
	if state.Collections == nil {
		state.Collections = []Collection{}
	}
	if state.History == nil {
		state.History = []HistoryEntry{}
	}
	if state.Environments == nil {
		state.Environments = []Environment{}
	}
	fs.state = state
	return nil
}

func (fs *FileStore) save() error {
	data, err := json.MarshalIndent(fs.state, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(fs.filePath(), data, 0644)
}

func (fs *FileStore) GetCollections() []Collection {
	fs.mu.RLock()
	defer fs.mu.RUnlock()
	result := make([]Collection, len(fs.state.Collections))
	copy(result, fs.state.Collections)
	return result
}

func (fs *FileStore) CreateCollection(name string) Collection {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	c := Collection{
		ID:        genID(),
		Name:      name,
		CreatedAt: time.Now().UnixMilli(),
		Requests:  []RequestConfig{},
	}
	fs.state.Collections = append(fs.state.Collections, c)
	fs.save()
	return c
}

func (fs *FileStore) UpdateCollection(id, name string) error {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	for i := range fs.state.Collections {
		if fs.state.Collections[i].ID == id {
			fs.state.Collections[i].Name = name
			fs.save()
			return nil
		}
	}
	return fmt.Errorf("collection not found")
}

func (fs *FileStore) DeleteCollection(id string) error {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	for i := range fs.state.Collections {
		if fs.state.Collections[i].ID == id {
			fs.state.Collections = append(fs.state.Collections[:i], fs.state.Collections[i+1:]...)
			fs.save()
			return nil
		}
	}
	return fmt.Errorf("collection not found")
}

func (fs *FileStore) AddRequest(collectionID string, config RequestConfig) (RequestConfig, error) {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	if config.ID == "" {
		config.ID = genID()
	}
	for i := range fs.state.Collections {
		if fs.state.Collections[i].ID == collectionID {
			fs.state.Collections[i].Requests = append(fs.state.Collections[i].Requests, config)
			fs.save()
			return config, nil
		}
	}
	return config, fmt.Errorf("collection not found")
}

func (fs *FileStore) UpdateRequest(collectionID string, config RequestConfig) error {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	for i := range fs.state.Collections {
		if fs.state.Collections[i].ID == collectionID {
			for j := range fs.state.Collections[i].Requests {
				if fs.state.Collections[i].Requests[j].ID == config.ID {
					fs.state.Collections[i].Requests[j] = config
					fs.save()
					return nil
				}
			}
		}
	}
	return fmt.Errorf("request not found")
}

func (fs *FileStore) DeleteRequest(collectionID, requestID string) error {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	for i := range fs.state.Collections {
		if fs.state.Collections[i].ID == collectionID {
			for j := range fs.state.Collections[i].Requests {
				if fs.state.Collections[i].Requests[j].ID == requestID {
					fs.state.Collections[i].Requests = append(
						fs.state.Collections[i].Requests[:j],
						fs.state.Collections[i].Requests[j+1:]...,
					)
					fs.save()
					return nil
				}
			}
		}
	}
	return fmt.Errorf("request not found")
}

func (fs *FileStore) AddHistoryEntry(entry HistoryEntry) {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	if entry.ID == "" {
		entry.ID = genID()
	}
	entry.Timestamp = time.Now().UnixMilli()
	fs.state.History = append([]HistoryEntry{entry}, fs.state.History...)
	if len(fs.state.History) > 100 {
		fs.state.History = fs.state.History[:100]
	}
	fs.save()
}

func (fs *FileStore) GetHistory() []HistoryEntry {
	fs.mu.RLock()
	defer fs.mu.RUnlock()
	result := make([]HistoryEntry, len(fs.state.History))
	copy(result, fs.state.History)
	return result
}

func (fs *FileStore) ClearHistory() {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	fs.state.History = []HistoryEntry{}
	fs.save()
}

func (fs *FileStore) DeleteHistoryEntry(id string) error {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	for i := range fs.state.History {
		if fs.state.History[i].ID == id {
			fs.state.History = append(fs.state.History[:i], fs.state.History[i+1:]...)
			fs.save()
			return nil
		}
	}
	return fmt.Errorf("history entry not found")
}

func (fs *FileStore) GetEnvironments() []Environment {
	fs.mu.RLock()
	defer fs.mu.RUnlock()
	result := make([]Environment, len(fs.state.Environments))
	copy(result, fs.state.Environments)
	return result
}

func (fs *FileStore) CreateEnvironment(name string) Environment {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	e := Environment{
		ID:        genID(),
		Name:      name,
		Variables: make(map[string]string),
	}
	fs.state.Environments = append(fs.state.Environments, e)
	fs.save()
	return e
}

func (fs *FileStore) UpdateEnvironment(id, name string, variables map[string]string) error {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	for i := range fs.state.Environments {
		if fs.state.Environments[i].ID == id {
			fs.state.Environments[i].Name = name
			fs.state.Environments[i].Variables = variables
			fs.save()
			return nil
		}
	}
	return fmt.Errorf("environment not found")
}

func (fs *FileStore) DeleteEnvironment(id string) error {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	for i := range fs.state.Environments {
		if fs.state.Environments[i].ID == id {
			fs.state.Environments = append(fs.state.Environments[:i], fs.state.Environments[i+1:]...)
			fs.save()
			return nil
		}
	}
	return fmt.Errorf("environment not found")
}

func (fs *FileStore) SetSetting(key, value string) {
	fs.mu.Lock()
	defer fs.mu.Unlock()
	switch key {
	case "active_env_id":
		fs.state.ActiveEnvID = value
	}
	fs.save()
}

func (fs *FileStore) GetSetting(key string) string {
	fs.mu.RLock()
	defer fs.mu.RUnlock()
	switch key {
	case "active_env_id":
		return fs.state.ActiveEnvID
	}
	return ""
}

func genID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
