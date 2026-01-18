package preferences

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
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  prefs JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`)
	return err
}

func (s *PostgresStore) Get(userID string) (UserPreferences, error) {
	ctx := context.Background()
	var payload []byte
	err := s.pool.QueryRow(ctx,
		`SELECT prefs FROM user_preferences WHERE user_id=$1`,
		userID,
	).Scan(&payload)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return DefaultUserPreferences(), nil
		}
		return UserPreferences{}, err
	}
	var prefs UserPreferences
	if err := json.Unmarshal(payload, &prefs); err != nil {
		return UserPreferences{}, err
	}
	return prefs, nil
}

func (s *PostgresStore) Save(userID string, prefs UserPreferences) (UserPreferences, error) {
	ctx := context.Background()
	payload, err := json.Marshal(prefs)
	if err != nil {
		return UserPreferences{}, err
	}
	_, err = s.pool.Exec(ctx, `
INSERT INTO user_preferences (user_id, prefs)
VALUES ($1, $2)
ON CONFLICT (user_id)
DO UPDATE SET prefs = EXCLUDED.prefs, updated_at = NOW();`,
		userID, payload,
	)
	if err != nil {
		return UserPreferences{}, err
	}
	return prefs, nil
}
