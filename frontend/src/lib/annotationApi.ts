import { getToken } from './authApi'

export type AnnotationResponse = {
  id: string
  book_id: string
  location: number
  quote: string
  note: string
  color: string
  created_at: string
}

export async function fetchAnnotations(bookId: string, token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) return null
  try {
    const resp = await fetch(`/api/annotations/${bookId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    if (!resp.ok) return null
    return (await resp.json()) as AnnotationResponse[]
  } catch {
    return null
  }
}

export async function createAnnotation(
  bookId: string,
  location: number,
  quote: string,
  note: string,
  color: string,
  token?: string
) {
  const authToken = token ?? getToken()
  if (!authToken) return null
  try {
    const resp = await fetch(`/api/annotations/${bookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ location, quote, note, color }),
    })
    if (!resp.ok) return null
    return (await resp.json()) as AnnotationResponse
  } catch {
    return null
  }
}

export async function deleteAnnotation(
  bookId: string,
  annotationId: string,
  token?: string
) {
  const authToken = token ?? getToken()
  if (!authToken) return
  try {
    await fetch(`/api/annotations/${bookId}/${annotationId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
  } catch {
    // best-effort
  }
}
