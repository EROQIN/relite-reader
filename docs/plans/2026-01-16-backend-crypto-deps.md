# Backend Crypto Dependencies Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace temporary crypto helpers with bcrypt password hashing and jwt/v5 tokens now that network access is available.

**Architecture:** Keep auth service API the same but swap internal implementations to use `golang.org/x/crypto/bcrypt` and `github.com/golang-jwt/jwt/v5`. Update tests to assert bcrypt prefix and parse tokens using jwt/v5.

**Tech Stack:** Go 1.22, bcrypt, jwt/v5.

### Task 1: Switch password hashing to bcrypt

**Files:**
- Modify: `backend/internal/auth/password_test.go`
- Modify: `backend/internal/auth/password.go`

**Step 1: Write failing test**

```go
package auth

import (
  "strings"
  "testing"
)

func TestPasswordHashAndCheck(t *testing.T) {
  hash, err := HashPassword("secret123")
  if err != nil {
    t.Fatalf("unexpected err: %v", err)
  }
  if !strings.HasPrefix(hash, "$2") {
    t.Fatalf("expected bcrypt hash prefix, got %s", hash)
  }
  if ok := CheckPassword(hash, "secret123"); !ok {
    t.Fatalf("expected password to match")
  }
  if ok := CheckPassword(hash, "wrong"); ok {
    t.Fatalf("expected password mismatch")
  }
}
```

**Step 2: Run test to verify it fails**

Run: `cd backend && GOCACHE=/root/develop/relite-reader/.worktrees/backend-deps/.cache/go-build go test ./internal/auth -run TestPasswordHashAndCheck`
Expected: FAIL because current hash is not bcrypt.

**Step 3: Implement bcrypt hashing**

```go
package auth

import "golang.org/x/crypto/bcrypt"

func HashPassword(raw string) (string, error) {
  hashed, err := bcrypt.GenerateFromPassword([]byte(raw), bcrypt.DefaultCost)
  if err != nil {
    return "", err
  }
  return string(hashed), nil
}

func CheckPassword(hash, raw string) bool {
  return bcrypt.CompareHashAndPassword([]byte(hash), []byte(raw)) == nil
}
```

**Step 4: Fetch dependency**

Run: `cd backend && GOCACHE=/root/develop/relite-reader/.worktrees/backend-deps/.cache/go-build go get golang.org/x/crypto/bcrypt`
Expected: SUCCESS.

**Step 5: Run test to verify it passes**

Run: `cd backend && GOCACHE=/root/develop/relite-reader/.worktrees/backend-deps/.cache/go-build go test ./internal/auth -run TestPasswordHashAndCheck`
Expected: PASS.

**Step 6: Commit**

```bash
git add backend/go.mod backend/go.sum backend/internal/auth/password.go backend/internal/auth/password_test.go
git commit -m "feat: switch password hashing to bcrypt"
```

### Task 2: Switch JWT implementation to jwt/v5

**Files:**
- Modify: `backend/internal/auth/jwt_test.go`
- Modify: `backend/internal/auth/jwt.go`

**Step 1: Write failing test**

```go
package auth

import (
  "testing"

  "github.com/golang-jwt/jwt/v5"
)

func TestJWTEncodeDecode(t *testing.T) {
  secret := []byte("test-secret")
  token, err := NewToken(secret, "user-123")
  if err != nil {
    t.Fatalf("unexpected err: %v", err)
  }

  parsed, err := jwt.ParseWithClaims(token, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
    return secret, nil
  })
  if err != nil || !parsed.Valid {
    t.Fatalf("expected jwt to parse: %v", err)
  }

  subject, err := ParseTokenSubject(secret, token)
  if err != nil {
    t.Fatalf("unexpected err: %v", err)
  }
  if subject != "user-123" {
    t.Fatalf("expected subject user-123, got %s", subject)
  }
}
```

**Step 2: Run test to verify it fails**

Run: `cd backend && GOCACHE=/root/develop/relite-reader/.worktrees/backend-deps/.cache/go-build go test ./internal/auth -run TestJWTEncodeDecode`
Expected: FAIL due to missing jwt/v5 dependency.

**Step 3: Implement jwt/v5 helpers**

```go
package auth

import (
  "time"

  "github.com/golang-jwt/jwt/v5"
)

func NewToken(secret []byte, subject string) (string, error) {
  claims := jwt.RegisteredClaims{
    Subject:   subject,
    IssuedAt:  jwt.NewNumericDate(time.Now()),
    ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Hour)),
  }
  token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
  return token.SignedString(secret)
}

func ParseTokenSubject(secret []byte, raw string) (string, error) {
  parsed, err := jwt.ParseWithClaims(raw, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
    return secret, nil
  })
  if err != nil {
    return "", err
  }
  claims, ok := parsed.Claims.(*jwt.RegisteredClaims)
  if !ok || !parsed.Valid {
    return "", jwt.ErrTokenInvalidClaims
  }
  return claims.Subject, nil
}
```

**Step 4: Fetch dependency**

Run: `cd backend && GOCACHE=/root/develop/relite-reader/.worktrees/backend-deps/.cache/go-build go get github.com/golang-jwt/jwt/v5`
Expected: SUCCESS.

**Step 5: Run test to verify it passes**

Run: `cd backend && GOCACHE=/root/develop/relite-reader/.worktrees/backend-deps/.cache/go-build go test ./internal/auth -run TestJWTEncodeDecode`
Expected: PASS.

**Step 6: Commit**

```bash
git add backend/go.mod backend/go.sum backend/internal/auth/jwt.go backend/internal/auth/jwt_test.go
git commit -m "feat: switch jwt helpers to jwt/v5"
```

### Task 3: Full backend test run

**Step 1: Run all tests**

Run: `cd backend && GOCACHE=/root/develop/relite-reader/.worktrees/backend-deps/.cache/go-build go test ./...`
Expected: PASS.

**Step 2: Commit test note**

```bash
git commit --allow-empty -m "test: verify backend crypto deps"
```
