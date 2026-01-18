package users

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresStore struct {
	pool *pgxpool.Pool
}

func NewPostgresStore(ctx context.Context, dsn string) (*PostgresStore, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return &PostgresStore{pool: pool}, nil
}

func (s *PostgresStore) Close() {
	s.pool.Close()
}

func (s *PostgresStore) Pool() *pgxpool.Pool {
	return s.pool
}

func (s *PostgresStore) EnsureSchema(ctx context.Context) error {
	_, err := s.pool.Exec(ctx, `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
`)
	return err
}

func (s *PostgresStore) Create(email, passwordHash string) (User, error) {
	ctx := context.Background()
	id := newUserID()
	var user User
	err := s.pool.QueryRow(ctx,
		`INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)
         RETURNING id, email, password_hash`,
		id, email, passwordHash,
	).Scan(&user.ID, &user.Email, &user.PasswordHash)
	if err != nil {
		if isDuplicate(err) {
			return User{}, ErrEmailTaken
		}
		return User{}, err
	}
	return user, nil
}

func (s *PostgresStore) FindByEmail(email string) (User, error) {
	ctx := context.Background()
	var user User
	err := s.pool.QueryRow(ctx,
		`SELECT id, email, password_hash FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, ErrNotFound
		}
		return User{}, err
	}
	return user, nil
}

func isDuplicate(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}

func newUserID() string {
	buf := make([]byte, 8)
	_, _ = rand.Read(buf)
	return "u-" + hex.EncodeToString(buf)
}
