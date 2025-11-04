export const findHelpCenter = (path: string) => {
  let localhref = window.location.origin
  if (localhref.includes('localhost')) {
    localhref = 'https://a-just.incubateur.net'
  } else if (localhref.includes('sandbox')) {
    localhref = localhref.replace('sandbox.', '')
  }
  return localhref.replace('//', '//aide.') + path
}
