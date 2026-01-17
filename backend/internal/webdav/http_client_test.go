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
