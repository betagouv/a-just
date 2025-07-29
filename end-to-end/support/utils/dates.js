/**
 * Récupération du mois en texte d'une date en version raccourcie 
 * @param date 
 * @returns 
 */
export function getShortMonthString(date) {
    if (typeof date === 'string') {
      date = new Date(date)
    }
    console.log('Date:', date)
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

export const normalizeDate = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}