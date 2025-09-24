/**
 * Chargement d'un fichier de type JavaScript
 * @param url
 * @returns
 */
export const loadFile = (url: string) => {
  return new Promise((resolve, reject) => {
    let script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = url

    // @ts-ignore
    if (script.readyState) {
      //IE
      // @ts-ignore
      script.onreadystatechange = () => {
        if (
          // @ts-ignore
          script.readyState === 'loaded' ||
          // @ts-ignore
          script.readyState === 'complete'
        ) {
          // @ts-ignore
          script.onreadystatechange = null
          resolve(true)
        }
      }
    } else {
      //Others
      script.onload = () => {
        resolve(true)
      }
    }
    script.onerror = (error: any) => reject(error)
    document.getElementsByTagName('head')[0].appendChild(script)
  })
}
