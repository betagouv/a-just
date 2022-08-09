import { orderBy } from 'lodash'
import { today } from './date'

export const findAllIndisponibilities = (hr, date) => {
  let indisponibilities = orderBy(
    hr.indisponibilities || [],
    [
      function (o) {
        const date = o.dateStart ? new Date(o.dateStart) : new Date()
        return date.getTime()
      },
    ],
    ['desc']
  )

  if (date) {
    date = today(date)
    indisponibilities = indisponibilities.filter((hra) => {
      const dateStart = today(hra.dateStart)

      if (date && dateStart.getTime() <= date.getTime()) {
        if (hra.dateStop) {
          const dateStop = today(hra.dateStop)
          if (dateStop.getTime() >= date.getTime()) {
            return true
          }
        } else {
          // return true if they are no end date
          return true
        }
      }

      return false
    })
  }

  return indisponibilities
}