package webdav

type Client interface {
	List(baseURL, username, secret string) error
}

type NoopClient struct{}

func (NoopClient) List(_, _, _ string) error { return nil }
