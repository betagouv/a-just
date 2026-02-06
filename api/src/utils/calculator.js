import { cloneDeep, groupBy, meanBy, sortBy, sumBy } from 'lodash'
import { getTime, isSameMonthAndYear, month, nbWorkingDays, today, workingDay } from './date'
import { fixDecimal } from './number'
import config from 'config'
import { calculateETPForContentieux, getEtpByDateAndPerson, getEtpByDateAndPersonOld } from './human-resource'
import { appendFileSync } from 'fs'
import { checkAbort } from './abordTimeout'

/**
 * Somme les valeurs d'une propriété dans un tableau, retourne null si toutes les valeurs sont null
 * @param {Array} collection - Le tableau à parcourir
 * @param {string} iteratee - La propriété à sommer
 * @returns {number|null} - La somme ou null si toutes les valeurs sont null
 */
const sumByOrNull = (collection, iteratee) => {
  if (!collection || collection.length === 0) return null

  const values = collection.map(item => {
    const value = typeof iteratee === 'function' ? iteratee(item) : item[iteratee]
    return value
  })

  // Si toutes les valeurs sont null ou undefined, retourner null
  const allNull = values.every(val => val === null || val === undefined)
  if (allNull) return null

  // Sinon, utiliser sumBy normalement (il ignorera les null/undefined)
  return sumBy(collection, iteratee)
}

/**
 * Création d'un tableau vide du calculateur de tous les contentieux et sous-contentieux
 * @param {Array} referentiels
 * @returns {Array}
 */
export const emptyCalulatorValues = (referentiels) => {
  const baseValues = {
    totalIn: null,
    totalOut: null,
    lastStock: null,
    etpMag: null,
    magRealTimePerCase: null,
    magCalculateTimePerCase: null,
    magCalculateOut: null,
    magCalculateCoverage: null,
    magCalculateDTESInMonths: null,
    etpFon: null,
    fonRealTimePerCase: null,
    fonCalculateTimePerCase: null,
    fonCalculateOut: null,
    fonCalculateCoverage: null,
    fonCalculateDTESInMonths: null,
    etpCont: null,
    realCoverage: null,
    realDTESInMonths: null,
    etpAffected: [],
    childrens: [],
    nbMonth: 0,
  }

  return referentiels.map((parent) => {
    const childrens = (parent.childrens || []).map((child) => ({
      ...baseValues,
      contentieux: { ...child, parent },
    }))

    return {
      ...baseValues,
      contentieux: parent,
      childrens,
    }
  })
}

/**
 * Calcul des lignes du calculateur
 * @param {*} list
 * @param {*} nbMonth
 * @param {*} activities
 * @param {*} dateStart
 * @param {*} dateStop
 * @param {*} hr
 * @param {*} categories
 * @param {*} optionsBackups
 * @returns
 */
export const syncCalculatorDatas = (
  indexes,
  list,
  nbMonth,
  activities,
  dateStart,
  dateStop,
  hr,
  categories,
  optionsBackups,
  selectedFonctionsIds,
  signal = null,
) => {
  const prefilters = groupBy(activities, 'contentieux.id')

  const compute = (item, parentParams = null) => {
    const id = item.contentieux.id
    const values = getActivityValues(indexes, dateStart, dateStop, prefilters[id] || [], id, nbMonth, hr, categories, optionsBackups, selectedFonctionsIds, parentParams)
    return { ...item, ...values, nbMonth }
  }

  return list.map((parent, index) => {
    checkAbort(signal)
    let childrens = (parent.childrens || []).map((child) => compute(child))
    let parentParams = {
      meanOutBf: sumByOrNull(childrens, 'meanOutBf'),
      meanOutCs: sumByOrNull(childrens, 'meanOutCs'),
      totalIn: sumByOrNull(childrens, 'totalIn'),
      totalOut: sumByOrNull(childrens, 'totalOut'),
      totalInBf: sumByOrNull(childrens, 'totalInBf'),
      totalOutBf: sumByOrNull(childrens, 'totalOutBf'),
      totalInAf: sumByOrNull(childrens, 'totalInAf'),
      totalOutAf: sumByOrNull(childrens, 'totalOutAf')
    }

    return {
      ...compute(parent, parentParams),
      childrens
    }
  })
}

