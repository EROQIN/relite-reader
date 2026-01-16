package main

import (
	"log"
	"net/http"

	apphttp "github.com/EROQIN/relite-reader/backend/internal/http"
)

func main() {
	srv := &http.Server{
		Addr:    ":8080",
		Handler: apphttp.NewRouter(),
	}
	log.Fatal(srv.ListenAndServe())
}
