/**
 * Détection si un navigateur est de la marque Apple
 * @returns 
 */
export function iIOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  // iPad on iOS 13 detection
  || (navigator.userAgent.includes("Mac"))
}

/**
 * Force to download file
 * @param filePath 
 */
export function downloadFile(filePath: string){
  var link=document.createElement('a');
  link.href = filePath;
  link.download = filePath.substr(filePath.lastIndexOf('/') + 1);
  link.click();
}