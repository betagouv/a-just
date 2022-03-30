import { orderBy, uniqBy } from 'lodash'
import { today } from './date'

export function filterActivitiesByDate (
  list,
  date
) {
  list = orderBy(list || [], ['dateStart'], ['desc'])
  list = list.filter((a) => {
    const dateStop = a.dateStop ? today(a.dateStop) : null
    const dateStart = a.dateStart ? today(a.dateStart) : null

    return (
      (dateStart === null && dateStop === null) ||
      (dateStart &&
        dateStart.getTime() <= date.getTime() &&
        dateStop === null) ||
      (dateStart === null &&
        dateStop &&
        dateStop.getTime() >= date.getTime()) ||
      (dateStart &&
        dateStart.getTime() <= date.getTime() &&
        dateStop &&
        dateStop.getTime() >= date.getTime())
    )
  })

  return uniqBy(list, 'referentielId')
}

export function findSituation (hr, date) {
  let situations = findAllSituations(hr, date)

  return situations.length ? situations[0] : null
}

export function findAllSituations (hr, date) {
  let situations = orderBy(
    (hr && hr.situations) || [],
    [
      (o) => {
        const d = today(o.dateStart)
        return d.getTime()
      },
    ],
    ['desc']
  )

  if (date) {
    situations = situations.filter((hra) => {
      const dateStart = today(hra.dateStart)
      return dateStart.getTime() <= date.getTime()
    })
  }

  return situations
}