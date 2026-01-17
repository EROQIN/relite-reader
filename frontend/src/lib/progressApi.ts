import { getToken } from './authApi'

export type ProgressResponse = {
  book_id: string
  location: number
  updated_at: string
}

export async function fetchProgress(bookId: string, token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) return null
  try {
    const resp = await fetch(`/api/progress/${bookId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    if (!resp.ok) return null
    return (await resp.json()) as ProgressResponse
  } catch {
    return null
  }
}

export async function saveProgressRemote(bookId: string, location: number, token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) return
  try {
    await fetch(`/api/progress/${bookId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ location }),
    })
  } catch {
    // best-effort
  }
}
