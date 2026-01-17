package tasks

import (
	"fmt"
	"math/rand"
	"time"
)

type Task struct {
	ID        string            `json:"id"`
	UserID    string            `json:"user_id"`
	Type      string            `json:"type"`
	Status    string            `json:"status"`
	Error     string            `json:"error"`
	Payload   map[string]string `json:"payload"`
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`
}

const (
	StatusQueued  = "queued"
	StatusRunning = "running"
	StatusSuccess = "success"
	StatusError   = "error"
)

func newTaskID() string {
	return fmt.Sprintf("t-%d-%04d", time.Now().UnixNano(), rand.Intn(10000))
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
