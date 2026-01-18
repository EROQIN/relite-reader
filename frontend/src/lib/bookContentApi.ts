import { getToken } from './authApi'

export async function fetchBookText(bookId: string, token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) return null
  try {
    const resp = await fetch(`/api/books/${bookId}/content`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    if (!resp.ok) return null
    return await resp.text()
  } catch {
    return null
  }
}

export async function fetchBookBlob(bookId: string, token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) return null
  try {
    const resp = await fetch(`/api/books/${bookId}/content`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    if (!resp.ok) return null
    return await resp.blob()
  } catch {
    return null
  }
}
