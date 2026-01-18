package books

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
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL,
  source_path TEXT NOT NULL,
  connection_id TEXT NOT NULL DEFAULT '',
  missing BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, source_path)
);
ALTER TABLE books ADD COLUMN IF NOT EXISTS connection_id TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books (user_id);
`)
	return err
}

func (s *PostgresStore) Upsert(userID string, book Book) (Book, error) {
	ctx := context.Background()
	if book.ID == "" {
		book.ID = newBookID()
	}
	book.UserID = userID
	book.Missing = false
	book.UpdatedAt = time.Now().UTC()
	err := s.pool.QueryRow(ctx, `
INSERT INTO books (id, user_id, title, author, format, source_path, connection_id, missing, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (user_id, source_path)
DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  format = EXCLUDED.format,
  connection_id = EXCLUDED.connection_id,
  missing = EXCLUDED.missing,
  updated_at = EXCLUDED.updated_at
RETURNING id, user_id, title, author, format, source_path, connection_id, missing, updated_at;`,
		book.ID, book.UserID, book.Title, book.Author, book.Format, book.SourcePath, book.ConnectionID, book.Missing, book.UpdatedAt,
	).Scan(&book.ID, &book.UserID, &book.Title, &book.Author, &book.Format, &book.SourcePath, &book.ConnectionID, &book.Missing, &book.UpdatedAt)
	if err != nil {
		return Book{}, err
	}
	return book, nil
}

func (s *PostgresStore) ListByUser(userID string) ([]Book, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
SELECT id, user_id, title, author, format, source_path, connection_id, missing, updated_at
FROM books
WHERE user_id = $1
ORDER BY updated_at DESC;`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Book
	for rows.Next() {
		var book Book
		if err := rows.Scan(&book.ID, &book.UserID, &book.Title, &book.Author, &book.Format, &book.SourcePath, &book.ConnectionID, &book.Missing, &book.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, book)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *PostgresStore) GetBySourcePath(userID, sourcePath string) (Book, error) {
	ctx := context.Background()
	var book Book
	err := s.pool.QueryRow(ctx, `
SELECT id, user_id, title, author, format, source_path, connection_id, missing, updated_at
FROM books
WHERE user_id = $1 AND source_path = $2;`,
		userID, sourcePath,
	).Scan(&book.ID, &book.UserID, &book.Title, &book.Author, &book.Format, &book.SourcePath, &book.ConnectionID, &book.Missing, &book.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Book{}, ErrNotFound
		}
		return Book{}, err
	}
	return book, nil
}

func (s *PostgresStore) GetByID(userID, id string) (Book, error) {
	ctx := context.Background()
	var book Book
	err := s.pool.QueryRow(ctx, `
SELECT id, user_id, title, author, format, source_path, connection_id, missing, updated_at
FROM books
WHERE user_id = $1 AND id = $2;`,
		userID, id,
	).Scan(&book.ID, &book.UserID, &book.Title, &book.Author, &book.Format, &book.SourcePath, &book.ConnectionID, &book.Missing, &book.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Book{}, ErrNotFound
		}
		return Book{}, err
	}
	return book, nil
}

func (s *PostgresStore) MarkMissing(userID string, missing []string) error {
	ctx := context.Background()
	for _, path := range missing {
		ct, err := s.pool.Exec(ctx, `
UPDATE books
SET missing = TRUE, updated_at = $1
WHERE user_id = $2 AND source_path = $3;`,
			time.Now().UTC(), userID, path,
		)
		if err != nil {
			return err
		}
		if ct.RowsAffected() == 0 {
			continue
		}
	}
	return nil
}

func newBookID() string {
	buf := make([]byte, 8)
	_, _ = rand.Read(buf)
	return "b-" + hex.EncodeToString(buf)
}
