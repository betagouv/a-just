/**
 * Récupération de la couleur d'une catégories
 * @param {*} label
 * @param {*} opacity
 * @returns
 */
export const getCategoryColor = (label, opacity = 1) => {
  switch (label) {
  case 'Magistrat':
  case 'Magistrats':
  case 'Magistrat du siège':
  case 'Magistrats du siège':
    return `rgba(0, 0, 145, ${opacity})`
  case 'Fonctionnaire':
  case 'Fonctionnaires':
    return `rgba(165, 88, 160, ${opacity})`
  }

  return `rgba(121, 104, 48, ${opacity})`
}

/**
 * Récupération de la couleur de fond d'une catégories
 * @param {*} label
 * @returns
 */
export const getBgCategoryColor = (label) => {
  switch (label) {
  case 'magistrat':
  case 'magistrats':
  case 'magistrat du siège':
  case 'magistrats du siège':
    return '#e3e3fd'
  case 'fonctionnaire':
  case 'fonctionnaires':
    return '#fee7fc'
  case 'Contractuel':
  case 'Contractuels':
    return '#fef6e3'
  }

  return getCategoryColor(label, 0.2)
}

/**
 * Clé Magistrats
 */
export const MAGISTRATS = 'magistrats'
/**
 * Clé Fonctionnaires
 */
export const FONCTIONNAIRES = 'fonctionnaires'
