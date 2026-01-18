package tasks

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresStore struct {
	pool *pgxpool.Pool
}

func NewPostgresStore(pool *pgxpool.Pool) *PostgresStore {
	return &PostgresStore{pool: pool}
}

func (s *PostgresStore) EnsureSchema(ctx context.Context) error {
	_, err := s.pool.Exec(ctx, `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
`)
	return err
}

func (s *PostgresStore) Create(task Task) (Task, error) {
	ctx := context.Background()
	if task.ID == "" {
		task.ID = newTaskID()
	}
	payload, err := encodePayload(task.Payload)
	if err != nil {
		return Task{}, err
	}
	var payloadRaw []byte
	err = s.pool.QueryRow(ctx, `
INSERT INTO tasks (id, user_id, type, status, error, payload)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, user_id, type, status, error, payload, created_at, updated_at;`,
		task.ID, task.UserID, task.Type, task.Status, task.Error, payload,
	).Scan(&task.ID, &task.UserID, &task.Type, &task.Status, &task.Error, &payloadRaw, &task.CreatedAt, &task.UpdatedAt)
	if err != nil {
		return Task{}, err
	}
	decoded, err := decodePayload(payloadRaw)
	if err != nil {
		return Task{}, err
	}
	task.Payload = decoded
	return task, nil
}

func (s *PostgresStore) Update(task Task) error {
	ctx := context.Background()
	payload, err := encodePayload(task.Payload)
	if err != nil {
		return err
	}
	ct, err := s.pool.Exec(ctx, `
UPDATE tasks
SET status = $1,
    error = $2,
    payload = $3,
    updated_at = NOW()
WHERE id = $4 AND user_id = $5;`,
		task.Status, task.Error, payload, task.ID, task.UserID,
	)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *PostgresStore) Get(userID, id string) (Task, error) {
	ctx := context.Background()
	var payloadRaw []byte
	var task Task
	err := s.pool.QueryRow(ctx, `
SELECT id, user_id, type, status, error, payload, created_at, updated_at
FROM tasks
WHERE user_id = $1 AND id = $2;`,
		userID, id,
	).Scan(&task.ID, &task.UserID, &task.Type, &task.Status, &task.Error, &payloadRaw, &task.CreatedAt, &task.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Task{}, ErrNotFound
		}
		return Task{}, err
	}
	decoded, err := decodePayload(payloadRaw)
	if err != nil {
		return Task{}, err
	}
	task.Payload = decoded
	return task, nil
}

func (s *PostgresStore) ListByUser(userID string) ([]Task, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
SELECT id, user_id, type, status, error, payload, created_at, updated_at
FROM tasks
WHERE user_id = $1
ORDER BY created_at DESC;`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Task
	for rows.Next() {
		var payloadRaw []byte
		var task Task
		if err := rows.Scan(&task.ID, &task.UserID, &task.Type, &task.Status, &task.Error, &payloadRaw, &task.CreatedAt, &task.UpdatedAt); err != nil {
			return nil, err
		}
		decoded, err := decodePayload(payloadRaw)
		if err != nil {
			return nil, err
		}
		task.Payload = decoded
		out = append(out, task)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func encodePayload(payload map[string]string) ([]byte, error) {
	if payload == nil {
		payload = map[string]string{}
	}
	return json.Marshal(payload)
}

func decodePayload(payload []byte) (map[string]string, error) {
	if len(payload) == 0 {
		return map[string]string{}, nil
	}
	var decoded map[string]string
	if err := json.Unmarshal(payload, &decoded); err != nil {
		return nil, err
	}
	if decoded == nil {
		return map[string]string{}, nil
	}
	return decoded, nil
}
