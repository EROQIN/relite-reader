import { useMemo, useState } from 'react'
import LibraryOptimized from '../compare/LibraryOptimized'
import { detectFormat } from '../lib/format'
import { loadLibrary, removeLibraryItem, upsertLibraryItem } from '../lib/library'
import { saveText } from '../lib/textStore'

export default function LibraryPage() {
  const [items, setItems] = useState(() => loadLibrary())

  const localItems = useMemo(() => items.filter((i) => i.source === 'local'), [items])

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

      if (format === 'txt') {
        const text = await file.text()
        saveText(id, text)
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

  return (
    <LibraryOptimized localItems={localItems} onImport={onImport} onRemove={onRemove} />
  )
}