/**
 * Préparation d'un objet d'un contentieux avec les filtres de recherche
 * @param {*} dateStart
 * @param {*} dateStop
 * @param {*} activities
 * @param {*} referentielId
 * @param {*} nbMonth
 * @param {*} hr
 * @param {*} categories
 * @param {*} optionsBackups
 * @returns
 */
const getActivityValues = (
  indexes,
  dateStart,
  dateStop,
  activities,
  referentielId,
  nbMonth,
  hr,
  categories,
  optionsBackups,
  selectedFonctionsIds,
  parentParams = null,
) => {
  let { meanOutCs, etpMagCs, etpFonCs, meanOutBf, lastStockBf, totalInBf, totalOutBf, lastStockAf, totalInAf, totalOutAf } = getLastTwelveMonths(
    indexes,
    dateStart,
    dateStop,
    activities,
    referentielId,
    hr,
    categories,
  )

  activities = activities.filter((a) => month(a.periode).getTime() >= month(dateStart).getTime() && month(a.periode).getTime() <= month(dateStop).getTime())

  let filteredIn = (activities || []).filter((e) => e.entrees !== null)
  let totalIn = filteredIn.length !== 0 ? meanBy(filteredIn, 'entrees') : null
  let filteredOut = (activities || []).filter((e) => e.sorties !== null)
  let totalOut = filteredOut.length !== 0 ? meanBy(filteredOut, 'sorties') : null

  if (parentParams !== null) {
    meanOutCs = parentParams.meanOutCs
    meanOutBf = parentParams.meanOutBf
    totalIn = parentParams.totalIn
    totalOut = parentParams.totalOut
    totalInBf = parentParams.totalInBf
    totalOutBf = parentParams.totalOutBf
    totalInAf = parentParams.totalInAf
    totalOutAf = parentParams.totalOutAf
  }

  let lastStock = null
  if (activities.length) {
    const lastActivities = activities[activities.length - 1]
    if (lastActivities.stock !== null && isSameMonthAndYear(lastActivities.periode, dateStop)) {
      lastStock = lastActivities.stock
    }
  }

  // Taux de couverture moyen, debut (Bf), fin (Af)
  const realCoverage = fixDecimal(totalOut / totalIn, 100)
  const realCoverageBf = fixDecimal(totalOutBf / totalInBf, 100)
  const realCoverageAf = fixDecimal(totalOutAf / totalInAf, 100)

  // ETP 12 derniers mois fin
  const realDTESInMonths = lastStock !== null && meanOutCs !== null ? fixDecimal(lastStock / meanOutCs, 100) : null
  // ETP 12 derniers mois début
  const realDTESInMonthsStart = lastStockBf !== null && meanOutBf !== null ? fixDecimal(lastStockBf / meanOutBf, 100) : null

  // ETP moyen sur la période
  const etpAffected = calculateETPForContentieux(
    indexes,
    {
      start: dateStart,
      end: dateStop,
      category: undefined,
      fonctions: selectedFonctionsIds,
      contentieux: referentielId,
    },
    categories,
  )

  const etpMag = etpAffected.length > 0 ? fixDecimal(etpAffected[0].totalEtp, 1000) : 0
  const etpFon = etpAffected.length > 1 ? fixDecimal(etpAffected[1].totalEtp, 1000) : 0
  const etpCont = etpAffected.length > 2 ? fixDecimal(etpAffected[2].totalEtp, 1000) : 0

  let etpAffectedBf = []
  let etpMagBf = null
  let etpFonBf = null
  let etpContBf = null
  let etpAffectedAf = []
  let etpMagAf = null
  let etpFonAf = null
  let etpContAf = null

  let oneMonthAfterStart = month(today(dateStart), 0, 'lastday')
  let oneMonthBeforeEnd = today(dateStop)
  oneMonthBeforeEnd.setDate(1)

  // ETP début
  etpAffectedBf = calculateETPForContentieux(
    indexes,
    {
      start: dateStart,
      end: oneMonthAfterStart,
      category: undefined,
      fonctions: selectedFonctionsIds,
      contentieux: referentielId,
    },
    categories,
  )

  etpMagBf = etpAffectedBf.length > 0 ? fixDecimal(etpAffectedBf[0].totalEtp, 1000) : 0
  etpFonBf = etpAffectedBf.length > 1 ? fixDecimal(etpAffectedBf[1].totalEtp, 1000) : 0
  etpContBf = etpAffectedBf.length > 2 ? fixDecimal(etpAffectedBf[2].totalEtp, 1000) : 0

  // ETP fin
  etpAffectedAf = calculateETPForContentieux(
    indexes,
    {
      start: oneMonthBeforeEnd,
      end: dateStop,
      category: undefined,
      fonctions: selectedFonctionsIds,
      contentieux: referentielId,
    },
    categories,
  )

  etpMagAf = etpAffectedAf.length > 0 ? fixDecimal(etpAffectedAf[0].totalEtp, 1000) : 0
  etpFonAf = etpAffectedAf.length > 1 ? fixDecimal(etpAffectedAf[1].totalEtp, 1000) : 0
  etpContAf = etpAffectedAf.length > 2 ? fixDecimal(etpAffectedAf[2].totalEtp, 1000) : 0

  // Temps moyens par dossier observé = (nb heures travaillées par mois) / (sorties moyennes par mois / etpt sur la periode)
  const magRealTimePerCase = fixDecimal(((config.nbDaysByMagistrat / 12) * config.nbHoursPerDayAndMagistrat) / (meanOutCs / etpMagCs), 1000)
  const fonRealTimePerCase = fixDecimal(((config.nbDaysByFonctionnaire / 12) * config.nbHoursPerDayAndFonctionnaire) / (meanOutCs / etpFonCs), 1000)
  if (referentielId === 471) console.log(fonRealTimePerCase, meanOutCs, etpFonCs)
  return {
    ...calculateActivities(referentielId, totalIn, lastStock, etpMag, etpFon, optionsBackups),
    // entrée sorties et taux de couverture moyen sur la période avec stock de fin
    totalIn,
    totalOut,
    lastStock,
    realCoverage,
    // DTES début (Start) et DTES fin
    realDTESInMonthsStart,
    realDTESInMonths,
    // TMD magistrat et fonctionnaire
    magRealTimePerCase,
    fonRealTimePerCase,
    // ETP moyen sur la période
    etpMag,
    etpFon,
    etpCont,
    etpAffected,
    // Valeurs de début de période (Bf = Before)
    totalInBf,
    totalOutBf,
    lastStockBf,
    realCoverageBf,
    etpAffectedBf,
    etpMagBf,
    etpFonBf,
    etpContBf,
    // Valeurs de fin de période (Af = After)
    lastStockAf,
    totalInAf,
    totalOutAf,
    realCoverageAf,
    etpAffectedAf,
    etpMagAf,
    etpFonAf,
    etpContAf,
    oneMonthBeforeEnd,
    oneMonthAfterStart,
    // Valeurs pour calculs parent
    meanOutCs,
    meanOutBf
  }
}

