/**
 * Mettre que le premier caratères en majuscule
 * @param string
 * @returns
 */
export function ucFirst(string: string): string {
  if (string && typeof string === 'string') {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }
  return string
}

export function isProfessionalEmailDomain(email: string): boolean {
  const domain = String(email).toLowerCase().trim().split('@')[1]

  if (!domain) {
    return false
  }

  return domain === 'justice.fr' || domain.endsWith('.gouv.fr') || domain === 'a-just.fr'
}
