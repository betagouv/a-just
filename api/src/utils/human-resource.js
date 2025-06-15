import { minBy, orderBy, sumBy } from 'lodash'
import { getTime, isDateGreaterOrEqual, today, workingDay } from '../utils/date'
import { checkAbort } from './abordTimeout'
import { fixDecimal } from './number'

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

export const buildIndexes = (hrList) => {
  const indexes = {
    timelineIndex: {},
    contentieuxIndex: {},
    categoryIndex: {},
    hrData: {},
  }

  // Helper corrigé pour les dates
  const getDayKey = (date) => {
    const d = new Date(date)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  }

  // Helper pour vérifier les jours ouvrés
  const isWorkingDay = (date) => {
    const day = new Date(date).getDay()
    return day !== 0 && day !== 6 // Exclut samedi/dimanche
  }

  hrList.forEach((hr) => {
    // 1. Données de base HR
    indexes.hrData[hr.id] = {
      etp: hr.situations?.[0]?.etp || 0,
      indispos: (hr.indisponibilities || []).map((ind) => ({
        start: getDayKey(ind.dateStart),
        end: ind.dateStop ? getDayKey(ind.dateStop) : null,
        percent: ind.percent,
        type: ind.contentieux?.label || '',
      })),
      currentCategory: hr.situations?.[0]?.category?.id,
    }

    // 2. Index par catégorie
    const categoryId = hr.situations?.[0]?.category?.id
    if (categoryId) {
      indexes.categoryIndex[categoryId] = indexes.categoryIndex[categoryId] || new Set()
      indexes.categoryIndex[categoryId].add(hr.id)
    }

    // 3. Parcours des situations
    ;(hr.situations || []).forEach((sit) => {
      const startDate = getDayKey(sit.dateStart)
      const endDate = sit.dateEnd ? getDayKey(sit.dateEnd) : getDayKey(new Date())

      // 4. Parcours jour par jour
      for (let day = startDate; day <= endDate; day += 86400000) {
        if (!isWorkingDay(day)) continue

        // 5. Index temporel
        indexes.timelineIndex[day] = indexes.timelineIndex[day] || new Set()
        indexes.timelineIndex[day].add(hr.id)

        // 6. Index par contentieux
        ;(sit.activities || []).forEach((act) => {
          if (!act?.contentieux?.id) return

          const contentieuxId = act.contentieux.id
          indexes.contentieuxIndex[contentieuxId] = indexes.contentieuxIndex[contentieuxId] || {}
          indexes.contentieuxIndex[contentieuxId][hr.id] = indexes.contentieuxIndex[contentieuxId][hr.id] || {
            dates: new Set(),
            percent: act.percent,
            category: sit.category?.id,
          }
          indexes.contentieuxIndex[contentieuxId][hr.id].dates.add(day)
        })
      }
    })
  })

  return indexes
}

export const getHRPositionsOptimized = (indexes, referentielId, dateStart, dateStop) => {
  const results = {}
  const startKey = dateStart.setHours(0, 0, 0, 0)
  const endKey = dateStop.setHours(0, 0, 0, 0)

  // 1. Trouver tous les HR concernés par ce contentieux
  const hrIds = Object.keys(indexes.contentieuxIndex[referentielId] || {})

  // 2. Calcul pour chaque catégorie
  hrIds.forEach((hrId) => {
    const hrInfo = indexes.contentieuxIndex[referentielId][hrId]
    const categoryId = hrInfo.category
    const hrData = indexes.hrData[hrId]

    if (!categoryId) return

    // Compter les jours concernés dans la période
    let totalDays = 0
    hrInfo.dates.forEach((dateKey) => {
      if (dateKey >= startKey && dateKey <= endKey) totalDays++
    })

    if (totalDays === 0) return

    // Calcul ETP pondéré (en tenant compte des indispos)
    const avgIndispo = calculateAvgIndispo(hrData.indispos, startKey, endKey)

    const effectiveETP = hrData.etp * (1 - avgIndispo)
    const etpContentieux = effectiveETP * (hrInfo.percent / 100)

    // Aggrégation par catégorie
    results[categoryId] = results[categoryId] || {
      etpt: 0,
      indispo: 0,
      reelEtp: 0,
      count: 0,
    }

    results[categoryId].etpt += etpContentieux
    results[categoryId].indispo += avgIndispo
    results[categoryId].reelEtp += effectiveETP
    results[categoryId].count++
  })

  // Formattage final
  return Object.entries(results).map(([categoryId, data]) => ({
    categoryId,
    etpt: fixDecimal(data.etpt, 10000),
    indispo: data.indispo / data.count,
    reelEtp: fixDecimal(data.reelEtp, 10000),
  }))
}

