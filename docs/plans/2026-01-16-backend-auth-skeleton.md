# Backend Auth Skeleton Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a minimal Go backend skeleton with health endpoint and email/password auth using JWT, backed by an in-memory user store for tests.

**Architecture:** Single Go module under `backend/` with HTTP router, handlers, auth helpers, and a small user service. HTTP handlers depend on an interface-backed store so later we can swap in Postgres. JWT and password hashing live in `internal/auth`.

**Tech Stack:** Go 1.22, net/http, bcrypt, JWT v5, testing/httptest.

### Task 1: Initialize Go module and health endpoint

**Files:**
- Create: `backend/go.mod`
- Create: `backend/internal/http/router_test.go`
- Create: `backend/internal/http/router.go`
- Create: `backend/internal/http/handlers/health.go`
- Create: `backend/cmd/server/main.go`

**Step 1: Create failing test for health route**

```go
package http

import (
  "net/http"
  "net/http/httptest"
  "testing"
)

func TestHealthRoute(t *testing.T) {
  router := NewRouter()
  req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
  resp := httptest.NewRecorder()

  router.ServeHTTP(resp, req)

  if resp.Code != http.StatusOK {
    t.Fatalf("expected 200, got %d", resp.Code)
  }
  if got := resp.Body.String(); got == "" {
    t.Fatalf("expected body, got empty")
  }
}
```

**Step 2: Run test to verify it fails**

Run: `cd backend && go test ./internal/http -run TestHealthRoute`
Expected: FAIL due to missing `NewRouter`.

**Step 3: Implement router + health handler**

```go
package http

import (
  "net/http"
  "github.com/EROQIN/relite-reader/backend/internal/http/handlers"
)

func NewRouter() http.Handler {
  mux := http.NewServeMux()
  mux.HandleFunc("/api/health", handlers.Health)
  return mux
}
```

```go
package handlers

import (
  "encoding/json"
  "net/http"
)

func Health(w http.ResponseWriter, _ *http.Request) {
  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
```

**Step 4: Run test to verify it passes**

Run: `cd backend && go test ./internal/http -run TestHealthRoute`
Expected: PASS.

**Step 5: Add minimal server entrypoint**

```go
package main

import (
  "log"
  "net/http"
  apphttp "github.com/EROQIN/relite-reader/backend/internal/http"
)

func main() {
  srv := &http.Server{
    Addr: ":8080",
    Handler: apphttp.NewRouter(),
  }
  log.Fatal(srv.ListenAndServe())
}
```

**Step 6: Commit**

```bash
git add backend/go.mod backend/internal/http/router_test.go backend/internal/http/router.go backend/internal/http/handlers/health.go backend/cmd/server/main.go
git commit -m "feat: add backend module and health route"
```

### Task 2: Add password hashing helpers

**Files:**
- Create: `backend/internal/auth/password.go`
- Create: `backend/internal/auth/password_test.go`

**Step 1: Write failing test**

```go
package auth

import "testing"

func TestPasswordHashAndCheck(t *testing.T) {
  hash, err := HashPassword("secret123")
  if err != nil {
    t.Fatalf("unexpected err: %v", err)
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

Run: `cd backend && go test ./internal/auth -run TestPasswordHashAndCheck`
Expected: FAIL due to missing functions.

**Step 3: Implement helpers**

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

**Step 4: Run test to verify it passes**

Run: `cd backend && go test ./internal/auth -run TestPasswordHashAndCheck`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/internal/auth/password.go backend/internal/auth/password_test.go
git commit -m "feat: add password hashing helpers"
```

### Task 3: Add JWT helper

**Files:**
- Create: `backend/internal/auth/jwt.go`
- Create: `backend/internal/auth/jwt_test.go`

**Step 1: Write failing test**

```go
package auth

import "testing"

func TestJWTEncodeDecode(t *testing.T) {
  secret := []byte("test-secret")
  token, err := NewToken(secret, "user-123")
  if err != nil {
    t.Fatalf("unexpected err: %v", err)
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

Run: `cd backend && go test ./internal/auth -run TestJWTEncodeDecode`
Expected: FAIL due to missing functions.

**Step 3: Implement helpers**

```go
package auth

