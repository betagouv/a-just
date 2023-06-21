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
