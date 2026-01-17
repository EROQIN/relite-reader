import { useState } from 'react'
import { authenticate, type AuthMode } from '../lib/authApi'
import { useI18n } from '../components/I18nProvider'

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  )
  const [message, setMessage] = useState('')
  const { t } = useI18n()

  const toHelper = (value: AuthMode) =>
    value === 'login' ? t('auth.helper.login') : t('auth.helper.register')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    if (!email || !password) {
      setStatus('error')
      setMessage(t('auth.message.missing'))
      return
    }

    try {
      await authenticate(mode, { email, password })
      setStatus('success')
      setMessage(t('auth.message.success'))
    } catch {
      setStatus('error')
      setMessage(t('auth.message.error'))
    }
  }

  return (
    <section className="panel auth-panel">
      <div className="auth-header">
        <div>
          <span className="overline">{t('auth.overline')}</span>
          <h1>{mode === 'login' ? t('auth.title.login') : t('auth.title.register')}</h1>
          <p className="muted">{toHelper(mode)}</p>
        </div>
        <button
          className="button"
          type="button"
          onClick={() => {
            setMode((prev) => (prev === 'login' ? 'register' : 'login'))
            setStatus('idle')
            setMessage('')
          }}
        >
          {mode === 'login' ? t('auth.toggle.register') : t('auth.toggle.login')}
        </button>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          {t('auth.label.email')}
          <input
            type="email"
            placeholder={t('auth.placeholder.email')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          {t('auth.label.password')}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="button" disabled={status === 'loading'}>
          {status === 'loading'
            ? t('auth.submit.loading')
            : mode === 'login'
              ? t('auth.submit.login')
              : t('auth.submit.register')}
        </button>
      </form>
      {message && (
        <p className={`auth-message ${status === 'error' ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      <p className="muted auth-footnote">{t('auth.footnote')}</p>
    </section>
  )
}
