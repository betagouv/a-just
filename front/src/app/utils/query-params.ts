export function getQueryParamFromUrl(paramName: string, removeFromUrl: boolean = false): string | null {
  const url = new URL(window.location.href)
  const value = url.searchParams.get(paramName)

  if (removeFromUrl && value !== null) {
    url.searchParams.delete(paramName)
    const next = `${url.pathname}${url.search}${url.hash}`
    window.history.replaceState(window.history.state, document.title, next)
  }

  return value
}
