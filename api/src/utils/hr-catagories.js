/**
 * Indique si une categorie se trouve dans une situation
 * @param {*} categories
 * @param {*} currentSituation
 * @returns
 */
export function findCategoryName (categories, currentSituation) {
  return currentSituation && currentSituation.category ? categories.find((c) => c.id === currentSituation.category.id).label.toLowerCase() : ''
}
