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

export function today(date = new Date()): Date {
    const now = new Date(date)
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function month(
    date = new Date(),
    monthToAdd?: number,
    lastDay?: string
) {
    const now = new Date(date)
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