/**
 *
 */
const getLastTwelveMonths = (indexes, dateStart, dateStop, activities, referentielId, hr, categories) => {
  /**
   * Calcul sur les 12 derniers mois avant date de fin
   */

  // Date: 12 mois avant date de fin selectionnée dans calculateur (début du mois)
  const startCs = month(today(dateStop), -11)

  // Date: fin de période selecitonnée dans calculateur (fin du mois)
  const endCs = month(today(dateStop), 0, 'lastday')
  let lastStockCs = null
  let totalInCs = null
  let totalOutCs = null

  // Clone de l'objet activities et filtre par date
  let activitesEnd = cloneDeep(activities)
  activitesEnd = activitesEnd.filter((a) => month(a.periode).getTime() >= month(startCs).getTime() && month(a.periode).getTime() <= month(endCs).getTime())

  if (activitesEnd.length) {
    const lastActivities = activitesEnd[activitesEnd.length - 1]
    if (isSameMonthAndYear(lastActivities.periode, endCs)) {
      if (lastActivities.stock !== null) {
        lastStockCs = lastActivities.stock
      }

      if (lastActivities.entrees !== null) {
        totalInCs = lastActivities.entrees
      }

      if (lastActivities.sorties !== null) {
        totalOutCs = lastActivities.sorties
      }
    }
  }

  // Calcul des sorties moyennes 12 derniers mois à compter de la date de fin selectionnée dans le calculateur
  let filteredOut = (activitesEnd || []).filter((e) => e.sorties !== null)
  const meanOutCs = filteredOut.length !== 0 ? meanBy(filteredOut, 'sorties') : null
  const etpByCategory = calculateETPForContentieux(
    indexes,
    {
      start: startCs,
      end: endCs,
      category: undefined,
      fonctions: undefined,
      contentieux: referentielId,
    },
    categories,
  )

  const etpMagCs = etpByCategory.length > 0 ? fixDecimal(etpByCategory[0].totalEtp, 1000) : 0
  const etpFonCs = etpByCategory.length > 0 ? fixDecimal(etpByCategory[1].totalEtp, 1000) : 0

  let lastStockBf = null
  let totalInBf = null
  let totalOutBf = null
  let meanOutBf = null

  /**
   * Calcul sur les 12 derniers mois avant date de début
   */
  // Date début de période selecitonnée dans le calculateur (fin du mois)
  const endBf = month(today(dateStart), 0, 'lastday')

  // Date 12 mois avant la date de début selectionnée dans le calculateur (début du mois)
  const startBf = month(today(endBf), -11)
  startBf.setDate(startBf.getDate() + 1)
  startBf.setMinutes(startBf.getMinutes() + 1)

  // Clone de l'objet activities et filtre par date
  let activitesStart = cloneDeep(activities)
  activitesStart = activitesStart.filter((a) => month(a.periode).getTime() >= month(startBf).getTime() && month(a.periode).getTime() <= month(endBf).getTime())

  // Calcul des sorties moyennes 12 derniers mois à compter de la date de début selectionnée dans le calculateur
  let filteredOutBf = (activitesStart || []).filter((e) => e.sorties !== null)
  meanOutBf = filteredOutBf.length !== 0 ? meanBy(filteredOutBf, 'sorties') : null

  if (activitesStart.length) {
    const lastActivities = activitesStart[activitesStart.length - 1]
    if (isSameMonthAndYear(lastActivities.periode, endBf)) {
      if (lastActivities.stock !== null) {
        lastStockBf = lastActivities.stock
      }

      if (lastActivities.entrees !== null) {
        totalInBf = lastActivities.entrees
      }

      if (lastActivities.sorties !== null) {
        totalOutBf = lastActivities.sorties
      }
    }
  }

  return {
    meanOutCs,
    etpMagCs,
    etpFonCs,
    startCs,
    endCs,
    meanOutBf,
    lastStockBf,
    totalInBf,
    totalOutBf,
    lastStockAf: lastStockCs,
    totalInAf: totalInCs,
    totalOutAf: totalOutCs,
  }
}
/**
 * Calcul d'un taux de ventilation d'un contentieux pour tous les utilisateurs
 * @param {*} hr
 * @param {*} categories
 * @param {*} referentielId
 * @param {*} dateStart
 * @param {*} dateStop
 * @returns
 */
