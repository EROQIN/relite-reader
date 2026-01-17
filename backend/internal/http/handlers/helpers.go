package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
)

func requireUserID(r *http.Request, secret []byte) (string, bool) {
	authorization := r.Header.Get("Authorization")
	if authorization == "" {
		return "", false
	}
	parts := strings.SplitN(authorization, " ", 2)
	if len(parts) != 2 {
		return "", false
	}
	sub, err := auth.ParseTokenSubject(secret, parts[1])
	if err != nil {
		return "", false
	}
	return sub, true
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
