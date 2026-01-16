package users

import "errors"

type User struct {
	ID           string
	Email        string
	PasswordHash string
}

var ErrNotFound = errors.New("user not found")
var ErrEmailTaken = errors.New("email already registered")

type Store interface {
	Create(email, passwordHash string) (User, error)
	FindByEmail(email string) (User, error)
}
