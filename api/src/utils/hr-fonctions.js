export function findFonctionName(AllFonctions, currentSituation) {
  return currentSituation && currentSituation.category
    ? AllFonctions.find((c) => c.id === currentSituation.category.id).label.toLowerCase()
    : '';
}