// Helper pour calculer l'indispo moyenne sur une période
export const calculateAvgIndispo = (indispos, startKey, endKey) => {
  let totalDays = 0
  let indispoDays = 0

  for (let day = startKey; day <= endKey; day += 86400000) {
    if (!workingDay(new Date(day))) continue

    totalDays++
    const dayIndispo = indispos.find((ind) => day >= ind.start && (ind.end === null || day <= ind.end))
    if (dayIndispo) indispoDays += dayIndispo.percent / 100
  }

  return totalDays > 0 ? indispoDays / totalDays : 0
}

export const formatHRData = (agent) => {
  if (!agent || !agent.situations?.length) return []

  const parseDate = (date) => (date ? new Date(date) : null)

  const dateStart = parseDate(agent.dateStart)
  const dateEnd = parseDate(agent.dateEnd) // peut être null

  // 1. Préparation des situations triées
  const sortedSituations = [...agent.situations].filter((s) => s.dateStart).sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart))

  const result = []

  for (let i = 0; i < sortedSituations.length; i++) {
    const situation = sortedSituations[i]
    const start = new Date(situation.dateStart)
    const nextSituation = sortedSituations[i + 1]
    let end = nextSituation ? new Date(nextSituation.dateStart) : null

    // Cas où l'agent est toujours en poste sans dateEnd
    if (!end && agent.dateEnd) end = new Date(agent.dateEnd)
    if (!end && !agent.dateEnd) end = null // situation en cours

    // 2. Application des indisponibilités
    const periods = splitByIndispos(start, end, agent.indisponibilites || [])

    for (const p of periods) {
      const effectiveETP = situation.etp * (1 - p.absenceRate) // ajusté
      result.push({
        start: p.start,
        end: p.end,
        etp: roundETP(effectiveETP),
        category: situation.category,
        fonction: situation.fonction,
        activities: situation.activities || [],
      })
    }
  }

  return result
}

// 3. Découpe une période stable en sous-périodes selon les indisponibilités
export const splitByIndispos = (start, end, indispos) => {
  const periods = []
  const originEnd = end

  const relevantIndispos = indispos
    .filter((indispo) => {
      const iStart = new Date(indispo.start)
      const iEnd = new Date(indispo.end)
      return (!end || iStart < end) && iEnd > start
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start))

  let current = new Date(start)

  for (const indispo of relevantIndispos) {
    const iStart = new Date(indispo.start)
    const iEnd = new Date(indispo.end)

    // Si l'indispo commence après la fin de la période => on saute
    if (end && iStart >= end) break

    if (iStart > current) {
      // Période pleine activité avant l’indispo
      periods.push({
        start: new Date(current),
        end: new Date(iStart),
        absenceRate: 0,
      })
    }

    // Chevauchement avec la période stable
    const sliceStart = iStart < current ? current : iStart
    const sliceEnd = end ? new Date(Math.min(iEnd, end)) : new Date(iEnd)

    periods.push({
      start: sliceStart,
      end: sliceEnd,
      absenceRate: indispo.percent / 100,
    })

    current = sliceEnd
  }

  // S'il reste une période après la dernière indispo
  if (!end || current < end) {
    periods.push({
      start: new Date(current),
      end: end,
      absenceRate: 0,
    })
  }

  return periods
}

// 4. Arrondi de l’ETP à 4 décimales
export const roundETP = (value) => {
  return Math.round((value + Number.EPSILON) * 10000) / 10000
}

// --- Fonctions utilitaires ---

