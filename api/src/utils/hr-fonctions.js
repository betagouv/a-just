/**
 * Indique si une fonction est contenue dans une situation
 * @param {*} AllFonctions
 * @param {*} currentSituation
 * @returns
 */
export function findFonctionName (AllFonctions, currentSituation) {
  if (currentSituation && currentSituation.fonction)
    if (currentSituation.fonction.id === null) return ''
    else return AllFonctions.find((c) => c.id === currentSituation.fonction.id).label.toLowerCase()
  else return ''
}
