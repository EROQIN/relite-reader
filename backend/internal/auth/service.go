package auth

import "github.com/EROQIN/relite-reader/backend/internal/users"

type Service struct {
	store users.Store
}

func NewService(store users.Store) *Service {
	return &Service{store: store}
}

func (s *Service) Register(email, password string) (users.User, error) {
	hash, err := HashPassword(password)
	if err != nil {
		return users.User{}, err
	}
	return s.store.Create(email, hash)
}

func (s *Service) Login(email, password string) (users.User, error) {
	user, err := s.store.FindByEmail(email)
	if err != nil {
		return users.User{}, err
	}
	if !CheckPassword(user.PasswordHash, password) {
		return users.User{}, users.ErrNotFound
	}
	return user, nil
}
