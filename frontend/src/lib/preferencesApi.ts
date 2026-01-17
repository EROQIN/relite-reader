import { ReaderPrefs } from './readerPrefs'

const TOKEN_KEY = 'relite.auth.token'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export async function fetchPreferences(token: string): Promise<ReaderPrefs | null> {
  try {
    const resp = await fetch('/api/preferences', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!resp.ok) return null
    const data = (await resp.json()) as { reader?: ReaderPrefs }
    return data.reader ?? null
  } catch {
    return null
  }
}

export async function savePreferences(token: string, prefs: ReaderPrefs) {
  try {
    await fetch('/api/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reader: prefs }),
    })
  } catch {
    // best-effort sync
  }
}
