package webdav

import "time"

type Entry struct {
	Path    string
	Size    int64
	ModTime time.Time
}

type Client interface {
	List(baseURL, username, secret string) ([]Entry, error)
}

type NoopClient struct{}

func (NoopClient) List(_, _, _ string) ([]Entry, error) { return nil, nil }
