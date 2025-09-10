import { endOfMonth, startOfMonth } from 'date-fns'

/**
 * Calcul du nombre de mois entre deux dates
 * @param d1
 * @param d2
 * @returns
 */
export function monthDiff(d1: Date, d2: Date) {
  var months
  months = (d2.getFullYear() - d1.getFullYear()) * 12
  months -= d1.getMonth()
  months += d2.getMonth()
  return months <= 0 ? 0 : months
}

/**
 * Retourne si la date est une journée de travail
 * @param date
 * @returns
 */
export function workingDay(date: Date) {
  return [1, 2, 3, 4, 5].indexOf(date.getDay()) !== -1
}

/**
 * Recupération du mois en texte d'une date
 * @param date
 * @returns
 */
export function getMonthString(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][date.getMonth()]
}

/**
 * Récupération du mois en texte d'une date en version raccourcie
 * @param date
 * @returns
 */
export function getShortMonthString(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'][date.getMonth()]
}

/**
 * Conversion d'une mois raccourcie en mois réel
 * @param shortString
 * @returns
 */
export function getLongMonthString(shortString: string) {
  switch (shortString) {
    case 'Janv.':
      return 'Janvier'
    case 'Févr.':
      return 'Février'
    case 'Mars':
      return 'Mars'
    case 'Avr.':
      return 'Avril'
    case 'Mai':
      return 'Mai'
    case 'Juin':
      return 'Juin'
    case 'Juil.':
      return 'Juillet'
    case 'Août':
      return 'Août'
    case 'Sept.':
      return 'Septembre'
    case 'Oct.':
      return 'Octobre'
    case 'Nov.':
      return 'Novembre'
    case 'Déc.':
      return 'Décembre'
  }
  return
}

/**
 * Conversion d'une date à l'heure 00 de la journée
 * @param date
 * @returns
 */
