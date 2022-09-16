import { toInteger } from 'lodash'
import { environment } from 'src/environments/environment'

export function monthDiff(d1: Date, d2: Date) {
  var months
  months = (d2.getFullYear() - d1.getFullYear()) * 12
  months -= d1.getMonth()
  months += d2.getMonth()
  return months <= 0 ? 0 : months
}

export function workingDay(date: Date) {
  return [1, 2, 3, 4, 5].indexOf(date.getDay()) !== -1
}

export function getMonthString(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ][date.getMonth()]
}

export function getShortMonthString(date: Date | string) {
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

export function getLongMonthString(shortString: string) {
  switch (shortString) {
    case 'Janv.':
      return 'Janvier'
    case 'Févr.':
      return 'Février'
    case 'Mars.':
      return 'Mars'
    case 'Avr.':
      return 'Avril'
    case 'Mai.':
      return 'Mai'
    case 'Juin.':
      return 'Juin'
    case 'Juil.':
      return 'Juillet'
    case 'Août.':
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
export function today(date: Date | null | undefined = new Date()): Date {
  let now = new Date()
  if (date) {
    now = new Date(date)
  }
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function month(
  date: Date | null = new Date(),
  monthToAdd?: number,
  lastDay?: string
) {
  const now = new Date(date ? date : '')
  if (monthToAdd) {
    now.setDate(1)
    now.setMonth(now.getMonth() + monthToAdd)
  }
  return lastDay
    ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
    : new Date(now.getFullYear(), now.getMonth())
}

export function nbOfWorkingDays(startDate: Date, endDate: Date) {
  const start = new Date(startDate)
  let nbOfWorkingDays = 0
  do {
    if (workingDay(start)) nbOfWorkingDays++
    start.setDate(start.getDate() + 1)
  } while (start.getTime() <= endDate.getTime())
  return nbOfWorkingDays
}

export function nbOfDays(startDate: Date, endDate: Date) {
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  let nbOfDay = 0
  do {
    nbOfDay++
    start.setDate(start.getDate() + 1)
  } while (start.getTime() <= endDate.getTime())
  return nbOfDay
}

export function dateAddDays(date: Date, nbDays: number = 0) {
  date = new Date(date)
  date.setDate(date.getDate() + nbDays)
  return date
}

export function findRealValue(date: Date) {
  const today = new Date()
  if (
    today.getDate() === date.getDate() &&
    today.getMonth() === date.getMonth() &&
    today.getFullYear() === date.getFullYear()
  )
    return ''
  else if (date && typeof date.getMonth === 'function') {
    return `${(date.getDate() + '').padStart(2, '0')} ${getShortMonthString(
      date
    )} ${date.getFullYear()}`
  } else return ''
}

export function monthDiffList(dateFrom: Date, dateTo: Date | null): number[] {
  if (dateTo)
    return [
      ...Array(
        dateTo.getMonth() -
          dateFrom.getMonth() +
          12 * (dateTo.getFullYear() - dateFrom.getFullYear())
      ).keys(),
    ]
  else return []
}

export function decimalToStringDate(decimal: number | null | undefined) {
  if (decimal != null) {
    const strArray = String(decimal).split('.')
    const dMin = decimal - parseInt(strArray[0])
    let minute = strArray[1] ? String(Math.round(dMin * 60)) : '00'
    minute = minute.length === 1 ? '0' + minute : minute
    return strArray[0] + 'h' + minute
  }
  return '0'
}

export function getRangeOfMonths(startDate: Date, endDate: Date) {
  const dates = new Array<string>()
  const dateCounter = new Date(startDate)

  // avoids edge case where last month is skipped
  dateCounter.setDate(1)
  while (dateCounter < endDate) {
    //if (getShortMonthString(dateCounter) === 'Janv.')
    dates.push(
      `${
        getShortMonthString(dateCounter) +
        ' ' +
        dateCounter.getFullYear().toString().slice(-2)
      }`
    )
    //else dates.push(`${getShortMonthString(dateCounter)}`)

    dateCounter.setMonth(dateCounter.getMonth() + 1)
  }

  if (dates.length === 1) return [dates[0], dates[0]]

  return dates
}

export function getRangeOfMonthsAsObject(
  startDate: Date,
  endDate: Date,
  asObject = false
) {
  const dates = new Array<string>()
  const dateCounter = new Date(startDate)
  let monthlyL: { [key: string]: any } = {}

  dateCounter.setDate(1)

  while (dateCounter <= endDate) {
    if (getShortMonthString(dateCounter) === 'Janv.')
      dates.push(
        `${
          getShortMonthString(dateCounter) +
          ' ' +
          dateCounter.getFullYear().toString().slice(-2)
        }`
      )
    else dates.push(`${getShortMonthString(dateCounter)}`)

    const str: string =
      getShortMonthString(dateCounter) +
      dateCounter.getFullYear().toString().slice(-2)
    if (asObject) {
      monthlyL[str] = { ...{} }
    }
    dateCounter.setMonth(dateCounter.getMonth() + 1)
  }

  if (asObject) return { ...monthlyL }

  if (dates.length === 1) return [dates[0], dates[0]]

  return dates
}

export function isFirstDayOfMonth(date = new Date()) {
  return date.getDate() === 1
}

export function isDateBiggerThan(
  firstDate: string | Date,
  secondDate: string | Date
): boolean {
  firstDate = new Date(firstDate)
  secondDate = new Date(secondDate)

  return firstDate.getTime() >= secondDate.getTime()
}

export function nbHourInMonth(date: Date = new Date()) {
  const dateStart = new Date(date.getFullYear(), date.getMonth())
  const dateStop = new Date(dateStart)
  dateStop.setMonth(dateStop.getMonth() + 1)

  let nbDay = 0
  do {
    // only working day
    if (workingDay(dateStart)) {
      nbDay++
    }
    dateStart.setDate(dateStart.getDate() + 1)
  } while (dateStart.getTime() < dateStop.getTime())

  return nbDay * environment.nbHoursPerDay
}

export function generalizeTimeZone(date: Date | undefined) {
  if (date === undefined) return undefined
  else return date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
}
