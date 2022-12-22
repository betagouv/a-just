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

  return `rgba(239, 203, 58, ${opacity})`
}

/**
 * Clé Magistrats
 */
export const MAGISTRATS = 'magistrats'
/**
 * Clé Fonctionnaires
 */
export const FONCTIONNAIRES = 'fonctionnaires'
