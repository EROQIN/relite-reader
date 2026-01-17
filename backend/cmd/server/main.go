package main

import (
	"log"
	"net/http"
	"os"

	"github.com/EROQIN/relite-reader/backend/internal/auth"
	"github.com/EROQIN/relite-reader/backend/internal/books"
	apphttp "github.com/EROQIN/relite-reader/backend/internal/http"
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
	webStore := webdav.NewMemoryStore()
	webSvc := webdav.NewService(webStore, webdav.NoopClient{}, key, bookStore)
	srv := &http.Server{
		Addr:    ":8080",
		Handler: apphttp.NewRouterWithAuthAndWebDAV(authSvc, jwtSecret, webSvc),
	}
	log.Fatal(srv.ListenAndServe())
}