export const getHRPositions = (models, hr, categories, referentielId, dateStart, dateStop) => {
  const hrCategories = {}

  categories.map((c) => {
    hrCategories[c.label] = hrCategories[c.label] || {
      totalEtp: 0,
      list: [],
      rank: c.rank,
    }
  })

  for (let i = 0; i < hr.length; i++) {
    const situtations = hr[i].situations || []
    if (
      situtations.some((s) => {
        const activities = s.activities || []
        return activities.some((s) => s.contentieux.id === referentielId)
      })
    ) {
      const etptAll = getHRVentilation(hr[i], referentielId, categories, dateStart, dateStop)

      if (etptAll) {
        Object.values(etptAll).map((c) => {
          if (c.etpt) {
            hrCategories[c.label].list.push(hr[i])
            hrCategories[c.label].totalEtp += fixDecimal(c.etpt, 1000)
          }
        })
      }
    }
  }

  const list = []
  for (const [key, value] of Object.entries(hrCategories)) {
    list.push({
      name: key,
      totalEtp: value.totalEtp,
      rank: value.rank,
    })
  }

  return sortBy(list, 'rank')
}

export const getNbDaysGone = (hr, dateStart, dateStop) => {
  let nbDaysGone = 0
  let now = today(dateStart)

  do {
    // only working day
    if (workingDay(now)) {
      if (hr.dateEnd && getTime(hr.dateEnd) < dateStop.getTime() && now.getTime() > getTime(hr.dateEnd)) nbDaysGone++
      if (hr.dateStart && getTime(hr.dateStart) > dateStart.getTime() && now.getTime() < getTime(dateStart)) nbDaysGone++
    }

    now.setDate(now.getDate() + 1)
  } while (now.getTime() <= dateStop.getTime())

  return nbDaysGone
}

