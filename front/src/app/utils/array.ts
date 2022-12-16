/**
 * Copie d'un tableau avec ses enfants pour déconnecter les références. Solution un peu lourde mais qui marche
 * @param arrayToCopy 
 * @returns 
 */
export const copyArray = (arrayToCopy: any[]): any[] => {
  return JSON.parse(JSON.stringify(arrayToCopy));
}