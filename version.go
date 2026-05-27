package main

import (
	_ "embed"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

//go:embed version.txt
var versionFile string

var AppVersion string

const (
	versionCheckURL = "https://raw.githubusercontent.com/floezahs/api-rest-requester/main/version.txt"
	downloadURL     = "https://github.com/floezahs/api-rest-requester/releases/latest/download/api-kit.exe"
)

func init() {
	AppVersion = strings.TrimSpace(versionFile)
	AppVersion = strings.Split(AppVersion, "\n")[0]
}

func compareVersions(a, b string) int {
	partsA := strings.Split(strings.TrimSpace(a), ".")
	partsB := strings.Split(strings.TrimSpace(b), ".")
	maxLen := len(partsA)
	if len(partsB) > maxLen {
		maxLen = len(partsB)
	}
	for i := 0; i < maxLen; i++ {
		var na, nb int
		if i < len(partsA) {
			na, _ = strconv.Atoi(partsA[i])
		}
		if i < len(partsB) {
			nb, _ = strconv.Atoi(partsB[i])
		}
		if na > nb {
			return 1
		}
		if na < nb {
			return -1
		}
	}
	return 0
}

func (a *App) GetVersion() string {
	return AppVersion
}

func (a *App) CheckUpdate() UpdateInfo {
	info := UpdateInfo{
		CurrentVersion: AppVersion,
		DownloadURL:    downloadURL,
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", versionCheckURL, nil)
	if err != nil {
		info.Error = fmt.Sprintf("Failed to check: %v", err)
		return info
	}

	resp, err := client.Do(req)
	if err != nil {
		info.Error = fmt.Sprintf("Could not reach update server: %v", err)
		return info
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		info.Error = fmt.Sprintf("Failed to read response: %v", err)
		return info
	}

	remoteVersion := strings.TrimSpace(string(body))
	remoteVersion = strings.Split(remoteVersion, "\n")[0]
	info.LatestVersion = remoteVersion

	if remoteVersion != "" && compareVersions(remoteVersion, AppVersion) > 0 {
		info.UpdateAvailable = true
	}

	return info
}
