import { getToken } from './authApi'

export type TaskResponse = {
  id: string
  user_id: string
  type: string
  status: string
  error: string
  payload: Record<string, string>
  created_at: string
  updated_at: string
}

export async function fetchTasks(token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) return null
  try {
    const resp = await fetch('/api/tasks', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    if (!resp.ok) return null
    return (await resp.json()) as TaskResponse[]
  } catch {
    return null
  }
}

export async function retryTask(id: string, token?: string) {
  const authToken = token ?? getToken()
  if (!authToken) return null
  try {
    const resp = await fetch(`/api/tasks/${id}/retry`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    if (!resp.ok) return null
    return (await resp.json()) as TaskResponse
  } catch {
    return null
  }
}
