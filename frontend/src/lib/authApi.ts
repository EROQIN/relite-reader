const TOKEN_KEY = 'relite.auth.token'

export type AuthMode = 'login' | 'register'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new Event('relite-auth'))
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event('relite-auth'))
}

export async function authenticate(
  mode: AuthMode,
  payload: { email: string; password: string }
): Promise<string> {
  const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!resp.ok) {
    throw new Error('auth_failed')
  }
  const data = (await resp.json()) as { token?: string }
  if (!data.token) {
    throw new Error('missing_token')
  }
  setToken(data.token)
  return data.token
}
