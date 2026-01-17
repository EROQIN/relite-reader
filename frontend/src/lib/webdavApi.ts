import { getToken } from './authApi'

export type WebDavConnection = {
  id: string
  base_url: string
  username: string
  last_sync_status: string
  last_error: string
}

export type WebDavPayload = {
  base_url: string
  username: string
  secret: string
}

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
})

export async function listConnections(token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) throw new Error('missing_token')
  const resp = await fetch('/api/webdav', { headers: authHeaders(authToken) })
  if (!resp.ok) throw new Error('webdav_list_failed')
  return (await resp.json()) as WebDavConnection[]
}

export async function createConnection(payload: WebDavPayload, token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) throw new Error('missing_token')
  const resp = await fetch('/api/webdav', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(authToken),
    },
    body: JSON.stringify(payload),
  })
  if (!resp.ok) throw new Error('webdav_create_failed')
  return (await resp.json()) as WebDavConnection
}

export async function updateConnection(id: string, payload: WebDavPayload, token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) throw new Error('missing_token')
  const resp = await fetch(`/api/webdav/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(authToken),
    },
    body: JSON.stringify(payload),
  })
  if (!resp.ok) throw new Error('webdav_update_failed')
  return (await resp.json()) as WebDavConnection
}

export async function deleteConnection(id: string, token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) throw new Error('missing_token')
  const resp = await fetch(`/api/webdav/${id}`, {
    method: 'DELETE',
    headers: authHeaders(authToken),
  })
  if (!resp.ok) throw new Error('webdav_delete_failed')
}

export async function syncConnection(id: string, token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) throw new Error('missing_token')
  const resp = await fetch(`/api/webdav/${id}/sync`, {
    method: 'POST',
    headers: authHeaders(authToken),
  })
  if (!resp.ok) throw new Error('webdav_sync_failed')
}