export const getHRVentilationOld = (hr, referentielId, categories, dateStart, dateStop, ddgFilter = false, absLabels = null) => {
  const list = new Object()
  categories.map((c) => {
    list[c.id] = new Object({
      etpt: 0,
      indispo: 0,
      reelEtp: 0,
      ...c,
    })
  })

  let now = today(dateStart)
  let nbDay = 0
  let nbDaysGone = 0
  do {
    let nextDateFinded = null
    let lastEtpAdded = null
    let lastSituationId = null

    hr.dateEnd = hr.dateEnd ? today(hr.dateEnd) : hr.dateEnd
    hr.dateStart = hr.dateStart ? today(hr.dateStart) : hr.dateStart

    // only working day
    if (workingDay(now)) {
      let sumByInd = 0
      if (hr.dateEnd && hr.dateEnd.getTime() < dateStop.getTime() && now.getTime() > hr.dateEnd.getTime()) nbDaysGone++
      if (hr.dateStart && hr.dateStart.getTime() > dateStart.getTime() && now.getTime() < dateStart.getTime()) nbDaysGone++
      nbDay++

      let etp = null
      let situation = null
      let indispoFiltred = null
      let nextDeltaDate = null
      let reelEtp = null
      /*const cache = models.HumanResources.cacheAgent(hr.id, `getEtpByDateAndPerson${referentielId};now${now};ddgFilter${ddgFilter};absLabels${absLabels}`)
      if (cache) {
        etp = cache.etp
        situation = cache.situation
        indispoFiltred = cache.indispoFiltred
        nextDeltaDate = cache.nextDeltaDate
        reelEtp = cache.reelEtp
      } else {*/
      const etpByDateAndPerson = getEtpByDateAndPersonOld(referentielId, now, hr, ddgFilter, absLabels)
      /*models.HumanResources.updateCacheAgent(
          hr.id,
          `getEtpByDateAndPerson${referentielId};now${now};ddgFilter${ddgFilter};absLabels${absLabels}`,
          etpByDateAndPerson
        )*/
      etp = etpByDateAndPerson.etp
      situation = etpByDateAndPerson.situation
      indispoFiltred = etpByDateAndPerson.indispoFiltred
      nextDeltaDate = etpByDateAndPerson.nextDeltaDate
      reelEtp = etpByDateAndPerson.reelEtp
      //}

      if (nextDeltaDate) {
        nextDateFinded = today(nextDeltaDate)
      }

      const categoryId = situation && situation.category && situation.category.id ? '' + situation.category.id : null

      if (situation && etp !== null && list[categoryId]) {
        lastEtpAdded = etp
        lastSituationId = categoryId
        list[categoryId].reelEtp += reelEtp
        list[categoryId].etpt += etp
      }

      sumByInd += sumBy(indispoFiltred, 'percent')

      if (sumByInd !== 0) {
        indispoFiltred.map((c) => {
          if (c.contentieux.id === referentielId && list[categoryId]) list[categoryId].indispo += c.percent
        })
      }
    }

    //
    if (nextDateFinded) {
      if (nextDateFinded.getTime() > dateStop.getTime()) {
        nextDateFinded = today(dateStop)
        nextDateFinded.setDate(nextDateFinded.getDate() + 1)
      }

      // don't block the average
      if (lastEtpAdded !== null && lastSituationId !== null) {
        const nbDayBetween = nbWorkingDays(now, nextDateFinded)
        nbDay += nbDayBetween - 1
        list[lastSituationId].etpt += nbDayBetween * lastEtpAdded
      }

      // quick move to the next date
      now = today(nextDateFinded)
    } else {
      now.setDate(now.getDate() + 1)
    }
  } while (now.getTime() <= dateStop.getTime())

  if (nbDay === 0) {
    nbDay = 1
  }

  // format render
  for (const property in list) {
    list[property].etpt = list[property].etpt / nbDay
    list[property].indispo = list[property].indispo / nbDay
    list[property].reelEtp = list[property].reelEtp / nbDay
    list[property].nbDaysGone = nbDaysGone
    list[property].nbDay = nbDay
  }

  return list
}
/**
 * Calcul du temps de ventilation d'un magistrat et d'un contentieux
 * @param {*} hr
 * @param {*} referentielId
 * @param {*} categories
 * @param {*} dateStart
 * @param {*} dateStop
 * @returns
 */
