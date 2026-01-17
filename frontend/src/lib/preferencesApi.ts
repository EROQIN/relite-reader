import { getToken } from './authApi'
import { UserPreferences } from './userPreferences'

export async function fetchPreferences(token: string): Promise<UserPreferences | null> {
  try {
    const resp = await fetch('/api/preferences', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!resp.ok) return null
    const data = (await resp.json()) as Partial<UserPreferences>
    if (!data.reader) return null
    return {
      locale: data.locale ?? 'en',
      reader: data.reader,
    }
  } catch {
    return null
  }
}

export async function savePreferences(token: string, prefs: UserPreferences) {
  try {
    await fetch('/api/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(prefs),
    })
  } catch {
    // best-effort sync
  }
}

export function getAuthToken(): string | null {
  return getToken()
}
