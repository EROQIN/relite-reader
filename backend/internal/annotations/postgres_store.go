package annotations

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
CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  location DOUBLE PRECISION NOT NULL,
  quote TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_annotations_user_book ON annotations (user_id, book_id);
`)
	return err
}

func (s *PostgresStore) Create(userID, bookID string, location float64, quote, note, color string) (Annotation, error) {
	ctx := context.Background()
	id := newAnnotationID()
	var item Annotation
	err := s.pool.QueryRow(ctx, `
INSERT INTO annotations (id, user_id, book_id, location, quote, note, color)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, user_id, book_id, location, quote, note, color, created_at;`,
		id, userID, bookID, location, quote, note, color,
	).Scan(&item.ID, &item.UserID, &item.BookID, &item.Location, &item.Quote, &item.Note, &item.Color, &item.CreatedAt)
	if err != nil {
		return Annotation{}, err
	}
	return item, nil
}

func (s *PostgresStore) ListByBook(userID, bookID string) ([]Annotation, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
SELECT id, user_id, book_id, location, quote, note, color, created_at
FROM annotations
WHERE user_id = $1 AND book_id = $2
ORDER BY created_at DESC;`,
		userID, bookID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Annotation
	for rows.Next() {
		var item Annotation
		if err := rows.Scan(&item.ID, &item.UserID, &item.BookID, &item.Location, &item.Quote, &item.Note, &item.Color, &item.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *PostgresStore) Delete(userID, bookID, id string) error {
	ctx := context.Background()
	cmd, err := s.pool.Exec(ctx,
		`DELETE FROM annotations WHERE id = $1 AND user_id = $2 AND book_id = $3`,
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

func newAnnotationID() string {
	buf := make([]byte, 8)
	_, _ = rand.Read(buf)
	return "an-" + hex.EncodeToString(buf)
}

func isNoRows(err error) bool {
	return errors.Is(err, pgx.ErrNoRows)
}
