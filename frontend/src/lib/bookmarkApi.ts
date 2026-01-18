import { getToken } from './authApi'

export type BookmarkResponse = {
  id: string
  book_id: string
  label: string
  location: number
  created_at: string
}

export async function fetchBookmarks(bookId: string, token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) return null
  try {
    const resp = await fetch(`/api/bookmarks/${bookId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    if (!resp.ok) return null
    return (await resp.json()) as BookmarkResponse[]
  } catch {
    return null
  }
}

export async function createBookmark(
  bookId: string,
  label: string,
  location: number,
  token?: string
) {
  const authToken = token ?? getToken()
  if (!authToken) return null
  try {
    const resp = await fetch(`/api/bookmarks/${bookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ label, location }),
    })
    if (!resp.ok) return null
    return (await resp.json()) as BookmarkResponse
  } catch {
    return null
  }
}

export async function deleteBookmark(bookId: string, bookmarkId: string, token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) return
  try {
    await fetch(`/api/bookmarks/${bookId}/${bookmarkId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
  } catch {
    // best-effort
  }
}