export const getHRVentilation = (hr, referentielId, categories, dateStart, dateStop, ddgFilter = false, absLabels = null, signal = null) => {
  checkAbort(signal)

  const list = new Object()
  categories.map((c) => {
    list[c.id] = new Object({
      etpt: 0,
      indispo: 0,
      reelEtp: 0,
      ...c,
    })
  })

  let now = today(dateStart)
  let nbDay = 0
  let nextDeltaDate = null
  let continueLoop = true

  let nextDateFinded = null
  let lastEtpAdded = null
  let lastSituationId = null

  do {
    let addDay = true
    checkAbort(signal)

    // only working day
    if (workingDay(now)) {
      nextDeltaDate = null
      let sumByInd = 0
      let etp = null
      let situation = null
      let indispoFiltred = null
      let reelEtp = null
      checkAbort(signal)
      const etpByDateAndPerson = getEtpByDateAndPerson(referentielId, now, hr, ddgFilter, absLabels, signal)
      etp = etpByDateAndPerson.etp
      situation = etpByDateAndPerson.situation
      indispoFiltred = etpByDateAndPerson.indispoFiltred
      nextDeltaDate = etpByDateAndPerson.nextDeltaDate
      reelEtp = etpByDateAndPerson.reelEtp
      addDay = etpByDateAndPerson.addDay
      if (nextDeltaDate) {
        nextDateFinded = today(nextDeltaDate)
        lastEtpAdded = null
        lastSituationId = null
      } else {
        nextDateFinded = today(dateStop)
        lastEtpAdded = 0
      }

      const categoryId = situation && situation.category && situation.category.id ? '' + situation.category.id : null

      if (situation && etp !== null && list[categoryId]) {
        lastEtpAdded = etp
        lastSituationId = categoryId
      }

      if (nextDateFinded) {
        if (nextDateFinded.getTime() > dateStop.getTime()) {
          nextDateFinded = today(dateStop)
        }

        const nbDayBetween = nbWorkingDays(now, nextDateFinded)
        nbDay += nbDayBetween

        // don't block the average
        if (lastEtpAdded !== null && lastSituationId !== null) {
          list[lastSituationId].etpt += nbDayBetween * lastEtpAdded
          list[lastSituationId].reelEtp += nbDayBetween * reelEtp

          sumByInd += sumBy(indispoFiltred, 'percent')

          if (sumByInd !== 0) {
            indispoFiltred.map((c) => {
              if (c.contentieux.id === referentielId && list[categoryId]) list[categoryId].indispo += nbDayBetween * c.percent
            })
          }
        }

        // quick move to the next date
        if (nextDateFinded.getTime() <= dateStop.getTime()) {
          now = today(nextDateFinded)
        }
      } else {
        nbDay++
      }
    }

    if (addDay) {
      now.setDate(now.getDate() + 1)
    }

    const testNextDay = new Date(now)
    if (testNextDay.getTime() >= dateStop.getTime()) {
      continueLoop = false
    }
    checkAbort(signal)
  } while (continueLoop)

  if (nbDay === 0) {
    nbDay = 1
  }

  // format render
  for (const property in list) {
    list[property].etpt = fixDecimal(list[property].etpt / nbDay, 10000)
    list[property].indispo = list[property].indispo / nbDay
    list[property].reelEtp = fixDecimal(list[property].reelEtp / nbDay, 10000)
    list[property].nbDaysGone = getNbDaysGone(hr, dateStart, dateStop)
    list[property].nbDay = nbDay
  }

  return list
}

