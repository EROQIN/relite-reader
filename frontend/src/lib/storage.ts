const LIBRARY_KEY = 'relite.library'
const PREFS_KEY = 'relite.prefs'

export function loadJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export { LIBRARY_KEY, PREFS_KEY }
