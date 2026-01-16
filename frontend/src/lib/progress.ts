export function calcProgress(scrollTop: number, scrollHeight: number, clientHeight: number) {
  const maxScroll = scrollHeight - clientHeight
  if (maxScroll <= 0) return 1
  return Math.min(1, Math.max(0, scrollTop / maxScroll))
}
