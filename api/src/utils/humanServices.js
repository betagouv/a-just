import { orderBy, uniqBy } from 'lodash'
import { today } from './date'

/**
 * Retourne une liste de human ressource
 */
export async function getHumanRessourceList(
  preformatedAllHumanResource,
  contentieuxIds = undefined,
  subContentieuxIds = undefined,
  categoriesIds,
  date,
  endPeriodToCheck = undefined,
  acceptAgentWithoutVentilation = false,
) {
  let list = preformatedAllHumanResource.filter((hr) => {
    let isOk = true

    if (hr.category && categoriesIds && categoriesIds.indexOf(hr.category.id) === -1) {
      isOk = false
    }

    if (hr.dateEnd && today(hr.dateEnd).getTime() < date.getTime()) {
      isOk = false
    }

    if (endPeriodToCheck) {
      if (hr.dateStart && today(hr.dateStart).getTime() > endPeriodToCheck.getTime()) {
        isOk = false
      }
    } else {
      if (hr.dateStart && today(hr.dateStart).getTime() > date.getTime()) {
        isOk = false
      }
    }

    return isOk
  })

  if (subContentieuxIds) {
    list = list.filter((h) => {
      const idsOfactivities = h.currentActivities.filter((a) => a.percent).map((a) => (a.contentieux && a.contentieux.id) || 0)
      if (acceptAgentWithoutVentilation && idsOfactivities.length === 0) {
        return true
      }

      for (let i = 0; i < idsOfactivities.length; i++) {
        if (subContentieuxIds.indexOf(idsOfactivities[i]) !== -1) {
          return true
        }
      }

      return false
    })
  }

  if (contentieuxIds) {
    list = list.filter((h) => {
      const idsOfactivities = h.currentActivities.filter((a) => a.percent).map((a) => (a.contentieux && a.contentieux.id) || 0)
      if (acceptAgentWithoutVentilation && idsOfactivities.length === 0) {
        return true
      }

      for (let i = 0; i < idsOfactivities.length; i++) {
        if (contentieuxIds.indexOf(idsOfactivities[i]) !== -1) {
          return true
        }
      }

      return false
    })
  }

  return list
}

/**
 * Filtre les activités par date
 * @param {*} list
 * @param {*} date
 * @returns liste d'activité filtrée
 */
export function filterActivitiesByDate(list, date) {
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
