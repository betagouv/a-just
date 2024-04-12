/**
 * Retourne un objet qui n'a plus la même référence
 * @param value 
 * @returns 
 */
export function copy (value: any) {
  return JSON.parse(JSON.stringify(value))
}

export function sleep (duration = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}