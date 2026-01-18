package bookmarks

import (
	"context"
	"crypto/rand"
	"encoding/hex"
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
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  label TEXT NOT NULL,
  location DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_book ON bookmarks (user_id, book_id);
`)
	return err
}

func (s *PostgresStore) Create(userID, bookID, label string, location float64) (Bookmark, error) {
	ctx := context.Background()
	id := newBookmarkID()
	var bookmark Bookmark
	err := s.pool.QueryRow(ctx,
		`INSERT INTO bookmarks (id, user_id, book_id, label, location)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, book_id, label, location, created_at`,
		id, userID, bookID, label, location,
	).Scan(&bookmark.ID, &bookmark.UserID, &bookmark.BookID, &bookmark.Label, &bookmark.Location, &bookmark.CreatedAt)
	if err != nil {
		return Bookmark{}, err
	}
	return bookmark, nil
}

func (s *PostgresStore) ListByBook(userID, bookID string) ([]Bookmark, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx,
		`SELECT id, user_id, book_id, label, location, created_at FROM bookmarks
         WHERE user_id = $1 AND book_id = $2 ORDER BY created_at DESC`,
		userID, bookID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Bookmark
	for rows.Next() {
		var item Bookmark
		if err := rows.Scan(&item.ID, &item.UserID, &item.BookID, &item.Label, &item.Location, &item.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func (s *PostgresStore) Delete(userID, bookID, id string) error {
	ctx := context.Background()
	cmd, err := s.pool.Exec(ctx,
		`DELETE FROM bookmarks WHERE id = $1 AND user_id = $2 AND book_id = $3`,
		id, userID, bookID,
	)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func newBookmarkID() string {
	buf := make([]byte, 8)
	_, _ = rand.Read(buf)
	return "bm-" + hex.EncodeToString(buf)
}

func isNoRows(err error) bool {
	return errors.Is(err, pgx.ErrNoRows)
}