import (
  "time"
  "github.com/golang-jwt/jwt/v5"
)

func NewToken(secret []byte, subject string) (string, error) {
  claims := jwt.RegisteredClaims{
    Subject: subject,
    IssuedAt: jwt.NewNumericDate(time.Now()),
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

**Step 4: Run test to verify it passes**

Run: `cd backend && go test ./internal/auth -run TestJWTEncodeDecode`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/internal/auth/jwt.go backend/internal/auth/jwt_test.go
git commit -m "feat: add jwt helpers"
```

### Task 4: Add in-memory user store + auth service

**Files:**
- Create: `backend/internal/users/store.go`
- Create: `backend/internal/users/memory_store.go`
- Create: `backend/internal/auth/service.go`
- Create: `backend/internal/auth/service_test.go`

**Step 1: Write failing test**

```go
package auth

import (
  "testing"
  "github.com/EROQIN/relite-reader/backend/internal/users"
)

func TestRegisterAndLogin(t *testing.T) {
  store := users.NewMemoryStore()
  svc := NewService(store)

  user, err := svc.Register("reader@example.com", "secret123")
  if err != nil {
    t.Fatalf("unexpected err: %v", err)
  }

  _, err = svc.Login("reader@example.com", "secret123")
  if err != nil {
    t.Fatalf("unexpected login err: %v", err)
  }

  if user.Email != "reader@example.com" {
    t.Fatalf("unexpected email: %s", user.Email)
  }
}
```

**Step 2: Run test to verify it fails**

Run: `cd backend && go test ./internal/auth -run TestRegisterAndLogin`
Expected: FAIL due to missing store/service.

**Step 3: Implement store + service**

```go
package users

import "errors"

type User struct {
  ID string
  Email string
  PasswordHash string
}

var ErrNotFound = errors.New("user not found")
var ErrEmailTaken = errors.New("email already registered")

type Store interface {
  Create(email, passwordHash string) (User, error)
  FindByEmail(email string) (User, error)
}
```

```go
package users

import (
  "fmt"
  "sync"
)

type MemoryStore struct {
  mu sync.RWMutex
  users map[string]User
  nextID int
}

func NewMemoryStore() *MemoryStore {
  return &MemoryStore{users: make(map[string]User)}
}

func (s *MemoryStore) Create(email, passwordHash string) (User, error) {
  s.mu.Lock()
  defer s.mu.Unlock()
  if _, exists := s.users[email]; exists {
    return User{}, ErrEmailTaken
  }
  s.nextID++
  user := User{ID: fmt.Sprintf("u-%d", s.nextID), Email: email, PasswordHash: passwordHash}
  s.users[email] = user
  return user, nil
}

func (s *MemoryStore) FindByEmail(email string) (User, error) {
  s.mu.RLock()
  defer s.mu.RUnlock()
  user, ok := s.users[email]
  if !ok {
    return User{}, ErrNotFound
  }
  return user, nil
}
```

```go
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
```

**Step 4: Run test to verify it passes**

Run: `cd backend && go test ./internal/auth -run TestRegisterAndLogin`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/internal/users/store.go backend/internal/users/memory_store.go backend/internal/auth/service.go backend/internal/auth/service_test.go
git commit -m "feat: add in-memory user store and auth service"
```

### Task 5: Add auth HTTP handlers

**Files:**
- Create: `backend/internal/http/handlers/auth.go`
- Create: `backend/internal/http/handlers/auth_test.go`
- Modify: `backend/internal/http/router.go`

**Step 1: Write failing test**

```go
package handlers

import (
  "bytes"
  "encoding/json"
  "net/http"
  "net/http/httptest"
  "testing"

  apphttp "github.com/EROQIN/relite-reader/backend/internal/http"
  "github.com/EROQIN/relite-reader/backend/internal/auth"
  "github.com/EROQIN/relite-reader/backend/internal/users"
)

func TestRegisterAndLoginHandlers(t *testing.T) {
  store := users.NewMemoryStore()
  svc := auth.NewService(store)
  router := apphttp.NewRouterWithAuth(svc, []byte("test-secret"))

  payload := map[string]string{"email": "reader@example.com", "password": "secret123"}
  body, _ := json.Marshal(payload)

  regReq := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(body))
  regReq.Header.Set("Content-Type", "application/json")
  regResp := httptest.NewRecorder()
  router.ServeHTTP(regResp, regReq)
  if regResp.Code != http.StatusCreated {
    t.Fatalf("expected 201, got %d", regResp.Code)
  }

  loginReq := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(body))
  loginReq.Header.Set("Content-Type", "application/json")
  loginResp := httptest.NewRecorder()
  router.ServeHTTP(loginResp, loginReq)
  if loginResp.Code != http.StatusOK {
    t.Fatalf("expected 200, got %d", loginResp.Code)
  }
}
```

**Step 2: Run test to verify it fails**

Run: `cd backend && go test ./internal/http/handlers -run TestRegisterAndLoginHandlers`
Expected: FAIL due to missing router/handlers.

**Step 3: Implement handlers and router wiring**

```go
package handlers

import (
  "encoding/json"
  "net/http"
  "github.com/EROQIN/relite-reader/backend/internal/auth"
)

type AuthHandler struct {
  svc *auth.Service
  secret []byte
}

type authRequest struct {
  Email string `json:"email"`
  Password string `json:"password"`
}

type authResponse struct {
  Token string `json:"token"`
}

func NewAuthHandler(svc *auth.Service, secret []byte) *AuthHandler {
  return &AuthHandler{svc: svc, secret: secret}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
  var req authRequest
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    http.Error(w, "invalid payload", http.StatusBadRequest)
    return
  }
  user, err := h.svc.Register(req.Email, req.Password)
  if err != nil {
    http.Error(w, "registration failed", http.StatusBadRequest)
    return
  }
  token, err := auth.NewToken(h.secret, user.ID)
  if err != nil {
    http.Error(w, "token error", http.StatusInternalServerError)
    return
  }
  w.Header().Set("Content-Type", "application/json")
  w.WriteHeader(http.StatusCreated)
  json.NewEncoder(w).Encode(authResponse{Token: token})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
  var req authRequest
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    http.Error(w, "invalid payload", http.StatusBadRequest)
    return
  }
  user, err := h.svc.Login(req.Email, req.Password)
  if err != nil {
    http.Error(w, "invalid credentials", http.StatusUnauthorized)
    return
  }
  token, err := auth.NewToken(h.secret, user.ID)
  if err != nil {
    http.Error(w, "token error", http.StatusInternalServerError)
    return
  }
  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode(authResponse{Token: token})
}
```

```go
package http

import (
  "net/http"
  "github.com/EROQIN/relite-reader/backend/internal/auth"
  "github.com/EROQIN/relite-reader/backend/internal/http/handlers"
)

func NewRouter() http.Handler {
  mux := http.NewServeMux()
  mux.HandleFunc("/api/health", handlers.Health)
  return mux
}

func NewRouterWithAuth(svc *auth.Service, secret []byte) http.Handler {
  mux := http.NewServeMux()
  authHandler := handlers.NewAuthHandler(svc, secret)
  mux.HandleFunc("/api/health", handlers.Health)
  mux.HandleFunc("/api/auth/register", authHandler.Register)
  mux.HandleFunc("/api/auth/login", authHandler.Login)
  return mux
}
```

**Step 4: Run test to verify it passes**

Run: `cd backend && go test ./internal/http/handlers -run TestRegisterAndLoginHandlers`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/internal/http/handlers/auth.go backend/internal/http/handlers/auth_test.go backend/internal/http/router.go
git commit -m "feat: add auth handlers"
```

### Task 6: Full backend test run

**Step 1: Run all tests**

Run: `cd backend && go test ./...`
Expected: PASS.

**Step 2: Commit test note**

```bash
git commit --allow-empty -m "test: verify backend auth skeleton"
```
