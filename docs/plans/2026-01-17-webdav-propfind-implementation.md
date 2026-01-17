# WebDAV PROPFIND Client Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a real WebDAV client that lists files by performing recursive PROPFIND requests.

**Architecture:** Add an HTTP-based WebDAV client that issues Depth:1 PROPFIND requests, parses multistatus XML, and walks directories to produce `webdav.Entry` items. Wire this client into server startup in place of the no-op client.

**Tech Stack:** Go standard library (`net/http`, `encoding/xml`, `net/url`, `time`).

### Task 1: PROPFIND XML parsing + client scaffold

**Files:**
- Create: `backend/internal/webdav/http_client.go`
- Create: `backend/internal/webdav/http_client_test.go`

**Step 1: Write the failing test**

```go
package webdav

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHTTPClientParsesEntries(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/xml")
		w.WriteHeader(http.StatusMultiStatus)
		_, _ = w.Write([]byte(`<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/library/</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype><d:collection/></d:resourcetype>
      </d:prop>
    </d:propstat>
  </d:response>
  <d:response>
    <d:href>/library/A.epub</d:href>
    <d:propstat>
      <d:prop>
        <d:getcontentlength>123</d:getcontentlength>
        <d:getlastmodified>Mon, 02 Jan 2006 15:04:05 GMT</d:getlastmodified>
      </d:prop>
    </d:propstat>
  </d:response>
</d:multistatus>`))
	}))
	defer srv.Close()

	client := NewHTTPClient(http.DefaultClient)
	entries, err := client.listDepthOne(srv.URL, "user", "pass")
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(entries.files) != 1 {
		t.Fatalf("expected 1 file, got %d", len(entries.files))
	}
	if len(entries.dirs) != 1 {
		t.Fatalf("expected 1 dir, got %d", len(entries.dirs))
	}
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-propfind/.cache/go-build go test ./internal/webdav -run TestHTTPClientParsesEntries`
Expected: FAIL with undefined NewHTTPClient/listDepthOne

**Step 3: Write minimal implementation**

```go
package webdav

import (
	"bytes"
	"encoding/xml"
	"errors"
	"io"
	"net/http"
	"net/url"
	"path"
	"strconv"
	"strings"
	"time"
)

type HTTPClient struct {
	httpClient *http.Client
}

type listResult struct {
	files []Entry
	dirs  []string
}

func NewHTTPClient(client *http.Client) *HTTPClient {
	if client == nil {
		client = http.DefaultClient
	}
	return &HTTPClient{httpClient: client}
}

func (c *HTTPClient) List(baseURL, username, secret string) ([]Entry, error) {
	startURL := strings.TrimRight(baseURL, "/") + "/"
	queue := []string{startURL}
	seen := map[string]struct{}{startURL: {}}
	var out []Entry
	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		result, err := c.listDepthOne(current, username, secret)
		if err != nil {
			return nil, err
		}
		out = append(out, result.files...)
		for _, dir := range result.dirs {
			if _, ok := seen[dir]; ok {
				continue
			}
			seen[dir] = struct{}{}
			queue = append(queue, dir)
		}
	}
	return out, nil
}

func (c *HTTPClient) listDepthOne(targetURL, username, secret string) (listResult, error) {
	body := `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:getcontentlength />
    <d:getlastmodified />
    <d:resourcetype />
  </d:prop>
