/**
 * Récupération du mois en texte d'une date en version raccourcie 
 * @param date 
 * @returns 
 */
export function getShortMonthString(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return [
    'Janv.',
    'Févr.',
    'Mars',
    'Avr.',
    'Mai',
    'Juin',
    'Juil.',
    'Août',
    'Sept.',
    'Oct.',
    'Nov.',
    'Déc.',
  ][date.getMonth()]
}