# Project Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the old prompt-engineering scaffold and set up a clean, development-ready repo structure for relite-reader.

**Architecture:** Keep `AGENTS.md` and replace legacy folders with a simple full-stack layout: `backend/`, `frontend/`, `infra/`, `scripts/`, `docs/`. Add base project docs and a repo-wide `.gitignore`.

**Tech Stack:** Go backend, React + Vite frontend, PostgreSQL + pgvector (future), optional Git.

### Task 1: Remove legacy scaffold

**Files:**
- Delete: `prompts/`
- Delete: `templates/`
- Delete: `docs/*` (preserve `docs/plans/`)
- Delete: `.vscode/`

**Step 1: Ensure plan directory exists**

Run: `mkdir -p docs/plans`
Expected: No output.

**Step 2: Remove legacy folders**

Run: `rm -rf prompts templates .vscode`
Expected: No output.

**Step 3: Remove legacy docs while preserving plans**

Run: `find docs -mindepth 1 -maxdepth 1 ! -name plans -exec rm -rf {} +`
Expected: No output.

**Step 4: Verify remaining top-level layout**

Run: `ls -la`
Expected: `AGENTS.md`, `README.md`, `docs/`, and no `prompts/`, `templates/`, or `.vscode/`.

**Step 5: Commit**

Run: `git status -sb`
Expected: If Git is initialized, show deleted paths. If not a Git repo, skip commit steps.

Commit (if Git is initialized):
```bash
git add -A
git commit -m "chore: remove legacy scaffold"
```

### Task 2: Create development-ready structure

**Files:**
- Create: `backend/cmd/relite-reader/`
- Create: `backend/internal/`
- Create: `frontend/`
- Create: `infra/`
- Create: `scripts/`
- Ensure: `docs/`

**Step 1: Create directories**

Run: `mkdir -p backend/cmd/relite-reader backend/internal frontend infra scripts docs`
Expected: No output.

**Step 2: Verify structure**

Run: `ls -la`
Expected: New directories are present.

**Step 3: Commit**

Run: `git status -sb`
Expected: If Git is initialized, show new directories as untracked. If not a Git repo, skip commit steps.

Commit (if Git is initialized):
```bash
git add -A
git commit -m "chore: add base project structure"
```

### Task 3: Add .gitignore

**Files:**
- Create: `.gitignore`

**Step 1: Write .gitignore**

```gitignore
# Go
bin/
dist/
*.exe
*.test
*.out
go.work
go.work.sum

# Node/Vite
node_modules/
dist/
.env
.env.*
npm-debug.log*
yarn-error.log*
pnpm-debug.log*

# OS/IDE
.DS_Store
.idea/
.vscode/
```

**Step 2: Verify**

Run: `cat .gitignore`
Expected: Matches the content above.

**Step 3: Commit**

Run: `git status -sb`
Expected: If Git is initialized, show `.gitignore` as new. If not a Git repo, skip commit steps.

Commit (if Git is initialized):
```bash
git add .gitignore
git commit -m "chore: add repo gitignore"
```

### Task 4: Update README.md for the new project

**Files:**
- Modify: `README.md`

**Step 1: Replace README.md content**

```markdown
# relite-reader

Relite Reader is a full-stack reading app with user login, WebDAV-backed personal libraries, multi-format ebook reading (EPUB, PDF, MOBI, CBZ, and more), and customizable reading themes. Reading progress and preferences are saved for logged-in users.

## Repository Layout
- `backend/`: Go API service (auth, library, reader, sync jobs).
- `frontend/`: React + Vite app (PWA, reader UI).
- `infra/`: Infrastructure assets (DB setup, configs).
- `scripts/`: Automation and dev scripts.
- `docs/`: Architecture and plans.

## Quick Start (WIP)
1. Install Go toolchain and Node.js LTS.
2. Install PostgreSQL and enable the `pgvector` extension.
3. Add WebDAV test credentials (base URL + user/password).
4. Start backend and frontend in dev mode (to be documented).
```

**Step 2: Verify**

Run: `cat README.md`
Expected: Matches the content above.

**Step 3: Commit**

Run: `git status -sb`
Expected: If Git is initialized, show `README.md` modified. If not a Git repo, skip commit steps.

Commit (if Git is initialized):
```bash
git add README.md
git commit -m "docs: refresh readme for relite-reader"
```