export function today(date: Date | null | undefined = new Date()): Date {
  let now = new Date()
  if (date) {
    now = new Date(date)
  }
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Conversion d'une date au jour 0 et l'heure 0
 * @param date
 * @param monthToAdd
 * @param lastDay prendre le dernier jour du mois
 * @returns
 */
export function month(date: Date | null = new Date(), monthToAdd?: number, lastDay?: string) {
  date = date ? new Date(date) : new Date()

  if (lastDay) {
    date = endOfMonth(date)
  } else {
    date = startOfMonth(date)
  }

  if (monthToAdd && monthToAdd !== 0) {
    date.setMonth(date.getMonth() + monthToAdd)
  }

  return date
}

/**
 * Calcul du nombre de jours travaillés entre 2 dates
 * @param startDate
 * @param endDate
 * @returns
 */
export function nbOfWorkingDays(startDate: Date, endDate: Date) {
  const start = new Date(startDate)
  let nbOfWorkingDays = 0
  do {
    if (workingDay(start)) nbOfWorkingDays++
    start.setDate(start.getDate() + 1)
  } while (start.getTime() <= endDate.getTime())
  return nbOfWorkingDays
}

/**
 * Conversion des millieseconds en jours
 * @param ms
 * @returns
 */
const convertMsToDays = (ms: number) => {
  const msInOneSecond = 1000
  const secondsInOneMinute = 60
  const minutesInOneHour = 60
  const hoursInOneDay = 24

  const minutesInOneDay = hoursInOneDay * minutesInOneHour
  const secondsInOneDay = secondsInOneMinute * minutesInOneDay
  const msInOneDay = msInOneSecond * secondsInOneDay

  return Math.ceil(ms / msInOneDay)
}

/**
 * Calcul du nombre de jours entre 2 dates
 * @param startDate
 * @param endDate
 * @returns
 */
export function nbOfDays(startDate: Date, endDate: Date) {
  startDate = new Date(startDate)
  endDate = new Date(endDate)
  let differenceInMs = startDate.getTime() - endDate.getTime()

  if (differenceInMs < 0) {
    differenceInMs *= -1
  }

  return convertMsToDays(differenceInMs)
}

/**
 * Ajout ou soustraction d'un nombre de jour à une date
 * @param date
 * @param nbDays
 * @returns
 */
export function dateAddDays(date: Date, nbDays: number = 0) {
  date = new Date(date)
  date.setDate(date.getDate() + nbDays)
  return date
}

/**
 * Conversion d'une date en date string complête sauf si aujourd'hui
 * @param date
 * @returns
 */
export function findRealValue(date: Date) {
  const today = new Date()
  if (today.getDate() === date.getDate() && today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()) return ''
  else if (date && typeof date.getMonth === 'function') {
    return `${(date.getDate() + '').padStart(2, '0')} ${getShortMonthString(date)} ${date.getFullYear()}`
  } else return ''
}

/**
 * Conversion d'une date en date string complête sauf si aujourd'hui
 * @param date
 * @returns
 */
export function findRealValueCustom(date: Date | string | null | undefined, isTodayString = true, monthAndYear = false) {
  date = new Date(date || '')
  const today = new Date()
  if (today.getDate() === date.getDate() && today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear() && isTodayString) {
    return "Aujourd'hui"
  } else if (date && typeof date.getMonth === 'function' && monthAndYear) {
    return `${getMonthString(date)} ${date.getFullYear()}`
  } else if (date && typeof date.getMonth === 'function') {
    return `${(date.getDate() + '').padStart(2, '0')} ${getMonthString(date)} ${date.getFullYear()}`
  } else return ''
}

/**
 * Génération d'un tableau qui liste chaque mois entre deux dates sous forme de tableau
 * @param dateFrom
 * @param dateTo
 * @returns
 */
export function monthDiffList(dateFrom: Date, dateTo: Date | null): number[] {
  if (dateTo) return [...Array(dateTo.getMonth() - dateFrom.getMonth() + 12 * (dateTo.getFullYear() - dateFrom.getFullYear())).keys()]
  else return []
}

/**
 * Conversion d'une date en HH:MM en date fonction
 * @param str
 * @returns
 */
export function stringToDecimalDate(str: string, sep = 'h') {
  if (str !== null || str !== '') {
    const strArray = str.split(sep)
    return (parseInt(strArray[0]) * 60 + parseInt(strArray[1])) / 60
  }

  return 0
}

/**
 * Conversion d'une date en HH:MM
 * @param decimal
 * @returns
 */
export function decimalToStringDate(d: number | string | null | undefined, s = 'h') {
  if (d == null || isNaN((d = +('' + d).replace(',', '.')))) return '0'
  let h = Math.floor(d),
    m = Math.floor((d - h) * 60)
  if (m === 60) {
    h++
    m = 0
  }
  return h + s + (m < 10 ? '0' : '') + m
}

/**
 * Création d'un tableau de mois différents entre 2 dates en string
 * @param startDate
 * @param endDate
 * @returns
 */
export function getRangeOfMonths(startDate: Date, endDate: Date) {
  const dates = new Array<string>()
  const dateCounter = new Date(startDate)

  // avoids edge case where last month is skipped
  dateCounter.setDate(1)
  while (dateCounter < endDate) {
    //if (getShortMonthString(dateCounter) === 'Janv.')
    dates.push(`${getShortMonthString(dateCounter) + ' ' + dateCounter.getFullYear().toString().slice(-2)}`)
    //else dates.push(`${getShortMonthString(dateCounter)}`)

    dateCounter.setMonth(dateCounter.getMonth() + 1)
  }

  if (dates.length === 1) return [dates[0], dates[0]]

  return dates
}

/**
 * Création d'un objet de mois différents entre 2 dates
 * @param startDate
 * @param endDate
 * @param asObject
 * @returns
 */
export function getRangeOfMonthsAsObject(startDate: Date, endDate: Date, asObject = false) {
  const dates = new Array<string>()
  const dateCounter = new Date(startDate)
  let monthlyL: { [key: string]: any } = {}

  dateCounter.setDate(1)

  while (dateCounter <= endDate) {
    if (getShortMonthString(dateCounter) === 'Janv.') dates.push(`${getShortMonthString(dateCounter) + ' ' + dateCounter.getFullYear().toString().slice(-2)}`)
    else dates.push(`${getShortMonthString(dateCounter)}`)

    const str: string = getShortMonthString(dateCounter) + dateCounter.getFullYear().toString().slice(-2)
    if (asObject) {
      monthlyL[str] = { ...{} }
    }
    dateCounter.setMonth(dateCounter.getMonth() + 1)
  }

  if (asObject) return { ...monthlyL }

  if (dates.length === 1) return [dates[0], dates[0]]

  return dates
}

/**
 * Retourne si c'est le premier jour du mois
 * @param date
 * @returns
 */
export function isFirstDayOfMonth(date = new Date()) {
  return date.getDate() === 1
}

/**
 * Compare si la premiere date est plus ancienne que la seconde
 * @param firstDate
 * @param secondDate
 * @returns
 */
export function isDateBiggerThan(firstDate: string | Date, secondDate: string | Date, strict: boolean = false): boolean {
  firstDate = new Date(firstDate)
  secondDate = new Date(secondDate)

  if (strict) {
    return firstDate.getTime() > secondDate.getTime()
  }
  return firstDate.getTime() >= secondDate.getTime()
}

/**
 * Calcul du nombre d'heure travaillé par un magistrat dans un mois
 * @param date
 * @returns
 */
export function nbHourInMonth(date: Date = new Date()) {
  const dateStart = new Date(date.getFullYear(), date.getMonth())
  const dateStop = new Date(dateStart)
  const nbHoursPerDayAndMagistrat = import.meta.env.NG_APP_NB_HOURS_PER_DAY_AND_MAGISTRAT
  dateStop.setMonth(dateStop.getMonth() + 1)

  let nbDay = 0
  do {
    // only working day
    if (workingDay(dateStart)) {
      nbDay++
    }
    dateStart.setDate(dateStart.getDate() + 1)
  } while (dateStart.getTime() < dateStop.getTime())

  return nbDay * nbHoursPerDayAndMagistrat
}

/**
 * Suppression de la time zone à une date
 * @param date
 * @returns
 */
export function generalizeTimeZone(date: Date | undefined | null) {
  if (date === undefined || date === null) return undefined
  else {
    return date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  }
}

export function setTimeToMidDay(date: Date | undefined | null) {
  if (date === undefined || date === null) return undefined
  date.setHours(12)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  date.setUTCHours(12)
  date.setUTCMinutes(0)
  date.setUTCSeconds(0)
  date.setUTCMilliseconds(0)
  return date
}

/**
 * Trie entre deux dates
 * @param firstDate
 * @param secondDate
 * @param reverse
 * @returns
 */
export function sortDates(firstDate: string | Date, secondDate: string | Date, reverse: boolean) {
  firstDate = new Date(firstDate)
  secondDate = new Date(secondDate)

  return reverse ? secondDate.getTime() - firstDate.getTime() : firstDate.getTime() - secondDate.getTime()
}

/**
 * Get time of date
 * @param date
 * @returns
 */
export function getTime(date: string | Date | null = null) {
  date = new Date(date || new Date())
  return date.getTime()
}
