import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getToken } from '../lib/authApi'
import { loadLibrary } from '../lib/library'
import { TaskResponse, fetchTasks, retryTask } from '../lib/tasksApi'
import { useI18n } from './I18nProvider'

const statusClassMap: Record<string, string> = {
  queued: 'status-queued',
  running: 'status-running',
  success: 'status-success',
  error: 'status-error',
}

const statusLabelMap: Record<string, string> = {
  queued: 'tasks.status.queued',
  running: 'tasks.status.running',
  success: 'tasks.status.success',
  error: 'tasks.status.error',
}

export default function TasksPanel() {
  const [token, setToken] = useState(() => getToken())
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const { t } = useI18n()

  const titleMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of loadLibrary()) {
      map.set(item.id, item.title)
    }
    return map
  }, [])

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
    setLoading(true)
    setHasError(false)
    const result = await fetchTasks(token)
    if (!result) {
      setHasError(true)
      setLoading(false)
      return
    }
    setTasks(result)
    setLoading(false)
  }

  useEffect(() => {
    if (!token) return
    void refresh()
  }, [token])

  const handleRetry = async (id: string) => {
    if (!token) return
    setRetryingId(id)
    await retryTask(id, token)
    setRetryingId(null)
    await refresh()
  }

  const visible = tasks.slice(0, 6)

  return (
    <section className="panel tasks-panel">
      <div className="tasks-panel-header">
        <div>
          <h2>{t('tasks.title')}</h2>
          <p className="muted">{t('tasks.subtitle')}</p>
        </div>
        <div className="tasks-panel-actions">
          <Link className="button" to="/tasks">
            {t('tasks.viewAll')}
          </Link>
          <button className="button" onClick={refresh} disabled={!token || loading}>
            {loading ? t('tasks.refreshing') : t('tasks.refresh')}
          </button>
        </div>
      </div>
      {!token ? (
        <p className="muted">{t('tasks.auth')}</p>
      ) : hasError ? (
        <p className="muted">{t('tasks.error')}</p>
      ) : visible.length === 0 ? (
        <p className="muted">{t('tasks.empty')}</p>
      ) : (
        <div className="tasks-list">
          {visible.map((task) => {
            const statusKey = statusLabelMap[task.status] ?? 'tasks.status.queued'
            const statusClass = statusClassMap[task.status] ?? 'status-queued'
            const format = task.payload?.format
            const sourcePath = task.payload?.sourcePath
            const bookId = task.payload?.book_id
            const title = bookId ? titleMap.get(bookId) : null
            const headline = format
              ? t('tasks.item.format', { format: format.toUpperCase() })
              : t('tasks.item.generic')
            const detail = title
              ? t('tasks.item.bookTitle', { title })
              : sourcePath
                ? t('tasks.item.source', { source: sourcePath })
                : bookId
                  ? t('tasks.item.book', { id: bookId })
                  : ''
              return (
                <div className="task-row" key={task.id}>
                  <div className="task-meta">
                    <strong>{headline}</strong>
                    {detail ? <span className="muted">{detail}</span> : null}
                    {task.error ? (
                      <span className="muted">{task.error}</span>
                    ) : null}
                  </div>
                  <div className="task-actions">
                    {task.status === 'error' ? (
                      <button
                        className="button"
                        onClick={() => handleRetry(task.id)}
                        disabled={retryingId === task.id}
                      >
                        {retryingId === task.id
                          ? t('tasks.retrying')
                          : t('tasks.retry')}
                      </button>
                    ) : null}
                    <span className={`chip ${statusClass}`}>{t(statusKey)}</span>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </section>
  )
}
