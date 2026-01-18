# Relite Reader

Relite Reader is a WebDAV‑backed reading app with a focused, customizable reader experience. It supports multi‑format reading (EPUB, PDF, MOBI, TXT, CBZ/CBR/CB7, AZW/AZW3, FB2, RTF, DOCX) with per‑user preferences, progress tracking, and a mobile‑friendly PWA shell.

## Highlights
- WebDAV library connections, background sync, and a lightweight task queue.
- Reader customization: themes, fonts, font size, line height, page width, alignment, layout, focus mode.
- Advanced options: custom backgrounds, brightness control, reading pace, time remaining, quick controls, keyboard shortcuts.
- PWA install prompt for mobile.
- UI localization with automatic language detection and manual switching (English + Simplified Chinese).
- Preferences, reading progress, and bookmarks stored locally and optionally synced to backend when a JWT is available.
- Supports additional formats with queued processing for renderers.

## Usage Manual

### 1) Sign in / Register
Use the sign‑in page to authenticate or create an account. On success, the app stores the JWT in local storage under `relite.auth.token` and uses it to sync preferences across devices.

### 2) Connect WebDAV
Use the WebDAV page in the header to add a connection, or call the API directly:
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
- Drop bookmarks as you read to jump back to key locations.
Progress automatically syncs to the backend when signed in.

### 4.5) Language
Relite Reader auto-detects browser language on first load and lets you switch languages from the header. The selected locale is stored locally and synced to the server when signed in.

### 4.6) Background tasks
Unsupported formats are queued for background processing. You can review queued conversions in the library queue panel or visit `/tasks` for the full history.

Quick actions:
- Theme cycle, layout toggle, focus mode, and font size controls in the floating quick bar.
- Keyboard shortcuts (press `?` in the reader to see all shortcuts).

### 5) Install as Web App
On mobile browsers, the app surfaces a small banner that explains how to install the PWA. Once installed, Relite Reader opens in a standalone app shell.

## Deployment Manual

### Backend (Go)
Requirements:
- Go toolchain (current LTS).
- PostgreSQL (for user accounts).

Build and run:
```bash
cd backend
export RELITE_JWT_SECRET="your-jwt-secret"
export RELITE_WEB_DAV_KEY="32-byte-hex-key"
export RELITE_WEB_DAV_SYNC_INTERVAL="20m"
export RELITE_DATA_DIR="/path/to/data"
export RELITE_DATABASE_URL="postgres://user:pass@localhost:5432/relite?sslmode=disable"

go build -o relite-server ./cmd/server
./relite-server
```

Notes:
- `RELITE_DATA_DIR` is optional; when set without PostgreSQL configured, preferences persist to `preferences.json` under the directory.
- Reading progress persists to `progress.json` when `RELITE_DATA_DIR` is set and PostgreSQL is not configured.
- WebDAV secrets are encrypted with `RELITE_WEB_DAV_KEY` (hex‑encoded 32‑byte key).
- Task queue state persists to `tasks.json` when `RELITE_DATA_DIR` is set and PostgreSQL is not configured.
- Users are stored in PostgreSQL when `RELITE_DATABASE_URL` is configured (schema auto-creates).

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
      "locale": "en",
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

### Progress
- `GET /progress/{bookId}`
- `PUT /progress/{bookId}`
  - Body: `{ "location": 0.42 }`

### Bookmarks
- `GET /bookmarks/{bookId}`
- `POST /bookmarks/{bookId}`
  - Body: `{ "label": "Chapter 3", "location": 0.42 }`
- `DELETE /bookmarks/{bookId}/{id}`

### Tasks
- `GET /tasks`
  - Returns the user's task queue entries and status.

## Project Notes
- Users are stored in PostgreSQL when `RELITE_DATABASE_URL` is set.
- Books/WebDAV connections are still in memory (replace with persistent stores when ready).
- Preferences, progress, bookmarks, and task queue state can be persisted to disk via `RELITE_DATA_DIR`.
- Preferences, progress, bookmarks, and tasks use PostgreSQL when `RELITE_DATABASE_URL` is configured.
- Locale is stored alongside preferences and is sent as `locale` in the preferences payload.
