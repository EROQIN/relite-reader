import { BookFormat } from './format'
import { LIBRARY_KEY, loadJson, saveJson } from './storage'

export type LibrarySource = 'local' | 'webdav'

export interface LibraryItem {
  id: string
  title: string
  author?: string
  format: BookFormat
  source: LibrarySource
  fileName?: string
  lastOpened?: string
}

export function loadLibrary(): LibraryItem[] {
  return loadJson<LibraryItem[]>(LIBRARY_KEY, [])
}

export function saveLibrary(items: LibraryItem[]) {
  saveJson(LIBRARY_KEY, items)
}

export function upsertLibraryItem(item: LibraryItem) {
  const items = loadLibrary()
  const idx = items.findIndex((i) => i.id === item.id)
  if (idx >= 0) items[idx] = item
  else items.unshift(item)
  saveLibrary(items)
}

export function removeLibraryItem(id: string) {
  const items = loadLibrary().filter((i) => i.id !== id)
  saveLibrary(items)
}
