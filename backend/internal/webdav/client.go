package webdav

import (
	"errors"
	"io"
	"time"
)

type Entry struct {
	Path    string
	Size    int64
	ModTime time.Time
}

type Client interface {
	List(baseURL, username, secret string) ([]Entry, error)
	Fetch(baseURL, username, secret, path string) (io.ReadCloser, string, error)
}

type NoopClient struct{}

func (NoopClient) List(_, _, _ string) ([]Entry, error) { return nil, nil }

func (NoopClient) Fetch(_, _, _, _ string) (io.ReadCloser, string, error) {
	return nil, "", errors.New("fetch not implemented")
}
