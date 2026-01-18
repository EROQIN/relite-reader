import { loadJson, saveJson } from './storage'

const BOOKMARKS_KEY = 'relite.bookmarks'

export type Bookmark = {
  id: string
  label: string
  location: number
  createdAt: string
}

export function loadBookmarks(bookId: string): Bookmark[] {
  const map = loadJson<Record<string, Bookmark[]>>(BOOKMARKS_KEY, {})
  return map[bookId] ?? []
}

export function saveBookmarks(bookId: string, bookmarks: Bookmark[]) {
  const map = loadJson<Record<string, Bookmark[]>>(BOOKMARKS_KEY, {})
  map[bookId] = bookmarks
  saveJson(BOOKMARKS_KEY, map)
}
