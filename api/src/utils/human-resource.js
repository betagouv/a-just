import { minBy, orderBy, sumBy } from 'lodash'
import { getTime, isDateGreaterOrEqual, today } from '../utils/date'
import { checkAbort } from './abordTimeout'

/**
 * Calcul d'ETP à une date donnée pour un ensemble de ressources humaines
 * @param {*} referentielId
 * @param {*} date
 * @param {*} hr
 * @returns objet d'ETP détaillé
 */
export function getEtpByDateAndPerson(referentielId, date, hr, ddgFilter = false, absLabels = null, signal = null) {
  if (hr.dateEnd && today(hr.dateEnd) < today(date)) {
    return {
      etp: null,
      situation: null,
      reelEtp: null,
      indispoFiltred: [],
      nextDeltaDate: null,
      addDay: true,
    }
  }

  let addDay = true
  checkAbort(signal)
  const { currentSituation, nextSituation } = findSituation(hr, date, signal)
  const situation = currentSituation

  if (situation && situation.category && situation.category.id) {
    const activitiesFiltred = (situation.activities || []).filter((a) => a.contentieux && a.contentieux.id === referentielId)

    const indispoFiltred = findAllIndisponibilities(hr, date, ddgFilter, absLabels || [])

    let reelEtp = situation.etp - sumBy(indispoFiltred, 'percent') / 100
    if (reelEtp < 0) {
      reelEtp = 0
    }

    // trouve la date de fin d'indispo la plus proche
    let nextIndispoDate = null
    const allIndispoDatesEnd = indispoFiltred.filter((i) => i.dateStopTimesTamps && i.dateStopTimesTamps >= getTime(date)).map((i) => i.dateStopTimesTamps)
    if (allIndispoDatesEnd.length) {
      const min = minBy(allIndispoDatesEnd)
      nextIndispoDate = new Date(min)
    }

    const indispos = hr.indisponibilities || []
    let listAllDatesIndispoStart = indispos.filter((i) => i.dateStartTimesTamps && i.dateStartTimesTamps > getTime(date)).map((i) => i.dateStartTimesTamps)
    if (listAllDatesIndispoStart.length && (minBy(listAllDatesIndispoStart) <= getTime(nextIndispoDate) || !nextIndispoDate)) {
      const min = minBy(listAllDatesIndispoStart)
      nextIndispoDate = new Date(min)
      nextIndispoDate.setDate(nextIndispoDate.getDate() - 1)
    }

    let nextDeltaDate = null
    if (nextSituation) {
      nextDeltaDate = today(nextSituation.dateStart)
      nextDeltaDate.setDate(nextDeltaDate.getDate() - 1) // on enlève un jour pour que la date corresponde à la date de la situation
    }
    if (nextIndispoDate && (!nextDeltaDate || nextIndispoDate.getTime() <= nextDeltaDate.getTime())) {
      nextDeltaDate = nextIndispoDate
    }
    if ((!nextDeltaDate && hr.dateEnd) || (nextDeltaDate && hr.dateEnd && today(hr.dateEnd).getTime() < nextDeltaDate.getTime())) {
      nextDeltaDate = today(hr.dateEnd)
    }

    checkAbort(signal)

    return {
      etp: (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100,
      reelEtp,
      situation,
      indispoFiltred: !ddgFilter ? indispoFiltred : findAllIndisponibilities(hr, date),
      nextDeltaDate, // find the next date with have changes
      addDay,
    }
  }

  return {
    etp: null,
    situation: null,
    reelEtp: null,
    indispoFiltred: [],
    nextDeltaDate: hr.dateStart && today(hr.dateStart) > today(date) ? today(hr.dateStart) : null,
    addDay: hr.dateStart && today(hr.dateStart) > today(date) ? false : addDay,
  }
}

export function getEtpByDateAndPersonOld(referentielId, date, hr, ddgFilter = false, absLabels = null) {
  if (hr.dateEnd && today(hr.dateEnd) < today(date)) {
    if (hr.id === 36732) {
      //console.log(date,'return null for this date')
    }
    return {
      etp: null,
      situation: null,
      reelEtp: null,
      indispoFiltred: [],
      nextDeltaDate: null,
    }
  }

  const { currentSituation /*, nextSituation*/ } = findSituation(hr, date)
  const situation = currentSituation

  if (situation && situation.category && situation.category.id) {
    const activitiesFiltred = (situation.activities || []).filter((a) => a.contentieux && a.contentieux.id === referentielId)

    const indispoFiltred = findAllIndisponibilities(hr, date, ddgFilter, absLabels)

    let reelEtp = situation.etp - sumBy(indispoFiltred, 'percent') / 100
    if (reelEtp < 0) {
      reelEtp = 0
    }

    //const nextIndispoDate = getNextIndisponiblitiesDate(hr, date)
    let nextDeltaDate = null
    /*if(nextSituation) {
      nextDeltaDate = today(nextSituation.dateStart)
    }
    if(nextIndispoDate && (!nextDeltaDate || nextIndispoDate.getTime() < nextDeltaDate.getTime())) {
      nextDeltaDate = nextIndispoDate
    }*/

    return {
      etp: (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100,
      reelEtp,
      situation,
      indispoFiltred: !ddgFilter ? indispoFiltred : findAllIndisponibilities(hr, date),
      nextDeltaDate, // find the next date with have changes
    }
  }

  return {
    etp: null,
    situation: null,
    reelEtp: null,
    indispoFiltred: [],
    nextDeltaDate: null,
  }
}

/**
 * Calcul d'ETP à une date donnée pour un ensemble de ressources humaines et un contentieux donné
 * @param {*} referentielId
 * @param {*} date
 * @param {*} hr
 * @returns objet d'ETP détaillé
 */
export async function getEtpByDateAndPersonSimu(referentielId, date, hr, signal = null) {
  const { currentSituation: situation, nextSituation } = findSituation(hr, date)

  if (situation && situation.category && situation.category.id) {
    // console.log(referentielId, date, hr)
    const activitiesFiltred = await (situation.activities || []).filter((a) => a.contentieux && referentielId.includes(a.contentieux.id))
    checkAbort(signal)

    const indispoFiltred = findAllIndisponibilities(hr, date)
    let reelEtp = situation.etp - sumBy(indispoFiltred, 'percent') / 100
    if (reelEtp < 0) {
      reelEtp = 0
    }

    const nextIndispoDate = getNextIndisponiblitiesDate(hr, date)
    let nextDeltaDate = null
    if (nextSituation) {
      nextDeltaDate = today(nextSituation.dateStart)
    }
    if (nextIndispoDate && (!nextDeltaDate || nextIndispoDate.getTime() < nextDeltaDate.getTime())) {
      nextDeltaDate = nextIndispoDate
    }

    return {
      etp: (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100,
      reelEtp,
      situation,
      indispoFiltred,
      nextDeltaDate, // find the next date with have changes
    }
  }

  return {
    etp: null,
    situation: null,
    indispoFiltred: [],
    nextDeltaDate: null,
  }
}

/**
 * Récupère la prochaine date d'indisponibilité d'une ressource humaine
 * @param {*} hr
 * @param {*} dateSelected
 * @returns date de la prochaine indispo
 */
export const getNextIndisponiblitiesDate = (hr, dateSelected) => {
  dateSelected = today(dateSelected).getTime()
  const indispos = hr.indisponibilities || []
  let listAllDates = indispos.filter((i) => i.dateStartTimesTamps).map((i) => i.dateStartTimesTamps)
  listAllDates = listAllDates.concat(indispos.filter((i) => i.dateStopTimesTamps).map((i) => i.dateStopTimesTamps))

  listAllDates = listAllDates.filter((date) => date > dateSelected)

  const min = minBy(listAllDates)
  return min ? new Date(min) : null
}

/**
 * Retourne la situation d'une personne à une date donnée
 * @param {*} hr
 * @param {*} date
 * @param {*} reelEtp
 * @returns objet contenant la situation en cours et la prochaine situation
 */
export const findSituation = (hr, date, signal = null) => {
  checkAbort(signal)
  if (date) {
    date = today(date)
  }

  if (hr && hr.dateEnd && date) {
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
  const situationsInTheFutur = findAllFuturSituations(hr, date)
  checkAbort(signal)
  return {
    currentSituation: situations.length ? situations[0] : null,
    nextSituation: situationsInTheFutur.length ? situationsInTheFutur[situationsInTheFutur.length - 1] : null,
  }
}

/**
 * Retourne la liste de toutes les situaitons futures
 */
export const findAllFuturSituations = (hr, date) => {
  date = today(date)
  let situations = hr && hr.situations && hr.situations.length ? hr.situations : []

  if (date) {
    const getTime = date.getTime()
    const findedSituations = situations.filter((hra) => {
      return hra.dateStartTimesTamps > getTime
    })

    situations = findedSituations.slice(0)
  }

  return situations
}

/**
 * Retourne l'ensemble des situations passées d'une personne
 * @param {*} hr
 * @param {*} date
 * @returns liste de situation
 */
export const findAllSituations = (hr, date, order = 'desc', inFuture = false) => {
  let situations = orderBy(
    hr?.situations || [],
    [
      function (o) {
        const date = new Date(o.dateStart)
        return date.getTime()
      },
    ],
    // @ts-ignore
    [order],
  )

  if (date) {
    situations = situations.filter((hra) => {
      const dateStart = today(hra.dateStart)
      if (!inFuture) {
        return dateStart.getTime() <= date.getTime()
      } else {
        return dateStart.getTime() > date.getTime()
      }
    })
  }

  return situations
}

/**
 * Retourne la liste des indisponibilités
 * @param {*} hr
 * @param {*} date
 * @returns liste des indisponibilités filtrées
 */
const findAllIndisponibilities = (hr, date, ddgFilter = false, absLabels = []) => {
  let indisponibilities = hr && hr.indisponibilities && hr.indisponibilities.length ? hr.indisponibilities : []

  if (date instanceof Date) {
    date = today(date)
    indisponibilities = indisponibilities.filter((hra) => {
      const dateStart = today(hra.dateStart)
      if (date && isDateGreaterOrEqual(date, dateStart)) {
        if (hra.dateStop) {
          const dateStop = today(hra.dateStop)
          if (isDateGreaterOrEqual(dateStop, date)) {
            const d1 = new Date(2024, 8, 20)
            if (hr.id === 36732) {
              //console.log('date passed for indispo count',date,'end indispo date',dateStop)
            }

            if (!ddgFilter) return true
            else if (absLabels.includes(hra.contentieux.label) === false) return true
          }
        } else {
          // return true if they are no end date
          if (!ddgFilter) return true
          else if (absLabels.includes(hra.contentieux.label) === false) return true
        }
      }

      return false
    })
  }

  if (hr.id === 36429 && indisponibilities.length) {
    console.log('date indisp', date, indisponibilities[0].percent)
  }
  return indisponibilities
}

/**
 * TESTS
 * */
const HR_TO_TEST = {
  id: 1748,
  firstName: 'Aurélie',
  lastName: 'Lallart',
  matricule: '45661',
  dateStart: new Date('2019-09-01T22:00:00.000Z'),
  dateEnd: null,
  coverUrl: null,
  updatedAt: new Date('2024-04-02T08:16:48.377Z'),
  backupId: 16,
  juridiction: null,
  comment: '<p>Présidence 6ème chambre correctionnelle + "autre civil NS" = présidence de la Comex 1 mois sur 2</p>',
  situations: [
    {
      id: 15001,
      etp: 1,
      dateStart: new Date('2025-09-01T23:00:00.000Z'),
      dateStartTimesTamps: 1756767600000,
      category: { id: 1, rank: 1, label: 'Magistrat' },
      fonction: { id: 15, rank: 16, code: 'J', label: 'JUGE', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false },
      activities: [
        { id: 56031, percent: 22.5, contentieux: { id: 486, label: 'Siège Pénal' } },
        { id: 56030, percent: 67.5, contentieux: { id: 448, label: "Départage prud'homal" } },
        { id: 56034, percent: 10, contentieux: { id: 497, label: 'Autres activités' } },
        { id: 56032, percent: 12.5, contentieux: { id: 487, label: 'Collégiales hors JIRS' } },
        { id: 56033, percent: 10, contentieux: { id: 492, label: 'Tribunal de police' } },
        { id: 56029, percent: 67.5, contentieux: { id: 447, label: 'Contentieux Social' } },
        { id: 56035, percent: 10, contentieux: { id: 498, label: 'Soutien (hors formations suivies)' } },
      ],
    },
    {
      id: 15000,
      etp: 1,
      dateStart: new Date('2025-07-01T23:00:00.000Z'),
      dateStartTimesTamps: 1751410800000,
      category: { id: 1, rank: 1, label: 'Magistrat' },
      fonction: { id: 15, rank: 16, code: 'J', label: 'JUGE', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false },
      activities: [
        { id: 56031, percent: 22.5, contentieux: { id: 486, label: 'Siège Pénal' } },
        { id: 56030, percent: 67.5, contentieux: { id: 448, label: "Départage prud'homal" } },
        { id: 56034, percent: 10, contentieux: { id: 497, label: 'Autres activités' } },
        { id: 56032, percent: 12.5, contentieux: { id: 487, label: 'Collégiales hors JIRS' } },
        { id: 56033, percent: 10, contentieux: { id: 492, label: 'Tribunal de police' } },
        { id: 56029, percent: 67.5, contentieux: { id: 447, label: 'Contentieux Social' } },
        { id: 56035, percent: 10, contentieux: { id: 498, label: 'Soutien (hors formations suivies)' } },
      ],
    },
    {
      id: 14388,
      etp: 1,
      dateStart: new Date('2023-01-01T23:00:00.000Z'),
      dateStartTimesTamps: 1672660800000,
      category: { id: 1, rank: 1, label: 'Magistrat' },
      fonction: { id: 15, rank: 16, code: 'J', label: 'JUGE', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false },
      activities: [
        { id: 56031, percent: 22.5, contentieux: { id: 486, label: 'Siège Pénal' } },
        { id: 56030, percent: 67.5, contentieux: { id: 448, label: "Départage prud'homal" } },
        { id: 56034, percent: 10, contentieux: { id: 497, label: 'Autres activités' } },
        { id: 56032, percent: 12.5, contentieux: { id: 487, label: 'Collégiales hors JIRS' } },
        { id: 56033, percent: 10, contentieux: { id: 492, label: 'Tribunal de police' } },
        { id: 56029, percent: 67.5, contentieux: { id: 447, label: 'Contentieux Social' } },
        { id: 56035, percent: 10, contentieux: { id: 498, label: 'Soutien (hors formations suivies)' } },
      ],
    },
    {
      id: 14387,
      etp: 1,
      dateStart: new Date('2022-01-02T23:00:00.000Z'),
      dateStartTimesTamps: 1641211200000,
      category: { id: 1, rank: 1, label: 'Magistrat' },
      fonction: { id: 15, rank: 16, code: 'J', label: 'JUGE', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false },
      activities: [
        { id: 56031, percent: 22.5, contentieux: { id: 486, label: 'Siège Pénal' } },
        { id: 56030, percent: 67.5, contentieux: { id: 448, label: "Départage prud'homal" } },
        { id: 56034, percent: 10, contentieux: { id: 497, label: 'Autres activités' } },
        { id: 56032, percent: 12.5, contentieux: { id: 487, label: 'Collégiales hors JIRS' } },
        { id: 56033, percent: 10, contentieux: { id: 492, label: 'Tribunal de police' } },
        { id: 56029, percent: 67.5, contentieux: { id: 447, label: 'Contentieux Social' } },
        { id: 56035, percent: 10, contentieux: { id: 498, label: 'Soutien (hors formations suivies)' } },
      ],
    },
    {
      id: 2819,
      etp: 1,
      dateStart: new Date('2020-12-31T23:00:00.000Z'),
      dateStartTimesTamps: 1609502400000,
      category: { id: 1, rank: 1, label: 'Magistrat' },
      fonction: { id: 15, rank: 16, code: 'J', label: 'JUGE', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false },
      activities: [
        { id: 56031, percent: 22.5, contentieux: { id: 486, label: 'Siège Pénal' } },
        { id: 56030, percent: 67.5, contentieux: { id: 448, label: "Départage prud'homal" } },
        { id: 56034, percent: 10, contentieux: { id: 497, label: 'Autres activités' } },
        { id: 56032, percent: 12.5, contentieux: { id: 487, label: 'Collégiales hors JIRS' } },
        { id: 56033, percent: 10, contentieux: { id: 492, label: 'Tribunal de police' } },
        { id: 56029, percent: 67.5, contentieux: { id: 447, label: 'Contentieux Social' } },
        { id: 56035, percent: 10, contentieux: { id: 498, label: 'Soutien (hors formations suivies)' } },
      ],
    },
    {
      id: 2376,
      etp: 1,
      dateStart: new Date('2019-09-01T22:00:00.000Z'),
      dateStartTimesTamps: 1567425600000,
      category: { id: 1, rank: 1, label: 'Magistrat' },
      fonction: { id: 15, rank: 16, code: 'J', label: 'JUGE', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false },
      activities: [
        { id: 56031, percent: 22.5, contentieux: { id: 486, label: 'Siège Pénal' } },
        { id: 56030, percent: 67.5, contentieux: { id: 448, label: "Départage prud'homal" } },
        { id: 56034, percent: 10, contentieux: { id: 497, label: 'Autres activités' } },
        { id: 56032, percent: 12.5, contentieux: { id: 487, label: 'Collégiales hors JIRS' } },
        { id: 56033, percent: 10, contentieux: { id: 492, label: 'Tribunal de police' } },
        { id: 56029, percent: 67.5, contentieux: { id: 447, label: 'Contentieux Social' } },
        { id: 56035, percent: 10, contentieux: { id: 498, label: 'Soutien (hors formations suivies)' } },
      ],
    },
  ],
  indisponibilities: [],
}
//console.log('findSituation - test 1', getEtpByDateAndPerson(447, new Date('2024-04-02T12:00:00.000Z'), HR_TO_TEST))
