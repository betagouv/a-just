/**
 * Retourne un nombre aléatoire et d'une valeure max
 * @param max 
 * @returns 
 */
export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

/**
 * Arrondi les chiffres pour géner les 5.00000001
 * @param value 
 * @param base 
 * @returns 
 */
export function fixDecimal(value: number, base: number = 100) {
  return Math.round(value * base) / base;
}