/**
 * RED COLOR
 */
export const RED_COLOR = 'rgb(255, 86, 85)'
/**
 * PLACEHOLDER_COLOR
 */
export const PLACEHOLDER_COLOR = 'rgb(246, 246, 246)'

/**
 * Récupération de la couleur et ajoute de l'opacité
 * @param color
 * @param opacity
 * @returns
 */
export const GET_COLOR = (color: string, opacity: number = 1) => {
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`)
  }

  return color
}

/**
 * Opacité de 20%
 */
export const OPACITY_20 = 0.2
