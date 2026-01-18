import { loadJson, saveJson } from './storage'
import { LibraryItem } from './library'

const REMOTE_LIBRARY_KEY = 'relite.library.remote'

export type RemoteLibraryItem = LibraryItem & {
  source: 'webdav'
  sourcePath: string
}

export function loadRemoteLibrary(): RemoteLibraryItem[] {
  return loadJson<RemoteLibraryItem[]>(REMOTE_LIBRARY_KEY, [])
}

export function saveRemoteLibrary(items: RemoteLibraryItem[]) {
  saveJson(REMOTE_LIBRARY_KEY, items)
}

export function updateRemoteLastOpened(id: string, timestamp: string) {
  const items = loadRemoteLibrary()
  const idx = items.findIndex((item) => item.id === id)
  if (idx < 0) return
  items[idx] = { ...items[idx], lastOpened: timestamp }
  saveRemoteLibrary(items)
}
