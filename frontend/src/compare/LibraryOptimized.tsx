import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { LibraryItem } from '../lib/library'
import { loadProgress } from '../lib/progressStore'
import { useI18n } from '../components/I18nProvider'
import TasksPanel from '../components/TasksPanel'

interface Props {
  localItems: LibraryItem[]
  remoteItems: LibraryItem[]
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (id: string) => void
  onOpen: (id: string) => void
  onOpenRemote: (id: string) => void
}

export default function LibraryOptimized({
  localItems,
  remoteItems,
  onImport,
  onRemove,
  onOpen,
  onOpenRemote,
}: Props) {
  const { t, locale } = useI18n()
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<'recent' | 'title'>('recent')
  const [hideMissing, setHideMissing] = useState(false)
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
  const sortedLocalItems = useMemo(() => {
    const items = [...filteredItems]
    if (sortKey === 'title') {
      items.sort((a, b) => a.title.localeCompare(b.title))
      return items
    }
    items.sort((a, b) => {
      const aTime = a.lastOpened ? new Date(a.lastOpened).getTime() : 0
      const bTime = b.lastOpened ? new Date(b.lastOpened).getTime() : 0
      return bTime - aTime
    })
    return items
  }, [filteredItems, sortKey])
  const filteredRemoteItems = useMemo(() => {
    if (!query.trim()) return remoteItems
    const needle = query.trim().toLowerCase()
    return remoteItems.filter((item) => {
      const title = item.title.toLowerCase()
      const author = item.author?.toLowerCase() ?? ''
      const format = item.format.toLowerCase()
      return (
        title.includes(needle) ||
        author.includes(needle) ||
        format.includes(needle)
      )
    })
  }, [remoteItems, query])
  const sortedRemoteItems = useMemo(() => {
    const items = hideMissing ? filteredRemoteItems.filter((item) => !item.missing) : [...filteredRemoteItems]
    if (sortKey === 'title') {
      items.sort((a, b) => a.title.localeCompare(b.title))
      return items
    }
    items.sort((a, b) => {
      const aTime = a.lastOpened ? new Date(a.lastOpened).getTime() : 0
      const bTime = b.lastOpened ? new Date(b.lastOpened).getTime() : 0
      return bTime - aTime
    })
    return items
  }, [filteredRemoteItems, hideMissing, sortKey])
  const progressMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of [...localItems, ...remoteItems]) {
      map.set(item.id, loadProgress(item.id))
    }
    return map
  }, [localItems, remoteItems])
  const timestampFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }, [locale])
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
          <div className="library-webdav-controls">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={hideMissing}
                onChange={(event) => setHideMissing(event.target.checked)}
              />
              {t('library.webdav.hideMissing')}
            </label>
          </div>
          {sortedRemoteItems.length === 0 ? (
            <p className="muted">
              {query.trim()
                ? t('library.webdav.emptySearch')
                : t('library.webdav.empty')}
            </p>
          ) : (
            <ul className="book-list">
              {sortedRemoteItems.map((item) => (
                <li key={item.id} className="book-row">
                  <div>
                    <strong>{item.title}</strong>
                    <span className="chip">{item.format.toUpperCase()}</span>
                    {progressMap.get(item.id) ? (
                      <span className="chip progress-chip">
                        {t('library.item.progress', {
                          percent: Math.round((progressMap.get(item.id) ?? 0) * 100),
                        })}
                      </span>
                    ) : null}
                    {item.missing ? (
                      <span className="chip status-error">
                        {t('library.webdav.missing')}
                      </span>
                    ) : null}
                    {item.lastOpened && (
                      <span className="timestamp">
                        {t('library.item.lastOpened', {
                          time: timestampFormatter.format(
                            new Date(item.lastOpened)
                          ),
                        })}
                      </span>
                    )}
                  </div>
                  <div className="row-actions">
                    <Link
                      to={`/reader/${item.id}`}
                      onClick={() => onOpenRemote(item.id)}
                      className="button"
                    >
                      {t('library.item.open')}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
          <div className="library-local-controls">
            <label className="field">
              {t('library.sort.label')}
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value as 'recent' | 'title')}>
                <option value="recent">{t('library.sort.recent')}</option>
                <option value="title">{t('library.sort.title')}</option>
              </select>
            </label>
          </div>
          {sortedLocalItems.length === 0 ? (
            <p className="muted">
              {query.trim()
                ? t('library.local.emptySearch')
                : t('library.local.empty')}
            </p>
          ) : (
            <ul className="book-list">
              {sortedLocalItems.map((item) => {
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
                          {t('library.item.lastOpened', {
                            time: timestampFormatter.format(
                              new Date(item.lastOpened)
                            ),
                          })}
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
