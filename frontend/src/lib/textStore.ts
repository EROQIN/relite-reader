const prefix = 'relite.text.'

export function saveText(id: string, text: string) {
  localStorage.setItem(`${prefix}${id}`, text)
}

export function loadText(id: string): string {
  return localStorage.getItem(`${prefix}${id}`) ?? ''
}
