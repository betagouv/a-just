/**
 * Création d'une nouvelle référence mémoire
 * @param {*} arrayToCopy liste à dupliquer
 * @returns copy de la list avec une nouvelle référence mémoire
 */
export const copyArray = (arrayToCopy) => {
  return JSON.parse(JSON.stringify(arrayToCopy))
}
