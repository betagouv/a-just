/**
 * Détection si un navigateur est de la marque Apple
 * @returns
 */
export function iIOS() {
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    navigator.userAgent.includes('Mac')
  )
}

/**
 * Force to download file
 * @param filePath
 */
export function downloadFile(filePath: string) {
  var link = document.createElement('a')
  link.href = filePath
  link.download = filePath.substr(filePath.lastIndexOf('/') + 1)
  link.click()
}

/**
 * Ping d'un host pour vérifier si il est accessible
 * @param host
 * @returns
 */
export function ping(host: string) {
  return new Promise((resolve, reject) => {
    var http = new XMLHttpRequest()

    http.open('GET', host, /*async*/ true)
    http.onreadystatechange = function () {
      if (http.readyState == 4) {
        resolve(http.status === 200)
      }
    }
    try {
      http.send(null)
    } catch (exception) {
      // this is expected
      reject()
    }
  })
}
