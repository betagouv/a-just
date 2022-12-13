/**
 * Retourne un objet qui n'a plus la même référence
 * @param value 
 * @returns 
 */
export function copy (value: any) {
  return JSON.parse(JSON.stringify(value))
}