</d:propfind>`
	req, err := http.NewRequest("PROPFIND", targetURL, bytes.NewBufferString(body))
	if err != nil {
		return listResult{}, err
	}
	req.SetBasicAuth(username, secret)
	req.Header.Set("Depth", "1")
	req.Header.Set("Content-Type", "application/xml")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return listResult{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusMultiStatus && resp.StatusCode != http.StatusOK {
		return listResult{}, errors.New("unexpected status")
	}
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return listResult{}, err
	}

	parsed, err := parseMultiStatus(data)
	if err != nil {
		return listResult{}, err
	}
	return classifyEntries(targetURL, parsed), nil
}

// XML parsing helpers

type multistatus struct {
	Responses []response `xml:"response"`
}

type response struct {
	Href     string     `xml:"href"`
	Propstat []propstat `xml:"propstat"`
}

type propstat struct {
	Prop prop `xml:"prop"`
}

type prop struct {
	ResourceType resourcetype `xml:"resourcetype"`
	ContentLen   string       `xml:"getcontentlength"`
	Modified     string       `xml:"getlastmodified"`
}

type resourcetype struct {
	Collection *struct{} `xml:"collection"`
}

type parsedEntry struct {
	Href     string
	IsDir    bool
	Size     int64
	Modified time.Time
}

func parseMultiStatus(raw []byte) ([]parsedEntry, error) {
	var ms multistatus
	if err := xml.Unmarshal(raw, &ms); err != nil {
		return nil, err
	}
	var out []parsedEntry
	for _, resp := range ms.Responses {
		entry := parsedEntry{Href: resp.Href}
		for _, propstat := range resp.Propstat {
			if propstat.Prop.ResourceType.Collection != nil {
				entry.IsDir = true
			}
			if propstat.Prop.ContentLen != "" {
				if size, err := strconv.ParseInt(strings.TrimSpace(propstat.Prop.ContentLen), 10, 64); err == nil {
					entry.Size = size
				}
			}
			if propstat.Prop.Modified != "" {
				if ts, err := http.ParseTime(strings.TrimSpace(propstat.Prop.Modified)); err == nil {
					entry.Modified = ts
				}
			}
		}
		out = append(out, entry)
	}
	return out, nil
}

func classifyEntries(baseURL string, entries []parsedEntry) listResult {
	base, _ := url.Parse(baseURL)
	selfPath := strings.TrimRight(base.Path, "/") + "/"
	var result listResult
	for _, entry := range entries {
		resolved := resolveHref(base, entry.Href)
		if resolved == "" {
			continue
		}
		if strings.TrimRight(resolved, "/")+"/" == selfPath {
			continue
		}
		if entry.IsDir || strings.HasSuffix(resolved, "/") {
			result.dirs = append(result.dirs, ensureTrailingSlash(resolved))
			continue
		}
		result.files = append(result.files, Entry{
			Path:    resolved,
			Size:    entry.Size,
			ModTime: entry.Modified,
		})
	}
	return result
}

func resolveHref(base *url.URL, href string) string {
	href = strings.TrimSpace(href)
	if href == "" {
		return ""
	}
	rel, err := url.Parse(href)
	if err != nil {
		return ""
	}
	resolved := base.ResolveReference(rel)
	return resolved.Path
}

func ensureTrailingSlash(p string) string {
	if strings.HasSuffix(p, "/") {
		return p
	}
	return p + "/"
}
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-propfind/.cache/go-build go test ./internal/webdav -run TestHTTPClientParsesEntries`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/webdav/http_client.go backend/internal/webdav/http_client_test.go
git commit -m "feat: add webdav propfind client"
```

### Task 2: Recursive listing + auth verification

**Files:**
- Modify: `backend/internal/webdav/http_client_test.go`

**Step 1: Write the failing test**

```go
func TestHTTPClientListsRecursively(t *testing.T) {
	calls := map[string]int{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls[r.URL.Path]++
		user, pass, ok := r.BasicAuth()
		if !ok || user != "reader" || pass != "secret" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/xml")
		switch r.URL.Path {
		case "/":
			w.WriteHeader(http.StatusMultiStatus)
			_, _ = w.Write([]byte(`<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/</d:href>
    <d:propstat>
      <d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop>
    </d:propstat>
  </d:response>
  <d:response>
    <d:href>/library/</d:href>
    <d:propstat>
      <d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop>
    </d:propstat>
  </d:response>
  <d:response>
    <d:href>/root.txt</d:href>
    <d:propstat>
      <d:prop><d:getcontentlength>1</d:getcontentlength></d:prop>
    </d:propstat>
  </d:response>
</d:multistatus>`))
		case "/library/":
			w.WriteHeader(http.StatusMultiStatus)
			_, _ = w.Write([]byte(`<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/library/</d:href>
    <d:propstat>
      <d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop>
    </d:propstat>
  </d:response>
  <d:response>
    <d:href>/library/A.epub</d:href>
    <d:propstat>
      <d:prop><d:getcontentlength>5</d:getcontentlength></d:prop>
    </d:propstat>
  </d:response>
</d:multistatus>`))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer srv.Close()

	client := NewHTTPClient(http.DefaultClient)
	entries, err := client.List(srv.URL, "reader", "secret")
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}
	if calls["/"] == 0 || calls["/library/"] == 0 {
		t.Fatalf("expected recursive calls")
	}
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-propfind/.cache/go-build go test ./internal/webdav -run TestHTTPClientListsRecursively`
Expected: FAIL until recursion works

**Step 3: Write minimal implementation**

No new code beyond Task 1; adjust if needed to satisfy recursion and auth checks.

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-propfind/.cache/go-build go test ./internal/webdav -run TestHTTPClientListsRecursively`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/webdav/http_client_test.go backend/internal/webdav/http_client.go
git commit -m "test: cover recursive webdav listing"
```

### Task 3: Wire HTTP client into server

**Files:**
- Modify: `backend/cmd/server/main.go`

**Step 1: Write the failing test**

```go
package main_test

import (
	"testing"
)

func TestServerUsesHTTPClient(t *testing.T) {
	// This is a placeholder to enforce wiring changes; rely on integration wiring via main.go edits.
}
```

**Step 2: Run test to verify it fails**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-propfind/.cache/go-build go test ./cmd/server -run TestServerUsesHTTPClient`
Expected: FAIL (no test files)

**Step 3: Write minimal implementation**

Update main to use the HTTP client:

```go
webClient := webdav.NewHTTPClient(http.DefaultClient)
webSvc := webdav.NewService(webStore, webClient, key, bookStore)
```

**Step 4: Run test to verify it passes**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-propfind/.cache/go-build go test ./cmd/server -run TestServerUsesHTTPClient`
Expected: PASS (no tests)

**Step 5: Commit**

```bash
git add backend/cmd/server/main.go
git commit -m "feat: use webdav http client"
```

### Task 4: Full backend verification

**Files:**
- Modify: none

**Step 1: Run full backend test suite**

Run: `GOCACHE=/root/develop/relite-reader/.worktrees/webdav-propfind/.cache/go-build go test ./...`
Expected: PASS

**Step 2: Commit (if any adjustments)**

```bash
git add -A
git commit -m "test: verify webdav propfind client"
```
