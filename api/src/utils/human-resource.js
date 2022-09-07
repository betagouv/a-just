import { sumBy } from 'lodash'
import { today } from '../utils/date'

export function getEtpByDateAndPerson (referentielId, date, hr) {
  const situation = findSituation(hr, date)

  if (situation && situation.category && situation.category.id) {
    const activitiesFiltred = (situation.activities || []).filter(
      (a) => a.contentieux && a.contentieux.id === referentielId
    )
    const indispoFiltred = findAllIndisponibilities(hr, date)
    let reelEtp = situation.etp - sumBy(indispoFiltred, 'percent') / 100
    if (reelEtp < 0) {
      reelEtp = 0
    }

    return {
      etp: (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100,
      situation,
    }
  }

  return {
    etp: null,
    situation: null,
  }
}

export async function getEtpByDateAndPersonSimu (referentielId, date, hr) {
  const situation = findSituation(hr, date)

  if (situation && situation.category && situation.category.id) {
    const activitiesFiltred = (situation.activities || []).filter(
      (a) => a.contentieux && a.contentieux.id === referentielId
    )

    const indispoFiltred = findAllIndisponibilities(hr, date)
    let reelEtp = situation.etp - sumBy(indispoFiltred, 'percent') / 100
    if (reelEtp < 0) {
      reelEtp = 0
    }
    /**console.log('latuile', {
      situ: situation.etp,
      indispoFiltred: sumBy(indispoFiltred, 'percent') / 100,
      activitiesFiltred: sumBy(activitiesFiltred, 'percent') / 100,
      activitiesFiltredSim: activitiesFiltred.filter((x) => x.contentieux),
      reelEtp,
    });*/
    return {
      etp: (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100,
      situation,
    }
  }

  return {
    etp: null,
    situation: null,
  }
}

export const findSituation = (hr, date) => {
  if (date) {
    date = today(date)
  }

  if (hr && hr.dateEnd && date) {
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
  let situations = findAllSituations(hr, date)
  return situations.length ? situations[0] : null
}

export const findAllSituations = (hr, date) => {
  let situations = hr && hr.situations && hr.situations.length ? hr.situations : []

  if (date) {
    situations = situations.filter((hra) => {
      const dateStart = today(hra.dateStart)
      return dateStart.getTime() <= date.getTime()
    })
  }

  return situations
}

const findAllIndisponibilities = (hr, date) => {
  let indisponibilities = hr && hr.indisponibilities && hr.indisponibilities.length ? hr.indisponibilities : []

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
