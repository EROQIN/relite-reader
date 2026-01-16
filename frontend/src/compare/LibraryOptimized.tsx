import { Link } from 'react-router-dom'
import { LibraryItem } from '../lib/library'

interface Props {
  localItems: LibraryItem[]
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (id: string) => void
  onOpen: (id: string) => void
}

export default function LibraryOptimized({
  localItems,
  onImport,
  onRemove,
  onOpen,
}: Props) {
  return (
    <section className="library-optimized">
      <header className="hero">
        <div>
          <span className="overline">Relite Reader</span>
          <h1>Curate your quiet library.</h1>
          <p className="muted">
            Blend local files and WebDAV shelves into a single reading space.
          </p>
        </div>
        <label className="button primary">
          Import
          <input type="file" multiple hidden onChange={onImport} />
        </label>
      </header>
      <div className="split-grid">
        <section className="panel">
          <h2>WebDAV Library</h2>
          <p className="muted">Connect to sync your remote shelves.</p>
        </section>
        <section className="panel">
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
                    {item.lastOpened && (
                      <span className="timestamp">Last opened {item.lastOpened}</span>
                    )}
                  </div>
                  <div className="row-actions">
                    <Link
                      to={`/reader/${item.id}`}
                      onClick={() => onOpen(item.id)}
                      className="button"
                    >
                      Open
                    </Link>
                    <button onClick={() => onRemove(item.id)}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  )
}
