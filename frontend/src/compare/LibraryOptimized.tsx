import { Link } from 'react-router-dom'
import { LibraryItem } from '../lib/library'
import { useI18n } from '../components/I18nProvider'

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
          <h2>{t('library.local.title')}</h2>
          {localItems.length === 0 ? (
            <p className="muted">{t('library.local.empty')}</p>
          ) : (
            <ul className="book-list">
              {localItems.map((item) => (
                <li key={item.id} className="book-row">
                  <div>
                    <strong>{item.title}</strong>
                    <span className="chip">{item.format.toUpperCase()}</span>
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
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  )
}
