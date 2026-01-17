package webdav

import (
	"bytes"
	"encoding/xml"
	"errors"
	"io"
	"net/http"
	"net/url"
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
	baseHost := base.Scheme + "://" + base.Host
	selfPath := strings.TrimRight(base.Path, "/") + "/"
	var result listResult
	for _, entry := range entries {
		resolved := resolveHref(base, entry.Href)
		if resolved == "" {
			continue
		}
		resolvedPath := resolved
		if strings.HasPrefix(resolved, "http://") || strings.HasPrefix(resolved, "https://") {
			if parsed, err := url.Parse(resolved); err == nil {
				resolvedPath = parsed.Path
			}
		}
		if strings.TrimRight(resolvedPath, "/")+"/" == selfPath {
			continue
		}
		if entry.IsDir || strings.HasSuffix(resolvedPath, "/") {
			result.dirs = append(result.dirs, baseHost+ensureTrailingSlash(resolvedPath))
			continue
		}
		result.files = append(result.files, Entry{
			Path:    resolvedPath,
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
