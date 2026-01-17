# Relite Reader

Relite Reader is a WebDAV‑backed reading app with a focused, customizable reader experience. It supports multi‑format reading (EPUB, PDF, MOBI, TXT) with per‑user preferences, progress tracking, and a mobile‑friendly PWA shell.

## Highlights
- WebDAV library connections and background sync.
- Reader customization: themes, fonts, font size, line height, page width, alignment, layout, focus mode.
- Advanced options: custom backgrounds, brightness control, reading pace, time remaining, quick controls, keyboard shortcuts.
- PWA install prompt for mobile.
- Preferences stored locally and optionally synced to backend when a JWT is available.

## Usage Manual

### 1) Sign in / Register
The backend exposes JWT auth endpoints. The current UI provides a basic login form without wiring; integrate the token into your auth flow and store it in local storage under `relite.auth.token` to enable preference sync.

### 2) Connect WebDAV
Use the WebDAV API to create a connection:
- Base URL
- Username
- Password (stored encrypted at rest on the server)

Then trigger a sync to index your library.

### 3) Browse and Open Books
- The library view lists books indexed from WebDAV.
- Click a book to open the reader.

### 4) Customize the Reader
Inside the reader settings panel you can:
- Apply presets or save your own presets.
- Change theme, font, size, line height, page width, alignment, layout.
- Adjust reading pace (used for time remaining in TXT).
- Set a custom background color or brightness.

Quick actions:
- Theme cycle, layout toggle, focus mode, and font size controls in the floating quick bar.
- Keyboard shortcuts (press `?` in the reader to see all shortcuts).

### 5) Install as Web App
On mobile browsers, the app surfaces a small banner that explains how to install the PWA. Once installed, Relite Reader opens in a standalone app shell.

## Deployment Manual

### Backend (Go)
Requirements:
- Go toolchain (current LTS).

Build and run:
```bash
cd backend
export RELITE_JWT_SECRET="your-jwt-secret"
export RELITE_WEB_DAV_KEY="32-byte-hex-key"
export RELITE_WEB_DAV_SYNC_INTERVAL="20m"
export RELITE_DATA_DIR="/path/to/data"

go build -o relite-server ./cmd/server
./relite-server
```

Notes:
- `RELITE_DATA_DIR` is optional; when set, preferences persist to `preferences.json` under the directory.
- WebDAV secrets are encrypted with `RELITE_WEB_DAV_KEY` (hex‑encoded 32‑byte key).

### Frontend (Vite)
Requirements:
- Node.js LTS.

Build:
```bash
cd frontend
npm install
npm run build
```

During development:
```bash
npm run dev
```

### Test Commands
```bash
cd backend
GOCACHE=.cache/go-build go test ./...

cd frontend
npm test -- --run
```

## API Summary

Base URL: `/api`

### Health
- `GET /health` → `{ "status": "ok" }`

### Auth
- `POST /auth/register`
  - Body: `{ "email": "user@example.com", "password": "secret" }`
- `POST /auth/login`
  - Body: `{ "email": "user@example.com", "password": "secret" }`
  - Returns: `{ "token": "..." }`

### WebDAV
- `GET /webdav`
- `POST /webdav`
  - Body: `{ "base_url": "https://dav.example.com", "username": "reader", "secret": "pw" }`
- `PUT /webdav/{id}`
  - Body: `{ "base_url": "...", "username": "...", "secret": "..." }`
- `DELETE /webdav/{id}`
- `POST /webdav/{id}/sync`

### Books
- `GET /books`
  - Returns indexed books with `missing` flag.

### Preferences
- `GET /preferences`
- `PUT /preferences`
  - Body:
    ```json
    {
      "reader": {
        "theme": "paper",
        "font": "serif",
        "fontSize": 18,
        "lineHeight": 1.7,
        "pageWidth": 720,
        "textAlign": "left",
        "layoutMode": "single",
        "focusMode": false,
        "readingSpeed": 240,
        "background": "#fffdf7",
        "brightness": 1.0
      }
    }
    ```

## Project Notes
- The backend currently uses in‑memory stores for users/books/WebDAV connections. Swap in a persistent store when integrating a database.
- Preferences can be persisted to disk via `RELITE_DATA_DIR`.
