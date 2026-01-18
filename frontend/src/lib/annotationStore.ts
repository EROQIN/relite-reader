import { loadJson, saveJson } from './storage'

const ANNOTATIONS_KEY = 'relite.annotations'

export type Annotation = {
  id: string
  location: number
  quote: string
  note: string
  color: string
  createdAt: string
}

export function loadAnnotations(bookId: string): Annotation[] {
  const map = loadJson<Record<string, Annotation[]>>(ANNOTATIONS_KEY, {})
  return map[bookId] ?? []
}

export function saveAnnotations(bookId: string, annotations: Annotation[]) {
  const map = loadJson<Record<string, Annotation[]>>(ANNOTATIONS_KEY, {})
  map[bookId] = annotations
  saveJson(ANNOTATIONS_KEY, map)
}
