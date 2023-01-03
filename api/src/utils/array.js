/**
 * Création d'une copie d'un tableau
 * @param {*} arrayToCopy
 * @returns
 */
export const copyArray = (arrayToCopy) => {
  return JSON.parse(JSON.stringify(arrayToCopy))
}
