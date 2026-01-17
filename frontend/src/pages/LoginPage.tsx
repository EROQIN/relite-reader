import { useState } from 'react'
import { authenticate, type AuthMode } from '../lib/authApi'

const toHelper = (mode: AuthMode) =>
  mode === 'login'
    ? 'Use your Relite account to sync preferences across devices.'
    : 'Create a Relite account to save preferences and progress.'

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  )
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    if (!email || !password) {
      setStatus('error')
      setMessage('Please enter both email and password.')
      return
    }

    try {
      await authenticate(mode, { email, password })
      setStatus('success')
      setMessage('Signed in successfully. You can return to your library.')
    } catch {
      setStatus('error')
      setMessage('Unable to sign in. Check your credentials or try again.')
    }
  }

  return (
    <section className="panel auth-panel">
      <div className="auth-header">
        <div>
          <span className="overline">Account</span>
          <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
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
          {mode === 'login' ? 'Need an account?' : 'Have an account?'}
        </button>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="button" disabled={status === 'loading'}>
          {status === 'loading'
            ? 'Working...'
            : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
        </button>
      </form>
      {message && (
        <p className={`auth-message ${status === 'error' ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      <p className="muted auth-footnote">
        Local-only reading is available without login.
      </p>
    </section>
  )
}
