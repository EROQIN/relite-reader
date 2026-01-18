package webdav

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

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
CREATE TABLE IF NOT EXISTS webdav_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  base_url TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_secret BYTEA NOT NULL,
  last_sync_status TEXT NOT NULL DEFAULT 'never',
  last_error TEXT NOT NULL DEFAULT '',
  last_sync_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_webdav_user_id ON webdav_connections (user_id);
`)
	return err
}

func (s *PostgresStore) Create(userID string, conn Connection) (Connection, error) {
	ctx := context.Background()
	if conn.ID == "" {
		conn.ID = newConnectionID()
	}
	conn.UserID = userID
	err := s.pool.QueryRow(ctx, `
INSERT INTO webdav_connections (id, user_id, base_url, username, encrypted_secret, last_sync_status, last_error, last_sync_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, user_id, base_url, username, encrypted_secret, last_sync_status, last_error, last_sync_at;`,
		conn.ID, conn.UserID, conn.BaseURL, conn.Username, conn.EncryptedSecret, conn.LastSyncStatus, conn.LastError, conn.LastSyncAt,
	).Scan(&conn.ID, &conn.UserID, &conn.BaseURL, &conn.Username, &conn.EncryptedSecret, &conn.LastSyncStatus, &conn.LastError, &conn.LastSyncAt)
	if err != nil {
		return Connection{}, err
	}
	return conn, nil
}

func (s *PostgresStore) ListByUser(userID string) ([]Connection, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
SELECT id, user_id, base_url, username, encrypted_secret, last_sync_status, last_error, last_sync_at
FROM webdav_connections
WHERE user_id = $1
ORDER BY base_url;`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Connection
	for rows.Next() {
		var conn Connection
		if err := rows.Scan(&conn.ID, &conn.UserID, &conn.BaseURL, &conn.Username, &conn.EncryptedSecret, &conn.LastSyncStatus, &conn.LastError, &conn.LastSyncAt); err != nil {
			return nil, err
		}
		out = append(out, conn)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *PostgresStore) ListAll() ([]Connection, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
SELECT id, user_id, base_url, username, encrypted_secret, last_sync_status, last_error, last_sync_at
FROM webdav_connections;`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Connection
	for rows.Next() {
		var conn Connection
		if err := rows.Scan(&conn.ID, &conn.UserID, &conn.BaseURL, &conn.Username, &conn.EncryptedSecret, &conn.LastSyncStatus, &conn.LastError, &conn.LastSyncAt); err != nil {
			return nil, err
		}
		out = append(out, conn)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *PostgresStore) GetByID(userID, id string) (Connection, error) {
	ctx := context.Background()
	var conn Connection
	err := s.pool.QueryRow(ctx, `
SELECT id, user_id, base_url, username, encrypted_secret, last_sync_status, last_error, last_sync_at
FROM webdav_connections
WHERE user_id = $1 AND id = $2;`,
		userID, id,
	).Scan(&conn.ID, &conn.UserID, &conn.BaseURL, &conn.Username, &conn.EncryptedSecret, &conn.LastSyncStatus, &conn.LastError, &conn.LastSyncAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Connection{}, ErrNotFound
		}
		return Connection{}, err
	}
	return conn, nil
}

func (s *PostgresStore) Update(userID string, conn Connection) (Connection, error) {
	ctx := context.Background()
	ct, err := s.pool.Exec(ctx, `
UPDATE webdav_connections
SET base_url = $1,
    username = $2,
    encrypted_secret = $3,
    last_sync_status = $4,
    last_error = $5,
    last_sync_at = $6
WHERE user_id = $7 AND id = $8;`,
		conn.BaseURL, conn.Username, conn.EncryptedSecret, conn.LastSyncStatus, conn.LastError, conn.LastSyncAt, userID, conn.ID,
	)
	if err != nil {
		return Connection{}, err
	}
	if ct.RowsAffected() == 0 {
		return Connection{}, ErrNotFound
	}
	return conn, nil
}

func (s *PostgresStore) Delete(userID, id string) error {
	ctx := context.Background()
	ct, err := s.pool.Exec(ctx, `DELETE FROM webdav_connections WHERE user_id = $1 AND id = $2;`, userID, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *PostgresStore) UpdateSyncStatus(userID, id, status, lastError string) (Connection, error) {
	ctx := context.Background()
	var conn Connection
	err := s.pool.QueryRow(ctx, `
UPDATE webdav_connections
SET last_sync_status = $1,
    last_error = $2,
    last_sync_at = $3
WHERE user_id = $4 AND id = $5
RETURNING id, user_id, base_url, username, encrypted_secret, last_sync_status, last_error, last_sync_at;`,
		status, lastError, time.Now().UTC(), userID, id,
	).Scan(&conn.ID, &conn.UserID, &conn.BaseURL, &conn.Username, &conn.EncryptedSecret, &conn.LastSyncStatus, &conn.LastError, &conn.LastSyncAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Connection{}, ErrNotFound
		}
		return Connection{}, err
	}
	return conn, nil
}

func newConnectionID() string {
	buf := make([]byte, 16)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}