export const mergeOverlappingIndispos = (indispos) => {
  if (!indispos.length) return []

  indispos.sort((a, b) => a.dateStart - b.dateStart)
  const merged = [indispos[0]]

  for (let i = 1; i < indispos.length; i++) {
    const last = merged[merged.length - 1]
    const current = indispos[i]

    if (current.dateStart <= last.dateStop) {
      last.dateStop = new Date(Math.max(last.dateStop, current.dateStop))
      last.percent = Math.max(last.percent, current.percent) // règle métier simple
    } else {
      merged.push(current)
    }
  }
  return merged
}

export const getActiveSituation = (situations, date) => {
  for (let i = 0; i < situations.length; i++) {
    const current = situations[i]
    const next = situations[i + 1]

    const start = current.dateStart
    const end = next?.dateStart || new Date(8640000000000000) // max Date

    if (date >= start && date < end) {
      return current
    }
  }
  return null
}

export const getActiveIndispos = (indispos, start, end) => {
  return indispos.filter((i) => i.dateStop > start && i.dateStart < end)
}

export const computeIndispoRatio = (indispos, start, end) => {
  if (!indispos.length) return 0
  const totalDuration = end - start
  let covered = 0

  for (const i of indispos) {
    const overlapStart = i.dateStart > start ? i.dateStart : start
    const overlapEnd = i.dateStop < end ? i.dateStop : end
    const overlap = Math.max(0, overlapEnd - overlapStart)

    covered += (overlap * (i.percent || 0)) / 100
  }

  return Math.min(1, covered / totalDuration) // ratio d’indispo
}

const { setImmediate: setImmediatePromise } = require('timers/promises')

export const generateAllStableHRPeriods = async (agents) => {
  const resultMap = new Map()

  await Promise.all(
    agents.map(async (agent, index) => {
      // Petite pause pour ne pas bloquer l’event loop
      if (index % 50 === 0) await setImmediatePromise()
      const periods = generateStableHRPeriods(agent)
      resultMap.set(agent.id, periods)
    }),
  )

  return resultMap
}

