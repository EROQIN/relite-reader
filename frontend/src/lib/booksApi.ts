import { getToken } from './authApi'

export type RemoteBook = {
  id: string
  title: string
  author: string
  format: string
  source_path: string
  connection_id: string
  missing: boolean
  updated_at: string
}

export async function fetchBooks(token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) return null
  try {
    const resp = await fetch('/api/books', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    if (!resp.ok) return null
    return (await resp.json()) as RemoteBook[]
  } catch {
    return null
  }
}
