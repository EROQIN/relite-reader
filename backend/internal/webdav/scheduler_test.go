package webdav

import (
	"context"
	"testing"
	"time"
)

type fakeSyncer struct{ ch chan struct{} }

func (f *fakeSyncer) SyncAll() error {
	f.ch <- struct{}{}
	return nil
}

func TestSchedulerCallsSyncAll(t *testing.T) {
	ch := make(chan time.Time, 1)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	fs := &fakeSyncer{ch: make(chan struct{}, 1)}
	s := NewScheduler(fs, ch)
	go s.Start(ctx)
	ch <- time.Now()
	select {
	case <-fs.ch:
	case <-time.After(100 * time.Millisecond):
		t.Fatalf("expected sync call")
	}
}
