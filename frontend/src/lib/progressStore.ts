const prefix = 'relite.progress.'

function clamp(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function saveProgress(id: string, progress: number) {
  localStorage.setItem(`${prefix}${id}`, String(clamp(progress)))
}

export function loadProgress(id: string): number {
  const raw = localStorage.getItem(`${prefix}${id}`)
  if (!raw) return 0
  const parsed = Number(raw)
  return clamp(parsed)
}
