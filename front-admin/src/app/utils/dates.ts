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

/**
 * Récupération du mois d'une date
 * @param date 
 * @returns 
 */
export function getMonth(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return date.getMonth() + 1
}

/**
 * Récupération de l'année d'une date
 * @param date 
 * @returns 
 */
export function getFullYear(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return date.getFullYear()
}


/**
 * Récupération d'une date au format month/year
 * @param date 
 * @returns 
 */
export function getMonthAndYear(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  const year = getFullYear(date).toString()
  let month = getMonth(date).toString()
  if (month.length === 1)
    month = '0' + month

  return month + '/' + year
}