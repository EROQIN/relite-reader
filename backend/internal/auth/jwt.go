package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

var errInvalidToken = errors.New("invalid token")

type jwtClaims struct {
	Subject string `json:"sub"`
	Issued  int64  `json:"iat"`
	Expiry  int64  `json:"exp"`
}

func NewToken(secret []byte, subject string) (string, error) {
	headerJSON, err := json.Marshal(map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	})
	if err != nil {
		return "", err
	}
	now := time.Now()
	claimsJSON, err := json.Marshal(jwtClaims{
		Subject: subject,
		Issued:  now.Unix(),
		Expiry:  now.Add(2 * time.Hour).Unix(),
	})
	if err != nil {
		return "", err
	}
	header := base64.RawURLEncoding.EncodeToString(headerJSON)
	payload := base64.RawURLEncoding.EncodeToString(claimsJSON)
	unsigned := header + "." + payload
	signature := signJWT(secret, unsigned)
	return unsigned + "." + signature, nil
}

func ParseTokenSubject(secret []byte, raw string) (string, error) {
	parts := strings.Split(raw, ".")
	if len(parts) != 3 {
		return "", errInvalidToken
	}
	unsigned := parts[0] + "." + parts[1]
	if !verifyJWT(secret, unsigned, parts[2]) {
		return "", errInvalidToken
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", errInvalidToken
	}
	var claims jwtClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return "", errInvalidToken
	}
	if claims.Expiry > 0 && time.Now().Unix() > claims.Expiry {
		return "", errInvalidToken
	}
	if claims.Subject == "" {
		return "", errInvalidToken
	}
	return claims.Subject, nil
}

func signJWT(secret []byte, data string) string {
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(data))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func verifyJWT(secret []byte, data, signature string) bool {
	expected := signJWT(secret, data)
	return hmac.Equal([]byte(expected), []byte(signature))
}
