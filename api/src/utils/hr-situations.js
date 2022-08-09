import { orderBy } from 'lodash'
import { today } from './date'

export const findSituation = (hr, date, order = 'desc') => {
  if (date) {
    date = today(date)
  }

  if (hr.dateEnd && date) {
    // control de date when the person goone
    const dateEnd = today(hr.dateEnd)
    if (dateEnd.getTime() < date.getTime()) {
      return {
        id: 0,
        etp: 0,
        category: null,
        fonction: null,
        dateStart: dateEnd,
        activities: [],
      }
    }
  }
  let situations = findAllSituations(hr, date, order)
  return situations.length ? situations[0] : null
}

export const findAllSituations = (hr, date, order = 'desc') => {
  let situations = orderBy(
    hr.situations || [],
    [
      function (o) {
        const date = new Date(o.dateStart)
        return date.getTime()
      },
    ],
    // @ts-ignore
    [order]
  )

  if (date) {
    situations = situations.filter((hra) => {
      const dateStart = today(hra.dateStart)
      return dateStart.getTime() <= date.getTime()
    })
  }

  return situations
}
