import { HAS_ACCESS_TO_CONTRACTUEL, HAS_ACCESS_TO_GREFFIER, HAS_ACCESS_TO_MAGISTRAT } from '../constants/access'

/**
 * Indique si une categorie se trouve dans une situation
 * @param {*} categories
 * @param {*} currentSituation
 * @returns
 */
export function findCategoryName (categories, currentSituation) {
  return currentSituation && currentSituation.category ? categories.find((c) => c.id === currentSituation.category.id).label.toLowerCase() : ''
}

/**
 * Retourne la liste des catégories en fonctions des droits d'un utilisateur
 * @param {*} categories
 * @param {*} user
 * @returns
 */
export function getCategoriesByUserAccess (categories, user) {
  const ids = getCategoriesIdByUserAccess(user)

  console.log(ids, user)

  return categories.filter((cat) => ids.indexOf(cat.id) !== -1)
}

/**
 * Retourne la liste des id des catégories en fonctions des droits d'un utilisateur
 * @param {*} user
 * @returns
 */
export function getCategoriesIdByUserAccess (user) {
  const listCategoriesId = []
  const access = user && user.access ? user.access : []

  // TODO Voir comment rendre non fixe
  if (access.indexOf(HAS_ACCESS_TO_MAGISTRAT) !== -1) {
    listCategoriesId.push(1) // Magistrats
  }

  // TODO Voir comment rendre non fixe
  if (access.indexOf(HAS_ACCESS_TO_GREFFIER) !== -1) {
    listCategoriesId.push(2) // Fonctionnaires
  }

  // TODO Voir comment rendre non fixe
  if (access.indexOf(HAS_ACCESS_TO_CONTRACTUEL) !== -1) {
    listCategoriesId.push(3) // Contractuels
  }

  return listCategoriesId
}
