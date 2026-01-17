package tasks

import (
	"context"
)

type HandlerFunc func(context.Context, Task) error

type Queue struct {
	store   Store
	handler HandlerFunc
	ch      chan Task
}

func NewQueue(store Store, handler HandlerFunc, buffer int) *Queue {
	if handler == nil {
		handler = DefaultHandler
	}
	if buffer <= 0 {
		buffer = 100
	}
	return &Queue{store: store, handler: handler, ch: make(chan Task, buffer)}
}

func (q *Queue) Enqueue(userID, taskType string, payload map[string]string) (Task, error) {
	created, err := q.store.Create(Task{
		UserID:  userID,
		Type:    taskType,
		Status:  StatusQueued,
		Payload: payload,
	})
	if err != nil {
		return Task{}, err
	}
	q.ch <- created
	return created, nil
}

func (q *Queue) Start(ctx context.Context) {
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case task := <-q.ch:
				task.Status = StatusRunning
				_ = q.store.Update(task)
				if err := q.handler(ctx, task); err != nil {
					task.Status = StatusError
					task.Error = err.Error()
					_ = q.store.Update(task)
					continue
				}
				task.Status = StatusSuccess
				task.Error = ""
				_ = q.store.Update(task)
			}
		}
	}()
}

func DefaultHandler(_ context.Context, task Task) error {
	if task.Type == "format" {
		return nil
	}
	return nil
}