export const generateStableHRPeriods = (agent) => {
  // Déstructuration des données de l'agent
  const { id: agentId, dateStart: agentStart, dateEnd: agentEnd, situations = [], indisponibilities = [] } = agent

  // Affichage des informations de l'agent, des situations et des indisponibilités
  console.log('Agent:', { agentId, dateStart: agentStart, dateEnd: agentEnd })
  console.log('Situations:', situations)
  console.log('Indisponibilités:', indisponibilities)

  // Si l'agent n'a pas de date de début ou si aucune situation n'est définie, retourner un tableau vide
  if (!agentStart || situations.length === 0) return []

  // Fonction de normalisation des dates pour s'assurer qu'elles sont au format UTC 12h00
  const normalizeDate = (date) => {
    const d = new Date(date)
    // Si l'heure est 22h, on incrémente d'un jour pour éviter des erreurs de date
    if (d.getUTCHours() === 22 || d.getUTCHours() === 23) {
      d.setUTCDate(d.getUTCDate() + 1)
    }
    d.setUTCHours(12, 0, 0, 0) // On met l'heure à 12h00 pour les calculs
    return d
  }

  // Création de la liste des points de rupture
  const breakpoints = new Set()
  breakpoints.add(normalizeDate(agentStart)) // Point de départ de l'agent

  // On ajoute les points de départ des situations
  for (const s of situations) {
    if (s.dateStart) breakpoints.add(normalizeDate(s.dateStart))
  }

  // On ajoute les points de départ et de fin des indisponibilités
  for (const i of indisponibilities) {
    const iStart = normalizeDate(i.dateStart)
    let iStop

    if (i.dateStop) {
      iStop = normalizeDate(i.dateStop)
      // Si l'indisponibilité dure exactement un jour, on ajoute le lendemain comme point de rupture
      if (iStart.getTime() === iStop.getTime()) {
        breakpoints.add(new Date(iStop.getTime() + 24 * 60 * 60 * 1000))
      }
    } else {
      // Si l'indisponibilité n'a pas de date de fin, on prend la fin de l'agent ou une date très lointaine
      iStop = agentEnd ? normalizeDate(agentEnd) : new Date(9999, 11, 31, 12)
    }

    breakpoints.add(iStart)
    breakpoints.add(iStop)
  }

  // Ajout de la date de fin de l'agent ou d'une date par défaut
  breakpoints.add(agentEnd ? normalizeDate(agentEnd) : new Date(9999, 11, 31, 12))

  // Tri des points de rupture pour avoir un ordre chronologique
  const sorted = [...breakpoints].sort((a, b) => a - b)

  console.log(
    '📍 Sorted breakpoints:',
    sorted.map((d) => d.toISOString()),
  )

  const periods = [] // Tableau pour stocker les périodes générées
  let lastWasIndispoStop = false // Variable pour vérifier si la période précédente était causée par une indisponibilité
  let lastWasOneDayIndispoStop = false // Variable pour vérifier si la période précédente était causée par une indisponibilité

  // On parcourt chaque paire de points de rupture pour générer les périodes
  for (let i = 0; i < sorted.length - 1; i++) {
    let start = new Date(sorted[i])
    let end = new Date(sorted[i + 1])

    // Trouver la situation active pour cette période
    const currentSituation = situations.sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart)).find((s) => normalizeDate(s.dateStart) <= start)

    if (!currentSituation) {
      console.warn(`⛔ Aucune situation trouvée pour la période ${start.toISOString()} → ${end.toISOString()}`)
      continue
    }

    // Déstructuration de la situation courante (ETP, fonction, catégorie, etc.)
    const { etp, fonction, category, activities } = currentSituation

    // Filtrage des indisponibilités qui affectent la période en cours
    const indispoInPeriod = indisponibilities.filter((i) => {
      const iStart = normalizeDate(i.dateStart)
      let iEnd
      if (i.dateStop) {
        iEnd = normalizeDate(i.dateStop)
        if (i.dateStart && i.dateStop && new Date(i.dateStart).getTime() === new Date(i.dateStop).getTime()) {
          iEnd = new Date(iEnd.getTime() + 24 * 60 * 60 * 1000) // Cas des indisponibilités d'une journée
        }
      } else {
        iEnd = agentEnd ? normalizeDate(agentEnd) : new Date(9999, 11, 31, 12)
      }
      return iStart < end && iEnd > start // Filtrer celles qui intersectent la période
    })

    // Calcul du taux d'indisponibilité total pendant cette période
    const totalIndispoRate = indispoInPeriod.reduce((sum, i) => {
      const rate = typeof i.percent === 'number' ? i.percent / 100 : i.rate || 0
      return sum + rate
    }, 0)

    // Calcul de l'ETP effectif en fonction des indisponibilités
    const effectiveETP = Math.max(0, etp * (1 - totalIndispoRate))

    // Vérification si la fin de la période est causée par une indisponibilité
    const isEndFromIndispoStop = indisponibilities.some((i) => {
      let iStop = i.dateStop ? normalizeDate(i.dateStop) : agentEnd ? normalizeDate(agentEnd) : new Date(9999, 11, 31, 12)
      if (i.dateStart && i.dateStop && new Date(i.dateStart).getTime() === new Date(i.dateStop).getTime()) {
        iStop = new Date(iStop.getTime() + 24 * 60 * 60 * 1000) // Si l'indisponibilité est d'un jour, on la prolonge d'un jour
      }
      return iStop.getTime() === end.getTime()
    })

    const isEndFromAgentDeparture = agentEnd && normalizeDate(agentEnd).getTime() === end.getTime()

    // Si la période n'est pas causée par une indisponibilité ou une fin d'agent, on ajuste la fin de la période
    if (!isEndFromIndispoStop && !isEndFromAgentDeparture) {
      end.setUTCDate(end.getUTCDate() - 1) // Réduire d'un jour pour éviter de dépasser la fin de la période
    }

    // Si la période précédente était due à une indisponibilité, on commence la période suivante au lendemain
    if (lastWasIndispoStop && !lastWasOneDayIndispoStop) {
      start.setUTCDate(start.getUTCDate() + 1)
    }
    lastWasOneDayIndispoStop = false
    lastWasIndispoStop = isEndFromIndispoStop // Met à jour la variable pour la prochaine période

    // Si le début de la période est après la fin, on l'ignore
    if (start > end) {
      console.warn(`⚠️ Période ignorée car start > end après ajustement: ${start.toISOString()} → ${end.toISOString()}`)
      continue
    }

    // Ajustement spécifique pour les indisponibilités d'une seule journée : fin de la période
    for (const indispo of indispoInPeriod) {
      const iStart = normalizeDate(indispo.dateStart)
      const iStop = normalizeDate(indispo.dateStop)
      console.log(iStart, iStop, iStart.getTime() === iStop.getTime(), end.getTime() === iStart.getTime(), end)
      if (iStart.getTime() === iStop.getTime()) {
        lastWasOneDayIndispoStop = true
        end = normalizeDate(iStart) // Fixe la fin de la période au même jour
        break
      }
    }

    console.log(`✅ Période: ${start.toISOString()} → ${end.toISOString()}`)
    console.log('  Situation:', { etp, fonctionId: fonction?.id, categoryId: category?.id })
    console.log('  Indispos:', indispoInPeriod.length, '→ Rate:', totalIndispoRate)
    console.log('  Effective ETP:', effectiveETP)

    // Ajouter la période calculée dans la liste des périodes
    periods.push({
      agentId,
      start,
      end,
      etp,
      effectiveETP,
      fonction,
      category,
      activities,
      indisponibilities: indispoInPeriod,
    })
  }

  console.log('📦 Résultat final:', periods)
  return periods // Retourner la liste des périodes générées
}
export const generateStableHRPeriodsOptimized = (agent) => {
  // Déstructuration des données de l'agent
  const { id: agentId, dateStart: agentStart, dateEnd: agentEnd, situations = [], indisponibilities = [] } = agent

  if (!agentStart || situations.length === 0) return []

  // Fonction de normalisation des dates pour s'assurer qu'elles sont au format UTC 12h00
  const normalizeDate = (date) => {
    const d = new Date(date)
    if (d.getUTCHours() === 22 || d.getUTCHours() === 23) {
      d.setUTCDate(d.getUTCDate() + 1)
      console.log('modified', d)
    }
    d.setUTCHours(12, 0, 0, 0) // On met l'heure à 12h00 pour les calculs
    console.log(d)
    return d
  }

  // Pré-traitement des données : normaliser les dates et préparer les objets
  const normalizedSituations = situations.map((situation) => ({
    ...situation,
    normalizedStart: normalizeDate(situation.dateStart),
    normalizedEnd: situation.dateEnd ? normalizeDate(situation.dateEnd) : null,
  }))

  const normalizedIndisponibilities = indisponibilities.map((indispo) => ({
    ...indispo,
    normalizedStart: normalizeDate(indispo.dateStart),
    normalizedEnd: indispo.dateStop ? normalizeDate(indispo.dateStop) : null,
  }))

  // Création de la liste des points de rupture (breakpoints)
  const breakpoints = new Set([normalizeDate(agentStart)])

  normalizedSituations.forEach((situation) => {
    breakpoints.add(situation.normalizedStart)
    if (situation.normalizedEnd) breakpoints.add(situation.normalizedEnd)
  })

  normalizedIndisponibilities.forEach((indispo) => {
    breakpoints.add(indispo.normalizedStart)
    if (indispo.normalizedEnd) breakpoints.add(indispo.normalizedEnd)
  })

  breakpoints.add(agentEnd ? normalizeDate(agentEnd) : new Date(9999, 11, 31, 12))

  // Tri des breakpoints pour avoir un ordre chronologique
  const sortedBreakpoints = [...breakpoints].sort((a, b) => a - b)

  const periods = []
  let lastWasIndispoStop = false
  let lastWasOneDayIndispoStop = false

  // On parcourt les breakpoints pour générer les périodes
  for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
    let start = new Date(sortedBreakpoints[i])
    let end = new Date(sortedBreakpoints[i + 1])

    // Trouver la situation active pour cette période
    const currentSituation = normalizedSituations.find((s) => s.normalizedStart <= start)
    if (!currentSituation) {
      console.warn(`⛔ Aucune situation trouvée pour la période ${start.toISOString()} → ${end.toISOString()}`)
      continue
    }

    const { etp, fonction, category, activities } = currentSituation

    // Filtrage des indisponibilités affectant la période en cours
    const indispoInPeriod = normalizedIndisponibilities.filter((i) => {
      return i.normalizedStart < end && (i.normalizedEnd || new Date(9999, 11, 31, 12)) > start
    })

    // Calcul du taux d'indisponibilité total pendant cette période
    const totalIndispoRate = indispoInPeriod.reduce((sum, i) => sum + (i.percent / 100 || 0), 0)

    // Calcul de l'ETP effectif en fonction des indisponibilités
    const effectiveETP = Math.max(0, etp * (1 - totalIndispoRate))

    // Vérification si la fin de la période est causée par une indisponibilité
    const isEndFromIndispoStop = normalizedIndisponibilities.some((i) => {
      return i.normalizedEnd && i.normalizedEnd.getTime() === end.getTime()
    })

    // Réduction de la période si elle n'est pas causée par une indisponibilité
    if (!isEndFromIndispoStop) {
      end.setUTCDate(end.getUTCDate() - 1)
    }

    // Si la période précédente était due à une indisponibilité, on commence la période suivante au lendemain
    if (lastWasIndispoStop && !lastWasOneDayIndispoStop) {
      start.setUTCDate(start.getUTCDate() + 1)
    }
    lastWasOneDayIndispoStop = false
    lastWasIndispoStop = isEndFromIndispoStop

    if (start > end) {
      console.warn(`⚠️ Période ignorée car start > end après ajustement: ${start.toISOString()} → ${end.toISOString()}`)
      continue
    }

    // Ajustement spécifique pour les indisponibilités d'une seule journée : fin de la période
    for (const indispo of indispoInPeriod) {
      if (indispo.normalizedStart.getTime() === indispo.normalizedEnd.getTime()) {
        lastWasOneDayIndispoStop = true
        end = new Date(indispo.normalizedStart) // Fixe la fin de la période au même jour
        break
      }
    }

    // Ajouter la période calculée dans la liste des périodes
    periods.push({
      agentId,
      start,
      end,
      etp,
      effectiveETP,
      fonction,
      category,
      activities,
      indisponibilities: indispoInPeriod,
    })
  }

  return periods // Retourner la liste des périodes générées
}

