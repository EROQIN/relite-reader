import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { LibraryItem } from '../lib/library'
import { loadProgress } from '../lib/progressStore'
import { useI18n } from '../components/I18nProvider'
import TasksPanel from '../components/TasksPanel'

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
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const filteredItems = useMemo(() => {
    if (!query.trim()) return localItems
    const needle = query.trim().toLowerCase()
    return localItems.filter((item) => {
      const title = item.title.toLowerCase()
      const author = item.author?.toLowerCase() ?? ''
      const format = item.format.toLowerCase()
      return (
        title.includes(needle) ||
        author.includes(needle) ||
        format.includes(needle)
      )
    })
  }, [localItems, query])
  const progressMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of localItems) {
      map.set(item.id, loadProgress(item.id))
    }
    return map
  }, [localItems])
  return (
    <section className="library-optimized">
      <header className="hero">
        <div>
          <span className="overline">{t('library.overline')}</span>
          <h1>{t('library.hero.title')}</h1>
          <p className="muted">{t('library.hero.subtitle')}</p>
        </div>
        <label className="button primary">
          {t('library.hero.import')}
          <input type="file" multiple hidden onChange={onImport} />
        </label>
      </header>
      <div className="split-grid">
        <section className="panel">
          <h2>{t('library.webdav.title')}</h2>
          <p className="muted">{t('library.webdav.subtitle')}</p>
        </section>
        <section className="panel">
          <div className="library-local-header">
            <div>
              <h2>{t('library.local.title')}</h2>
              <p className="muted">{t('library.local.subtitle')}</p>
            </div>
            <input
              className="library-search"
              type="search"
              placeholder={t('library.search.placeholder')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={t('library.search.label')}
            />
          </div>
          {filteredItems.length === 0 ? (
            <p className="muted">
              {query.trim()
                ? t('library.local.emptySearch')
                : t('library.local.empty')}
            </p>
          ) : (
            <ul className="book-list">
              {filteredItems.map((item) => {
                const progress = progressMap.get(item.id) ?? 0
                return (
                  <li key={item.id} className="book-row">
                    <div>
                      <strong>{item.title}</strong>
                      <span className="chip">{item.format.toUpperCase()}</span>
                      {progress > 0 ? (
                        <span className="chip progress-chip">
                          {t('library.item.progress', {
                            percent: Math.round(progress * 100),
                          })}
                        </span>
                      ) : null}
                      {item.lastOpened && (
                        <span className="timestamp">
                          {t('library.item.lastOpened', { time: item.lastOpened })}
                        </span>
                      )}
                    </div>
                    <div className="row-actions">
                      <Link
                        to={`/reader/${item.id}`}
                        onClick={() => onOpen(item.id)}
                        className="button"
                      >
                        {t('library.item.open')}
                      </Link>
                      <button onClick={() => onRemove(item.id)}>
                        {t('library.item.remove')}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
      <TasksPanel />
    </section>
  )
}
