import { useMemo, useState } from 'react'
import { detectFormat } from '../lib/format'
import { loadLibrary, removeLibraryItem, upsertLibraryItem } from '../lib/library'

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
    <section>
      <header className="section-header">
        <div>
          <h1>Your Library</h1>
          <p className="muted">Import local books or connect WebDAV.</p>
        </div>
        <label className="button">
          Import
          <input type="file" multiple hidden onChange={onImport} />
        </label>
      </header>
      <div className="library-grid">
        <div className="panel">
          <h2>WebDAV Library</h2>
          <p className="muted">Coming soon.</p>
        </div>
        <div className="panel">
          <h2>Local Imports</h2>
          {localItems.length === 0 ? (
            <p className="muted">No local books yet.</p>
          ) : (
            <ul className="book-list">
              {localItems.map((item) => (
                <li key={item.id} className="book-row">
                  <div>
                    <strong>{item.title}</strong>
                    <span className="chip">{item.format.toUpperCase()}</span>
                  </div>
                  <button onClick={() => onRemove(item.id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
