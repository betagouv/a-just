export const MONTH_LABEL = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
]

export const convertHourMinutesToTimestamps = (hour, minute) => {
  return (hour || 1) * 60 * 60000 + (minute || 1) * 60000
}

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

export function today (date = new Date()) {
  const now = new Date(date)
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function month (date = new Date(), monthToAdd, lastDay) {
  const now = new Date(date)
  now.setUTCHours(0, 0, 0, 0)

  if (monthToAdd && monthToAdd !== 0) {
    now.setDate(1)
    now.setMonth(now.getMonth() + monthToAdd)
  }
  if (lastDay) {
    now.setMonth(now.getMonth() + 1)
    now.setHours(-1)
    return now
  } else {
    return new Date(date.getFullYear(), date.getMonth())
  }
}

export function monthJimmy (date = new Date(), monthToAdd, lastDay) {
  const now = new Date(date)
  now.setUTCHours(0, 0, 0, 0)

  if (monthToAdd && monthToAdd !== 0) {
    now.setDate(1)
    now.setMonth(now.getMonth() + monthToAdd)
  }
  if (lastDay) {
    now.setMonth(now.getMonth() + 1)
    now.setHours(-1)
    return now
  } else {
    return generalizeTimeZone(new Date(now))
  }
}

export function generalizeTimeZone (date) {
  if (date === undefined) return undefined
  else date.setMinutes(date.getMinutes() - date.getTimezoneOffset())

  return date
}

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

export function isSameMonthAndYear (date1, date2) {
  date1 = new Date(date1)
  date2 = new Date(date2)

  return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear()
}

export function workingDay (date) {
  return [1, 2, 3, 4, 5].indexOf(date.getDay()) !== -1
}

export function isDateBiggerThan (firstDate, secondDate) {
  firstDate = new Date(firstDate)
  secondDate = new Date(secondDate)

  return firstDate.getTime() >= secondDate.getTime()
}

export function getRangeOfMonthsAsObject (startDate, endDate, asObject = false) {
  const dates = new Array()
  const dateCounter = new Date(startDate)
  let monthlyL = {}

  dateCounter.setDate(1)

  while (dateCounter < endDate) {
    if (getShortMonthString(dateCounter) === 'Janv.')
      dates.push(
        `${getShortMonthString(dateCounter) + ' ' + dateCounter.getFullYear().toString().slice(-2)}`
      )
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

export function getShortMonthString (date) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return [
    'Janv.',
    'Févr.',
    'Mars',
    'Avr.',
    'Mai.',
    'Juin',
    'Juil.',
    'Août',
    'Sept.',
    'Oct.',
    'Nov.',
    'Déc.',
  ][date.getMonth()]
}

export function nbOfDays (startDate, endDate) {
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  const start = startDate

  if (start.getTime() === endDate.getTime()) return 0

  let nbOfDay = 0

  do {
    nbOfDay++
    start.setDate(start.getDate() + 1)
  } while (start.getTime() < endDate.getTime())
  return nbOfDay
}

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

export function checkIfDateIsNotToday (date) {
  const today = new Date()
  return (
    date &&
    (date.getDate() !== today.getDate() ||
      date.getMonth() !== today.getMonth() ||
      date.getFullYear() !== today.getFullYear())
  )
}

export function stringToDecimalDate (str) {
  if (str !== null || str !== '') {
    const strArray = str.split('h')
    return (parseInt(strArray[0]) * 60 + parseInt(strArray[1])) / 60
  }
}

export function decimalToStringDate (decimal) {
  if (decimal != null) {
    const strArray = String(decimal).split('.')
    const decimalMinute =
      strArray[1] && +strArray[1].length === 1 ? +strArray[1] * 10 : +strArray[1]
    let minute = strArray[1] ? String(Math.ceil((1 / 100) * decimalMinute * 60)) : '00'
    minute = minute.length === 1 ? '0' + minute : minute
    return strArray[0] + 'h' + minute
  }
  return ''
}
