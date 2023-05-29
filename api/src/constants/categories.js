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
  case 'Greffe':
  case 'Greffes':
    return `rgba(165, 88, 160, ${opacity})`
  }

  return `rgba(121, 104, 48, ${opacity})`
}

/**
 * Récupération de la couleur d'une catégories
 * @param {*} label
 * @param {*} opacity
 * @returns
 */
export const getHoverCategoryColor = (label) => {
  switch (label) {
  case 'Magistrat':
  case 'Magistrats':
  case 'Magistrat du siège':
  case 'Magistrats du siège':
    return '#c8c8ff'
  case 'Greffe':
  case 'Greffes':
    return '#fabff5'
  }

  return 'white'
}

/**
 * Récupération de la couleur d'une catégories sans jeu d'opacité
 * @param {*} label
 * @param {*} opacity
 * @returns
 */
export const getCategoryColorNoOpacity = (label) => {
  switch (label) {
  case 'Magistrat':
  case 'Magistrats':
  case 'Magistrat du siège':
  case 'Magistrats du siège':
    return '#e3e3fd'
  case 'Greffe':
  case 'Greffes':
    return '#fee7fc'
  }

  return '#fef6e3'
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
  case 'greffe':
  case 'greffes':
    return '#fee7fc'
  case 'Autour du juge':
    return '#fef6e3'
  }

  return getCategoryColorNoOpacity(label)
}

/**
 * Clé Magistrats
 */
export const MAGISTRATS = 'magistrats'
/**
 * Clé Fonctionnaires
 */
export const FONCTIONNAIRES = 'fonctionnaires'
