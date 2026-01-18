import { useMemo, useState } from 'react'
import LibraryOptimized from '../compare/LibraryOptimized'
import { detectFormat } from '../lib/format'
import {
  loadLibrary,
  removeLibraryItem,
  updateLastOpened,
  upsertLibraryItem,
} from '../lib/library'
import { saveText } from '../lib/textStore'

export default function LibraryPage() {
  const [items, setItems] = useState(() => loadLibrary())

  const localItems = useMemo(() => items.filter((i) => i.source === 'local'), [items])

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

  return (
    <LibraryOptimized
      localItems={localItems}
      onImport={onImport}
      onRemove={onRemove}
      onOpen={onOpen}
    />
  )
}
