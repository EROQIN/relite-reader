export type BookFormat = 'epub' | 'pdf' | 'txt' | 'mobi' | 'unknown'

export function detectFormat(file: File): BookFormat {
  const name = file.name.toLowerCase()
  if (name.endsWith('.epub')) return 'epub'
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.txt')) return 'txt'
  if (name.endsWith('.mobi')) return 'mobi'
  return 'unknown'
}
