package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"strings"
)

const passwordHashVersion = "v1"

func HashPassword(raw string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	sum := sha256.Sum256(append(salt, []byte(raw)...))
	return fmt.Sprintf("%s$%x$%x", passwordHashVersion, salt, sum[:]), nil
}

func CheckPassword(hash, raw string) bool {
	parts := strings.Split(hash, "$")
	if len(parts) != 3 || parts[0] != passwordHashVersion {
		return false
	}
	salt, err := hex.DecodeString(parts[1])
	if err != nil {
		return false
	}
	expected, err := hex.DecodeString(parts[2])
	if err != nil {
		return false
	}
	sum := sha256.Sum256(append(salt, []byte(raw)...))
	return subtle.ConstantTimeCompare(sum[:], expected) == 1
}
