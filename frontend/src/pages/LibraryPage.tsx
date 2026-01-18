import { useEffect, useMemo, useState } from 'react'
import LibraryOptimized from '../compare/LibraryOptimized'
import { getToken } from '../lib/authApi'
import { fetchBooks } from '../lib/booksApi'
import { detectFormat } from '../lib/format'
import {
  loadLibrary,
  removeLibraryItem,
  updateLastOpened,
  upsertLibraryItem,
} from '../lib/library'
import {
  loadRemoteLibrary,
  saveRemoteLibrary,
  updateRemoteLastOpened,
  RemoteLibraryItem,
} from '../lib/remoteLibrary'
import { saveText } from '../lib/textStore'

export default function LibraryPage() {
  const [token, setToken] = useState(() => getToken())
  const [items, setItems] = useState(() => loadLibrary())
  const [remoteItems, setRemoteItems] = useState<RemoteLibraryItem[]>(() =>
    loadRemoteLibrary()
  )

  const localItems = useMemo(() => items.filter((i) => i.source === 'local'), [items])

  useEffect(() => {
    const handler = () => setToken(getToken())
    window.addEventListener('relite-auth', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('relite-auth', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    let active = true
    void fetchBooks(token).then((remote) => {
      if (!active || !remote) return
      const existing = new Map(loadRemoteLibrary().map((item) => [item.id, item]))
      const mapped = remote.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        format: book.format as RemoteLibraryItem['format'],
        source: 'webdav' as const,
        sourcePath: book.source_path,
        connectionId: book.connection_id,
        missing: book.missing,
        updatedAt: book.updated_at,
        lastOpened: existing.get(book.id)?.lastOpened,
      }))
      setRemoteItems(mapped)
      saveRemoteLibrary(mapped)
    })
    return () => {
      active = false
    }
  }, [token])

  const normalizeHtml = (raw: string) => {
    try {
      const doc = new DOMParser().parseFromString(raw, 'text/html')
      return doc.body?.textContent ?? raw
    } catch {
      return raw.replace(/<[^>]*>/g, ' ')
    }
  }

  const onImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    const next = [...items]

    for (const file of files) {
      const format = detectFormat(file)
      const id = `${file.name}-${file.size}-${file.lastModified}`
      if (format === 'unknown') continue

      const item = {
        id,
        title: file.name.replace(/\.[^.]+$/, ''),
        format,
        source: 'local' as const,
        fileName: file.name,
      }

      if (format === 'txt' || format === 'md' || format === 'markdown') {
        const text = await file.text()
        saveText(id, text)
      }
      if (format === 'html' || format === 'htm') {
        const text = await file.text()
        saveText(id, normalizeHtml(text))
      }

      upsertLibraryItem(item)
      next.unshift(item)
    }

    setItems(next)
  }

  const onRemove = (id: string) => {
    removeLibraryItem(id)
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const onOpen = (id: string) => {
    const timestamp = new Date().toISOString()
    updateLastOpened(id, timestamp)
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, lastOpened: timestamp } : item))
    )
  }

  const onOpenRemote = (id: string) => {
    const timestamp = new Date().toISOString()
    updateRemoteLastOpened(id, timestamp)
    setRemoteItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, lastOpened: timestamp } : item))
    )
  }

  return (
    <LibraryOptimized
      localItems={localItems}
      remoteItems={remoteItems}
      onImport={onImport}
      onRemove={onRemove}
      onOpen={onOpen}
      onOpenRemote={onOpenRemote}
    />
  )
}
