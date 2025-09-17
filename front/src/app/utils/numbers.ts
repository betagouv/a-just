/**
 * Retourne un nombre aléatoire et d'une valeure max
 * @param max
 * @returns
 */
export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max)
}

/**
 * Arrondi les chiffres pour géner les 5.00000001
 * @param value
 * @param base
 * @returns
 */
export function fixDecimal(value: number, base: number = 100) {
  return Math.round(value * base) / base
}

/**
 * Trie entre deux nombres
 *
 * @param firstNumber
 * @param secondNumber
 * @param reverse
 * @returns
 */
export function sortNumbers(firstNumber: number, secondNumber: number, reverse: boolean) {
  if (reverse) {
    if (firstNumber > secondNumber) return -1
    else if (firstNumber < secondNumber) return 1
  } else {
    if (firstNumber < secondNumber) return -1
    else if (firstNumber > secondNumber) return 1
  }
  return 0
}

/**
 * Calcul de l'échelle maximale
 * @param maxValue
 * @returns
 */
export function calculerEchelleMax(maxValue: number): number {
  if (maxValue === 0) {
    return 1 // Pour éviter les problèmes avec le logarithme de zéro
  }

  const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
  const scaledValue = maxValue / orderOfMagnitude
  const roundedValue = Math.ceil(scaledValue)
  const newScale = roundedValue * orderOfMagnitude

  return newScale
}
