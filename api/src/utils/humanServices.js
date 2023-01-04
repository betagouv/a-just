import { orderBy, uniqBy } from 'lodash'
import { today } from './date'

/**
 * Retourne une liste de human ressource
 */
export async function getHumanRessourceList (preformatedAllHumanResource, contentieuxIds = undefined, categoriesIds, date, endPeriodToCheck = undefined) {
  const list = preformatedAllHumanResource.filter((hr) => {
    let isOk = true

    if (hr.category && categoriesIds && categoriesIds.indexOf(hr.category.id) === -1) {
      isOk = false
    }

    if (hr.dateEnd && hr.dateEnd.getTime() < date.getTime()) {
      isOk = false
    }

    if (endPeriodToCheck) {
      if (hr.dateStart && hr.dateStart.getTime() > endPeriodToCheck.getTime()) {
        isOk = false
      }
    } else {
      if (hr.dateStart && hr.dateStart.getTime() > date.getTime()) {
        isOk = false
      }
    }

    return isOk
  })
  console.timeEnd('step3')
  console.time('step4')

  if (!contentieuxIds) return list

  return list.filter((h) => {
    const idsOfactivities = h.currentActivities.map((a) => (a.contentieux && a.contentieux.id) || 0)
    for (let i = 0; i < idsOfactivities.length; i++) {
      if (contentieuxIds.indexOf(idsOfactivities[i]) !== -1) {
        return true
      }
    }

    return false
  })
}

/**
 * Filtre les activités par date
 * @param {*} list
 * @param {*} date
 * @returns liste d'activité filtrée
 */
export function filterActivitiesByDate (list, date) {
  list = orderBy(list || [], ['dateStart'], ['desc'])
  list = list.filter((a) => {
    const dateStop = a.dateStop ? today(a.dateStop) : null
    const dateStart = a.dateStart ? today(a.dateStart) : null

    return (
      (dateStart === null && dateStop === null) ||
      (dateStart && dateStart.getTime() <= date.getTime() && dateStop === null) ||
      (dateStart === null && dateStop && dateStop.getTime() >= date.getTime()) ||
      (dateStart && dateStart.getTime() <= date.getTime() && dateStop && dateStop.getTime() >= date.getTime())
    )
  })

  return uniqBy(list, 'referentielId')
}
