import type { ContentieuReferentielInterface } from '../interfaces/contentieu-referentiel'

/**
 * Conversion d'un pourcentage en couleur
 * @param value
 * @returns
 */
export const activityPercentColor = (value: number): string => {
  switch (true) {
    case value <= 50:
      return '#ce0500'
    case value > 50 && value <= 80:
      return '#b18a26'
    case value > 80 && value <= 99:
      return '#0a76f6'
    case value > 99 && value <= 100:
      return '#2fc368'
  }
  return ''
}
/** Somme des seules lignes cochées « Compter », en privilégiant la valeur A-JUSTée. */
export const sumCountedActivityValues = (
  children: ContentieuReferentielInterface[],
  fields: Array<'in' | 'originalIn' | 'out' | 'originalOut' | 'stock' | 'originalStock'>,
): number | null => {
  let total: number | null = null
  for (const child of children) {
    if (child.compter !== true) continue
    for (const field of fields) {
      const value = child[field]
      if (value != null) {
        total = (total ?? 0) + value
        break
      }
    }
  }
  return total === null ? null : Math.max(0, total)
}
