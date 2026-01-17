import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getToken } from '../lib/authApi'
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

  const canSubmit = useMemo(
    () => Boolean(form.base_url && form.username && form.secret),
    [form]
  )

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
      setMessage('Unable to load WebDAV connections.')
    }
  }

  useEffect(() => {
    void refresh()
  }, [token])

  if (!token) {
    return (
      <section className="panel">
        <h1>WebDAV Library</h1>
        <p className="muted">Sign in to manage your WebDAV connections.</p>
        <Link to="/login" className="button">
          Go to login
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
      setMessage('Unable to save connection. Please check the details.')
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
      setMessage('Unable to remove this connection.')
    }
  }

  const handleSync = async (id: string) => {
    setMessage('')
    try {
      await syncConnection(id, token)
      setMessage('Sync started. Refresh in a moment to see updates.')
    } catch {
      setStatus('error')
      setMessage('Unable to start sync.')
    }
  }

  return (
    <section className="webdav-page">
      <header className="section-header">
        <div>
          <span className="overline">Storage</span>
          <h1>WebDAV Library</h1>
          <p className="muted">
            Add your WebDAV server to index and stream your library.
          </p>
        </div>
        <button className="button" onClick={refresh}>
          Refresh
        </button>
      </header>

      <div className="webdav-grid">
        <div className="panel">
          <h2>{editingId ? 'Edit connection' : 'Add connection'}</h2>
          <form className="form" onSubmit={handleSubmit}>
            <label>
              Base URL
              <input
                type="url"
                placeholder="https://dav.example.com/remote.php/dav/files/user"
                value={form.base_url}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, base_url: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Username
              <input
                type="text"
                placeholder="user"
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, username: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Password / app token
              <input
                type="password"
                placeholder="••••••••"
                value={form.secret}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, secret: event.target.value }))
                }
                required
              />
            </label>
            <button className="button" type="submit" disabled={!canSubmit}>
              {editingId ? 'Update connection' : 'Save connection'}
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
                Cancel edit
              </button>
            )}
          </form>
          <p className="muted webdav-hint">
            Tip: Some providers require an app-specific password.
          </p>
        </div>

        <div className="panel">
          <h2>Connections</h2>
          {status === 'loading' && <p className="muted">Loading...</p>}
          {items.length === 0 && status !== 'loading' && (
            <p className="muted">No connections yet. Add one to get started.</p>
          )}
          {items.map((item) => (
            <div className="webdav-card" key={item.id}>
              <div>
                <strong>{item.base_url}</strong>
                <p className="muted">{item.username}</p>
                <span className={`chip status-${item.last_sync_status || 'idle'}`}>
                  {item.last_sync_status || 'idle'}
                </span>
                {item.last_error && (
                  <p className="muted webdav-error">{item.last_error}</p>
                )}
              </div>
              <div className="row-actions">
                <button className="button" onClick={() => handleSync(item.id)}>
                  Sync
                </button>
                <button className="button" onClick={() => startEdit(item)}>
                  Edit
                </button>
                <button className="button" onClick={() => handleDelete(item.id)}>
                  Remove
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
