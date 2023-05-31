/**
 * Récupération de la couleur d'une catégories
 * @param {*} label
 * @param {*} opacity
 * @returns
 */
export const getCategoryColor = (label: string, opacity = 1) => {
  label = label.toLowerCase()
  switch (label) {
    case 'magistrat':
    case 'magistrats':
    case 'magistrat du siège':
    case 'magistrats du siège':
      return `rgba(0, 0, 145, ${opacity})`
    case 'fonctionnaire':
    case 'fonctionnaires':
    case 'greffe':
    case 'Greffe':
      return `rgba(165, 88, 160, ${opacity})`
  }

  return `rgba(121, 104, 48, ${opacity})`
}

/**
 * Récupération de la couleur de fond d'une catégories
 * @param {*} label
 * @returns
 */
export const getBgCategoryColor = (label: string) => {
  switch (label) {
    case 'magistrat':
    case 'magistrats':
    case 'magistrat du siège':
    case 'magistrats du siège':
      return '#e3e3fd'
    case 'fonctionnaire':
    case 'fonctionnaires':
    case 'greffe':
    case 'Greffe':
      return '#fee7fc'
    case 'Contractuel':
    case 'Contractuels':
    case 'Autour du magistrat':
      return '#fef6e3'
  }

  return getCategoryColor(label, 0.2)
}

/**
 * Constante des magistrats
 */
export const MAGISTRATS = 'magistrats'

/**
 * Constante des fonctionnes
 */
export const FONCTIONNAIRES = 'fonctionnaires'
