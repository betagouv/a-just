export async function findCategoryName(categories, currentSituation) {
  return currentSituation && currentSituation.category
    ? categories.find((c) => c.id === currentSituation.category.id).label.toLowerCase()
    : '';
}