/**
 * Calcul de stock, moyenne, temps de traitement des activités
 * @param {*} referentielId
 * @param {*} totalIn
 * @param {*} lastStock
 * @param {*} magEtpAffected
 * @param {*} fonEtpAffected
 * @param {*} optionsBackups
 * @returns
 */
const calculateActivities = (referentielId, totalIn, lastStock, magEtpAffected, fonEtpAffected, optionsBackups) => {
  let magCalculateTimePerCase = null
  let fonCalculateTimePerCase = null
  let magCalculateOut = null
  let fonCalculateOut = null
  let magCalculateCoverage = null
  let fonCalculateCoverage = null
  let magCalculateDTESInMonths = null
  let fonCalculateDTESInMonths = null

  const findIndexOption = optionsBackups.findIndex((o) => o.contentieux.id === referentielId)
  if (findIndexOption !== -1) {
    magCalculateTimePerCase = optionsBackups[findIndexOption].averageProcessingTime
    fonCalculateTimePerCase = optionsBackups[findIndexOption].averageProcessingTime // A MODIFIER CAR LA BDD A CHANGER ET LE FONCTIONNEMENT DU CALCULATEUR EGALEMENT
  }

  if (magCalculateTimePerCase) {
    console.log('Calc=>', magEtpAffected, config, magCalculateTimePerCase)
    magCalculateOut = Math.round(magEtpAffected * config.nbHoursPerDayAndMagistrat * (config.nbDaysByMagistrat / 12) / magCalculateTimePerCase)
    fonCalculateOut = Math.round(
      fonEtpAffected * config.nbHoursPerDayAndFonctionnaire * (config.nbDaysByFonctionnaire / 12) / fonCalculateTimePerCase,
    )
    magCalculateCoverage = fixDecimal(magCalculateOut / (totalIn || 0))
    fonCalculateCoverage = fixDecimal(fonCalculateOut / (totalIn || 0))
    magCalculateDTESInMonths = lastStock === null ? null : fixDecimal(lastStock / magCalculateOut, 100)
    fonCalculateDTESInMonths = lastStock === null ? null : fixDecimal(lastStock / fonCalculateOut, 100)
  } else {
    magCalculateOut = null
    fonCalculateOut = null
    magCalculateCoverage = null
    fonCalculateCoverage = null
    magCalculateDTESInMonths = null
    fonCalculateDTESInMonths = null
  }

  return {
    magCalculateTimePerCase,
    fonCalculateTimePerCase,
    magCalculateOut,
    fonCalculateOut,
    magCalculateCoverage,
    fonCalculateCoverage,
    magCalculateDTESInMonths,
    fonCalculateDTESInMonths,
  }
}