export const createDateIntervalIndex = (agentsPeriodsMap) => {
  const index = new Map()

  // Itérer sur chaque agent dans le Map
  agentsPeriodsMap.forEach((periods, agentId) => {
    periods.forEach((period) => {
      const start = new Date(period.start)
      const end = new Date(period.end)

      // Créer une clé d'index combinant start et end sous forme d'un intervalle unique
      const periodKey = { start, end }

      // Indexation unique par la clé période
      if (!index.has(periodKey.start.toISOString())) {
        index.set(periodKey.start.toISOString(), [])
      }
      index.get(periodKey.start.toISOString()).push({
        agentId,
        start: period.start,
        end: period.end,
        effectiveETP: period.effectiveETP,
        etp: period.etp,
      })
    })
  })

  return index
}

export const searchPeriods = (index, startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start) || isNaN(end)) {
    console.error('Invalid start or end date.')
    return []
  }

  const matchedPeriods = []

  // Recherche des périodes dans l'index
  index.forEach((periods, date) => {
    // Vérifier si la période chevauche l'intervalle
    periods.forEach((period) => {
      const periodStart = new Date(period.start)
      const periodEnd = new Date(period.end)

      // 1. La période commence avant et finit dans l'intervalle
      // 2. La période commence dans l'intervalle et finit après
      // 3. La période couvre entièrement l'intervalle
      if (
        (periodStart < start && periodEnd >= start) || // La période commence avant et finit dans l'intervalle
        (periodStart >= start && periodStart <= end) || // La période commence dans l'intervalle
        (periodEnd >= start && periodEnd <= end) || // La période finit dans l'intervalle
        (periodStart <= start && periodEnd >= end) // La période couvre entièrement l'intervalle
      ) {
        matchedPeriods.push(period)
      }
    })
  })

  return matchedPeriods
}
