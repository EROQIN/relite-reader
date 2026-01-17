package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/books"
	apphttp "github.com/EROQIN/relite-reader/backend/internal/http"
	"github.com/EROQIN/relite-reader/backend/internal/preferences"
	"github.com/EROQIN/relite-reader/backend/internal/users"
	"github.com/EROQIN/relite-reader/backend/internal/webdav"
)

func main() {
	jwtSecret := []byte(os.Getenv("RELITE_JWT_SECRET"))
	if len(jwtSecret) == 0 {
		log.Fatal("missing RELITE_JWT_SECRET")
	}
	key, err := webdav.ParseKey(os.Getenv("RELITE_WEB_DAV_KEY"))
	if err != nil {
		log.Fatal("invalid RELITE_WEB_DAV_KEY")
	}
	userStore := users.NewMemoryStore()
	authSvc := auth.NewService(userStore)
	bookStore := books.NewMemoryStore()
	prefsStore := preferences.NewMemoryStore()
	if dataDir := os.Getenv("RELITE_DATA_DIR"); dataDir != "" {
		path := filepath.Join(dataDir, "preferences.json")
		if err := preferences.EnsureDir(path); err != nil {
			log.Fatal(err)
		}
		fileStore, err := preferences.NewFileStore(path)
		if err != nil {
			log.Fatal(err)
		}
		prefsStore = fileStore
	}
	webStore := webdav.NewMemoryStore()
	webClient := webdav.NewHTTPClient(http.DefaultClient)
	webSvc := webdav.NewService(webStore, webClient, key, bookStore)
	interval := 20 * time.Minute
	if raw := os.Getenv("RELITE_WEB_DAV_SYNC_INTERVAL"); raw != "" {
		duration, err := time.ParseDuration(raw)
		if err != nil {
			log.Fatal("invalid RELITE_WEB_DAV_SYNC_INTERVAL")
		}
		interval = duration
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go webdav.NewScheduler(webSvc, ticker.C).Start(ctx)
	srv := &http.Server{
		Addr:    ":8080",
		Handler: apphttp.NewRouterWithAuthAndWebDAV(authSvc, jwtSecret, webSvc, bookStore, prefsStore),
	}
	log.Fatal(srv.ListenAndServe())
}
