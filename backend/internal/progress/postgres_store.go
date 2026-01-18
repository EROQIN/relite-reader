package progress

import (
	"context"
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
CREATE TABLE IF NOT EXISTS reading_progress (
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  location DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, book_id)
);`)
	return err
}

func (s *PostgresStore) Get(userID, bookID string) (Progress, error) {
	ctx := context.Background()
	var progress Progress
	err := s.pool.QueryRow(ctx,
		`SELECT book_id, location, updated_at FROM reading_progress WHERE user_id=$1 AND book_id=$2`,
		userID, bookID,
	).Scan(&progress.BookID, &progress.Location, &progress.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Progress{BookID: bookID, Location: 0, UpdatedAt: time.Time{}}, nil
		}
		return Progress{}, err
	}
	return progress, nil
}

func (s *PostgresStore) Save(userID, bookID string, location float64) (Progress, error) {
	ctx := context.Background()
	location = normalizeLocation(location)
	var progress Progress
	err := s.pool.QueryRow(ctx,
		`INSERT INTO reading_progress (user_id, book_id, location)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, book_id)
         DO UPDATE SET location = EXCLUDED.location, updated_at = NOW()
         RETURNING book_id, location, updated_at`,
		userID, bookID, location,
	).Scan(&progress.BookID, &progress.Location, &progress.UpdatedAt)
	if err != nil {
		return Progress{}, err
	}
	return progress, nil
}
