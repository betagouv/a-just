import { endOfMonth, startOfMonth } from 'date-fns'

/**
 * Liste des mois
 */
export const MONTH_LABEL = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'décembre']

/**
 * Converti des heures:minutes en timestamps
 * @param {*} hour
 * @param {*} minute
 * @returns timestamps
 */
export const convertHourMinutesToTimestamps = (hour, minute) => {
  return (hour || 1) * 60 * 60000 + (minute || 1) * 60000
}

/**
 * Retourne le nom du jour
 * @param {*} date
 * @returns le jour string
 */
export const dayName = (date) => {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  switch (date.getDay()) {
  case 1:
    return 'lundi'
  case 2:
    return 'mardi'
  case 3:
    return 'mercredi'
  case 4:
    return 'jeudi'
  case 5:
    return 'vendredi'
  case 6:
    return 'samedi'
  case 0:
    return 'dimanche'
  }
}

/**
 * Retourne le nom du mois
 * @param {*} date
 * @returns nom  du mois en string
 */
export const monthName = (date) => {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  switch (date.getMonth()) {
  case 0:
    return 'janvier'
  case 1:
    return 'février'
  case 2:
    return 'mars'
  case 3:
    return 'avril'
  case 4:
    return 'mai'
  case 5:
    return 'juin'
  case 6:
    return 'juillet'
  case 7:
    return 'aout'
  case 8:
    return 'septembre'
  case 9:
    return 'octobre'
  case 10:
    return 'novembre'
  case 11:
    return 'décembre'
  }
}

/**
 * Retourne la date du jour
 * @param {*} date
 * @returns date
 */
export function today (date = new Date()) {
  const now = new Date(date)
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Change le mois ou le jour d'un objet date
 * @param {*} date
 * @param {*} monthToAdd
 * @param {*} lastDay
 * @returns date modifiée
 */
export function month (date = new Date(), monthToAdd, lastDay) {
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
 * Calcul le nombre de mois entre 2 dates
 * @param {*} dateStart
 * @param {*} dateStop
 * @returns nombre
 */
export function getNbMonth (dateStart, dateStop) {
  let totalMonth = 0

  const now = new Date(dateStart)
  do {
    totalMonth++
    now.setMonth(now.getMonth() + 1)
  } while (now.getTime() <= dateStop.getTime())

  if (totalMonth <= 0) {
    totalMonth = 1
  }

  return totalMonth
}

/**
 * Calcul le nombre de jours entre 2 dates
 * @param {*} dateStart
 * @param {*} dateStop
 * @returns nombre
 */
export function getNbDay (dateStart, dateStop) {
  let totalMonth = 0

  const now = new Date(dateStart)
  do {
    totalMonth++
    now.setDate(now.getDate() + 1)
  } while (now.getTime() <= dateStop.getTime())

  if (totalMonth <= 0) {
    totalMonth = 1
  }

  return totalMonth
}

/**
 * Compare deux date afin de savoir si elles ont le même mois de la même année
 * @param {*} date1
 * @param {*} date2
 * @returns
 */
export function isSameMonthAndYear (date1, date2) {
  date1 = new Date(date1)
  date2 = new Date(date2)

  return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear()
}

/**
 * Indique si une date correspond à un jour ouvré ou non
 * @param {*} date
 * @returns boolean
 */
export function workingDay (date) {
  return [1, 2, 3, 4, 5].indexOf(date.getDay()) !== -1
}

/**
 * Indique si une date est avant ou après une autre date
 * @param {*} firstDate
 * @param {*} secondDate
 * @returns boolean
 */
export function isDateBiggerThan (firstDate, secondDate) {
  firstDate = new Date(firstDate)
  secondDate = new Date(secondDate)

  return firstDate.getTime() >= secondDate.getTime()
}

/**
 * Retourne un objet vide avec pour propriété les mois_années compris entre 2 dates
 */
export function getRangeOfMonthsAsObject (startDate, endDate, asObject = false) {
  const dates = new Array()
  const dateCounter = new Date(startDate)
  let monthlyL = {}

  dateCounter.setDate(1)

  while (dateCounter < endDate) {
    if (getShortMonthString(dateCounter) === 'Janv.') dates.push(`${getShortMonthString(dateCounter) + ' ' + dateCounter.getFullYear().toString().slice(-2)}`)
    else dates.push(`${getShortMonthString(dateCounter)}`)

    const str = getShortMonthString(dateCounter) + dateCounter.getFullYear().toString().slice(-2)
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
 * Retourne le nom du mois abrégé correspondant à une date
 * @param {*} date
 * @returns string
 */
export function getShortMonthString (date) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai.', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'][date.getMonth()]
}

/**
 * Convertie un nombre de miliseconde en jour
 * @param {*} ms
 * @returns nb de jour
 */
const convertMsToDays = (ms) => {
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
 * Calcule le nombre de jour entre 2 dates
 * @param {*} startDate
 * @param {*} endDate
 * @returns nb de jour
 */
export function nbOfDays (startDate, endDate) {
  startDate = new Date(startDate)
  endDate = new Date(endDate)
  let differenceInMs = startDate.getTime() - endDate.getTime()

  if (differenceInMs < 0) {
    differenceInMs *= -1
  }

  return convertMsToDays(differenceInMs)
}

/**
 * Calcule le nombre de jour ouvrés entre deux dates
 * @param {*} startDate
 * @param {*} endDate
 * @returns nb de jour ouvrés
 */
export function nbWorkingDays (startDate, endDate) {
  startDate = today(startDate)
  endDate = today(endDate)
  const start = new Date(startDate)
  let nbOfDay = 0
  do {
    if (workingDay(start)) {
      nbOfDay++
    }
    start.setDate(start.getDate() + 1)
  } while (start.getTime() <= endDate.getTime())
  return nbOfDay
}

/**
 * Check si une date donnée correspond à la date du jour
 * @param {*} date
 * @returns boolean
 */
export function checkIfDateIsNotToday (date) {
  const today = new Date()
  return date && (date.getDate() !== today.getDate() || date.getMonth() !== today.getMonth() || date.getFullYear() !== today.getFullYear())
}

/**
 * Converti une string heure:minute en heure décimal
 * @param {*} str
 * @returns nombre d'heure
 */
export function stringToDecimalDate (str) {
  if (str !== null || str !== '') {
    const strArray = str.split('h')
    return (parseInt(strArray[0]) * 60 + parseInt(strArray[1])) / 60
  }
}

/**
 * Converti un nombre d'heure decimal en hh:mm
 * @param {*} decimal
 * @returns string hh:mm
 */
export function decimalToStringDate (decimal) {
  if (decimal != null) {
    const strArray = String(decimal).split('.')
    const decimalMinute = strArray[1] && +strArray[1].length === 1 ? +strArray[1] * 10 : +strArray[1]
    let minute = strArray[1] ? String(Math.round((1 / 100) * decimalMinute * 60)) : '00'
    minute = minute.length === 1 ? '0' + minute : minute
    return strArray[0] + 'h' + minute
  }
  return ''
}

/**
 * Génération d'un tableau qui liste chaque mois entre deux dates sous forme de tableau
 * @param dateFrom
 * @param dateTo
 * @returns
 */
export function monthDiffList (dateFrom, dateTo) {
  if (dateTo) return [...Array(1 + dateTo.getMonth() - dateFrom.getMonth() + 12 * (dateTo.getFullYear() - dateFrom.getFullYear())).keys()]
  else return []
}

export function setTimeToMidDay (date) {
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
