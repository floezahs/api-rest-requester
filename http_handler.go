package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

type HTTPHandler struct {
	ctx context.Context
}

func NewHTTPHandler() *HTTPHandler {
	return &HTTPHandler{}
}

func (h *HTTPHandler) startup(ctx context.Context) {
	h.ctx = ctx
}

func (h *HTTPHandler) SendRequest(config RequestConfig, variables map[string]string) HTTPResponse {
	start := time.Now()
	resp := HTTPResponse{}

	if config.Headers == nil {
		config.Headers = []KeyValue{}
	}
	if config.Params == nil {
		config.Params = []KeyValue{}
	}
	if config.Body.FormData == nil {
		config.Body.FormData = []KeyValue{}
	}

	config.URL = resolveVars(config.URL, variables)
	for i := range config.Headers {
		config.Headers[i].Key = resolveVars(config.Headers[i].Key, variables)
		config.Headers[i].Value = resolveVars(config.Headers[i].Value, variables)
	}
	for i := range config.Params {
		config.Params[i].Key = resolveVars(config.Params[i].Key, variables)
		config.Params[i].Value = resolveVars(config.Params[i].Value, variables)
	}
	config.Body.Content = resolveVars(config.Body.Content, variables)
	for i := range config.Body.FormData {
		config.Body.FormData[i].Key = resolveVars(config.Body.FormData[i].Key, variables)
		config.Body.FormData[i].Value = resolveVars(config.Body.FormData[i].Value, variables)
	}

	unresolved := findUnresolved(config.URL)
	if len(unresolved) > 0 {
		resp.Error = fmt.Sprintf("Unresolved variables in URL: %s", strings.Join(unresolved, ", "))
		resp.TimeMs = time.Since(start).Milliseconds()
		return resp
	}

	fullURL := config.URL
	if len(config.Params) > 0 {
		parsedURL, err := url.Parse(config.URL)
		if err == nil {
			q := parsedURL.Query()
			for _, p := range config.Params {
				if p.Enabled {
					q.Add(p.Key, p.Value)
				}
			}
			parsedURL.RawQuery = q.Encode()
			fullURL = parsedURL.String()
		}
	}

	var bodyReader io.Reader
	switch config.Body.Type {
	case BodyJSON:
		bodyReader = strings.NewReader(config.Body.Content)
	case BodyRaw:
		bodyReader = strings.NewReader(config.Body.Content)
	case BodyFormURLEncoded:
		formData := url.Values{}
		for _, fd := range config.Body.FormData {
			if fd.Enabled {
				formData.Add(fd.Key, fd.Value)
			}
		}
		bodyReader = strings.NewReader(formData.Encode())
	case BodyFormData:
		formData := url.Values{}
		for _, fd := range config.Body.FormData {
			if fd.Enabled {
				formData.Add(fd.Key, fd.Value)
			}
		}
		bodyReader = strings.NewReader(formData.Encode())
	default:
		bodyReader = nil
	}

	req, err := http.NewRequest(string(config.Method), fullURL, bodyReader)
	if err != nil {
		resp.Error = fmt.Sprintf("Error creating request: %v", err)
		resp.TimeMs = time.Since(start).Milliseconds()
		return resp
	}

	for _, hdr := range config.Headers {
		if hdr.Enabled && hdr.Key != "" {
			req.Header.Set(hdr.Key, hdr.Value)
		}
	}

	if config.Body.Type == BodyJSON && req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if config.Body.Type == BodyFormURLEncoded && req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	httpResp, err := client.Do(req)
	if err != nil {
		resp.Error = fmt.Sprintf("Request to %s failed: %v", fullURL, err)
		resp.TimeMs = time.Since(start).Milliseconds()
		return resp
	}
	defer httpResp.Body.Close()

	bodyBytes, err := io.ReadAll(httpResp.Body)
	if err != nil {
		resp.Error = fmt.Sprintf("Error reading response: %v", err)
		resp.TimeMs = time.Since(start).Milliseconds()
		return resp
	}

	resp.StatusCode = httpResp.StatusCode
	resp.Status = httpResp.Status
	resp.Body = string(bodyBytes)
	resp.SizeBytes = int64(len(bodyBytes))
	resp.TimeMs = time.Since(start).Milliseconds()

	resp.Headers = make(map[string]string)
	for k, v := range httpResp.Header {
		resp.Headers[k] = strings.Join(v, ", ")
	}

	return resp
}

var varPattern = regexp.MustCompile(`\{\{[^}]+\}\}`)

func findUnresolved(input string) []string {
	matches := varPattern.FindAllString(input, -1)
	return matches
}

func resolveVars(input string, vars map[string]string) string {
	if len(vars) == 0 {
		return input
	}
	for k, v := range vars {
		placeholder := "{{" + k + "}}"
		input = strings.ReplaceAll(input, placeholder, v)
	}
	return input
}
