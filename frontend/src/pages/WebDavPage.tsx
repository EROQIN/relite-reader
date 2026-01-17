import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getToken } from '../lib/authApi'
import { useI18n } from '../components/I18nProvider'
import {
  createConnection,
  deleteConnection,
  listConnections,
  syncConnection,
  updateConnection,
  type WebDavConnection,
  type WebDavPayload,
} from '../lib/webdavApi'

const emptyForm: WebDavPayload = {
  base_url: '',
  username: '',
  secret: '',
}

export default function WebDavPage() {
  const [token, setToken] = useState(() => getToken())
  const [items, setItems] = useState<WebDavConnection[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<WebDavPayload>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { t } = useI18n()

  const canSubmit = useMemo(
    () => Boolean(form.base_url && form.username && form.secret),
    [form]
  )

  const statusLabel = (value: string) => {
    const key = `webdav.status.${value}`
    const translated = t(key)
    return translated === key ? value : translated
  }

  useEffect(() => {
    const handler = () => setToken(getToken())
    window.addEventListener('relite-auth', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('relite-auth', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const refresh = async () => {
    if (!token) return
    try {
      setStatus('loading')
      const list = await listConnections(token)
      setItems(list)
      setStatus('idle')
    } catch {
      setStatus('error')
      setMessage(t('webdav.message.loadError'))
    }
  }

  useEffect(() => {
    void refresh()
  }, [token])

  if (!token) {
    return (
      <section className="panel">
        <h1>{t('webdav.title')}</h1>
        <p className="muted">{t('webdav.signin.helper')}</p>
        <Link to="/login" className="button">
          {t('webdav.signin.cta')}
        </Link>
      </section>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setMessage('')
    try {
      if (editingId) {
        await updateConnection(editingId, form, token)
      } else {
        await createConnection(form, token)
      }
      setForm(emptyForm)
      setEditingId(null)
      await refresh()
    } catch {
      setStatus('error')
      setMessage(t('webdav.message.saveError'))
    }
  }

  const startEdit = (item: WebDavConnection) => {
    setEditingId(item.id)
    setForm({
      base_url: item.base_url,
      username: item.username,
      secret: '',
    })
  }

  const handleDelete = async (id: string) => {
    setMessage('')
    try {
      await deleteConnection(id, token)
      await refresh()
    } catch {
      setStatus('error')
      setMessage(t('webdav.message.removeError'))
    }
  }

  const handleSync = async (id: string) => {
    setMessage('')
    try {
      await syncConnection(id, token)
      setMessage(t('webdav.message.syncStart'))
    } catch {
      setStatus('error')
      setMessage(t('webdav.message.syncError'))
    }
  }

  return (
    <section className="webdav-page">
      <header className="section-header">
        <div>
          <span className="overline">{t('webdav.overline')}</span>
          <h1>{t('webdav.title')}</h1>
          <p className="muted">{t('webdav.subtitle')}</p>
        </div>
        <button className="button" onClick={refresh}>
          {t('webdav.refresh')}
        </button>
      </header>

      <div className="webdav-grid">
        <div className="panel">
          <h2>{editingId ? t('webdav.form.edit') : t('webdav.form.add')}</h2>
          <form className="form" onSubmit={handleSubmit}>
            <label>
              {t('webdav.form.baseUrl')}
              <input
                type="url"
                placeholder={t('webdav.form.baseUrl.placeholder')}
                value={form.base_url}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, base_url: event.target.value }))
                }
                required
              />
            </label>
            <label>
              {t('webdav.form.username')}
              <input
                type="text"
                placeholder={t('webdav.form.username.placeholder')}
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, username: event.target.value }))
                }
                required
              />
            </label>
            <label>
              {t('webdav.form.secret')}
              <input
                type="password"
                placeholder={t('webdav.form.secret.placeholder')}
                value={form.secret}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, secret: event.target.value }))
                }
                required
              />
            </label>
            <button className="button" type="submit" disabled={!canSubmit}>
              {editingId ? t('webdav.form.update') : t('webdav.form.save')}
            </button>
            {editingId && (
              <button
                className="button"
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                {t('webdav.form.cancel')}
              </button>
            )}
          </form>
          <p className="muted webdav-hint">
            {t('webdav.form.tip')}
          </p>
        </div>

        <div className="panel">
          <h2>{t('webdav.list.title')}</h2>
          {status === 'loading' && <p className="muted">{t('webdav.list.loading')}</p>}
          {items.length === 0 && status !== 'loading' && (
            <p className="muted">{t('webdav.list.empty')}</p>
          )}
          {items.map((item) => (
            <div className="webdav-card" key={item.id}>
              <div>
                <strong>{item.base_url}</strong>
                <p className="muted">{item.username}</p>
                <span className={`chip status-${item.last_sync_status || 'idle'}`}>
                  {statusLabel(item.last_sync_status || 'idle')}
                </span>
                {item.last_error && (
                  <p className="muted webdav-error">{item.last_error}</p>
                )}
              </div>
              <div className="row-actions">
                <button className="button" onClick={() => handleSync(item.id)}>
                  {t('webdav.action.sync')}
                </button>
                <button className="button" onClick={() => startEdit(item)}>
                  {t('webdav.action.edit')}
                </button>
                <button className="button" onClick={() => handleDelete(item.id)}>
                  {t('webdav.action.remove')}
                </button>
              </div>
            </div>
          ))}
          {message && <p className="muted">{message}</p>}
        </div>
      </div>
    </section>
  )
}
