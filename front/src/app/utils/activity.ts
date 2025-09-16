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
