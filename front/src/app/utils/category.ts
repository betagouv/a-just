/**
 * Récupère le titre d'une categorie maj
 * @param name string 
 * @returns string
 */
export const getCategoryTitle = (name: string): string => {
  switch (name) {
    case 'Greffe':
      return 'Agent de greffe'
  }

  return name;
}

/**
 * Récupère le titre d'une categorie maj et on met en majuscule
 * @param name string 
 * @returns string
 */
export const getCategoryTitlePlurial = (name: string): string => {
  switch (name) {
    case 'Greffe':
      return 'Agents de greffe'
    case 'Autour du magistrat':
      return 'Autour du magistrat'
  }

  return name + 's';
}


/**
 * Conversion d'un nom de référentiel en version simplifiée
 * @param name
 * @returns
 */
export function categoryMappingName(name: string): string {
  switch (name) {
    case 'Magistrat':
      return `Juge`
    case 'Autour du magistrat':
      return `EAM`
  }

  return name
}

/**
 * Récupération du code couleur des catégories
 * @param name
 * @returns
 */
export function categoryMappingColor(
  name: string | undefined,
  opacity: number = 1
): string {
  switch (name) {
    case 'Magistrat':
      return `rgba(0, 0, 145, ${opacity})`
    case 'Greffe':
      return `rgba(165, 88, 160, ${opacity})`
    case 'Autour du magistrat':
      return `rgba(121, 104, 48, ${opacity})`
  }

  return ''
}