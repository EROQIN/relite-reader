package webdav

import (
	"context"
	"time"
)

type Syncer interface {
	SyncAll() error
}

type Scheduler struct {
	syncer Syncer
	tick   <-chan time.Time
}

func NewScheduler(syncer Syncer, tick <-chan time.Time) *Scheduler {
	return &Scheduler{syncer: syncer, tick: tick}
}

func (s *Scheduler) Start(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case <-s.tick:
			_ = s.syncer.SyncAll()
		}
	}
}
