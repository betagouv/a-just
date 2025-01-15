import { cloneDeep, groupBy, sortBy, sumBy } from 'lodash'
import { isSameMonthAndYear, month, nbWorkingDays, workingDay } from './date'
import { fixDecimal } from './number'
import config from 'config'
import { getEtpByDateAndPerson } from './human-resource'

/**
 * Création d'un tableau vide du calculateur de tout les contentieux et sous contentieux
 * @param {*} referentiels
 * @returns
 */
export const emptyCalulatorValues = (referentiels) => {
  const list = []
  for (let i = 0; i < referentiels.length; i++) {
    const childrens = (referentiels[i].childrens || []).map((c) => {
      const cont = { ...c, parent: referentiels[i] }

      return {
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
        contentieux: cont,
        nbMonth: 0,
      }
    })

    list.push({
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
      childrens,
      contentieux: referentiels[i],
      nbMonth: 0,
    })
  }

  return list
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
export const syncCalculatorDatas = (models, list, nbMonth, activities, dateStart, dateStop, hr, categories, optionsBackups, loadChildrens) => {
  const prefiltersActivities = groupBy(activities, 'contentieux.id')

  for (let i = 0; i < list.length; i++) {
    const childrens = !loadChildrens
      ? []
      : (list[i].childrens || []).map((c) => ({
        ...c,
        nbMonth,
        ...getActivityValues(
          models,
          dateStart,
          dateStop,
          prefiltersActivities[c.contentieux.id] || [],
          c.contentieux.id,
          nbMonth,
          hr,
          categories,
          optionsBackups,
          false
        ),
      }))

    list[i] = {
      ...list[i],
      ...getActivityValues(
        models,
        dateStart,
        dateStop,
        prefiltersActivities[list[i].contentieux.id] || [],
        list[i].contentieux.id,
        nbMonth,
        hr,
        categories,
        optionsBackups,
        true
      ),
      childrens,
      nbMonth,
    }
  }

  return list
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
const getActivityValues = (models, dateStart, dateStop, activities, referentielId, nbMonth, hr, categories, optionsBackups, loadDetails) => {
  let { meanOutCs, etpMagCs, etpFonCs, meanOutBf, lastStockBf, totalInBf, totalOutBf, lastStockAf, totalInAf, totalOutAf } = getLastTwelveMonths(
    models,
    dateStart,
    dateStop,
    activities,
    referentielId,
    hr,
    categories,
    loadDetails
  )

  activities = activities.filter((a) => month(a.periode).getTime() >= month(dateStart).getTime() && month(a.periode).getTime() <= month(dateStop).getTime())

  const totalIn = (activities || []).filter((e) => e.entrees !== null).length !== 0 ? sumBy(activities, 'entrees') / nbMonth : null

  const totalOut = (activities || []).filter((e) => e.sorties !== null).length !== 0 ? sumBy(activities, 'sorties') / nbMonth : null
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

  const etpAffected = getHRPositions(models, hr, categories, referentielId, dateStart, dateStop)
  const etpMag = etpAffected.length > 0 ? fixDecimal(etpAffected[0].totalEtp, 100) : 0
  const etpFon = etpAffected.length > 1 ? fixDecimal(etpAffected[1].totalEtp, 100) : 0
  const etpCont = etpAffected.length > 2 ? fixDecimal(etpAffected[2].totalEtp, 100) : 0

  let etpAffectedBf = []
  let etpMagBf = null
  let etpFonBf = null
  let etpContBf = null
  let etpAffectedAf = []
  let etpMagAf = null
  let etpFonAf = null
  let etpContAf = null

  let oneMonthAfterStart = month(new Date(dateStart), 0, 'lastday')
  let oneMonthBeforeEnd = new Date(dateStop)
  oneMonthBeforeEnd.setDate(1)

  if (loadDetails === true) {
    // ETP début
    etpAffectedBf = getHRPositions(models, hr, categories, referentielId, dateStart, oneMonthAfterStart)
    etpMagBf = etpAffectedBf.length > 0 ? fixDecimal(etpAffectedBf[0].totalEtp, 100) : 0
    etpFonBf = etpAffectedBf.length > 1 ? fixDecimal(etpAffectedBf[1].totalEtp, 100) : 0
    etpContBf = etpAffectedBf.length > 2 ? fixDecimal(etpAffectedBf[2].totalEtp, 100) : 0

    // ETP fin
    etpAffectedAf = getHRPositions(models, hr, categories, referentielId, oneMonthBeforeEnd, dateStop)
    etpMagAf = etpAffectedAf.length > 0 ? fixDecimal(etpAffectedAf[0].totalEtp, 100) : 0
    etpFonAf = etpAffectedAf.length > 1 ? fixDecimal(etpAffectedAf[1].totalEtp, 100) : 0
    etpContAf = etpAffectedAf.length > 2 ? fixDecimal(etpAffectedAf[2].totalEtp, 100) : 0
  }
  // Temps moyens par dossier observé = (nb heures travaillées par mois) / (sorties moyennes par mois / etpt sur la periode)
  const magRealTimePerCase = fixDecimal(((config.nbDaysByMagistrat / 12) * config.nbHoursPerDayAndMagistrat) / (meanOutCs / etpMagCs), 100)
  const fonRealTimePerCase = fixDecimal(((config.nbDaysByFonctionnaire / 12) * config.nbHoursPerDayAndFonctionnaire) / (meanOutCs / etpFonCs), 100)
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
  }
}

/**
 *
 */
const getLastTwelveMonths = (models, dateStart, dateStop, activities, referentielId, hr, categories, computeAll) => {
  /**
   * Calcul sur les 12 derniers mois avant date de fin
   */

  // Date: 12 mois avant date de fin selectionnée dans calculateur (début du mois)
  const startCs = month(new Date(dateStop), -11)
  startCs.setDate(startCs.getDate() + 1)
  startCs.setMinutes(startCs.getMinutes() + 1)

  // Date: fin de période selecitonnée dans calculateur (fin du mois)
  const endCs = month(new Date(dateStop), 0, 'lastday')
  let lastStockCs = null
  let totalInCs = null
  let totalOutCs = null

  // Clone de l'objet activities et filtre par date
  let activitesEnd = cloneDeep(activities)
  activitesEnd = activitesEnd.filter((a) => month(a.periode).getTime() >= month(startCs).getTime() && month(a.periode).getTime() <= month(endCs).getTime())

  if (activitesEnd.length) {
    const lastActivities = activitesEnd[activitesEnd.length - 1]
    if (lastActivities.stock !== null && isSameMonthAndYear(lastActivities.periode, endCs)) {
      lastStockCs = lastActivities.stock
      totalInCs = lastActivities.entrees
      totalOutCs = lastActivities.sorties
    }
  }

  // Calcul des sorties moyennes 12 derniers mois à compter de la date de fin selectionnée dans le calculateur
  const meanOutCs = (activitesEnd || []).filter((e) => e.sorties !== null).length !== 0 ? sumBy(activitesEnd, 'sorties') / 12 : null
  const etpByCategory = getHRPositions(models, hr, categories, referentielId, startCs, endCs)
  const etpMagCs = etpByCategory.length > 0 ? fixDecimal(etpByCategory[0].totalEtp, 100) : 0
  const etpFonCs = etpByCategory.length > 0 ? fixDecimal(etpByCategory[1].totalEtp, 100) : 0

  let lastStockBf = null
  let totalInBf = null
  let totalOutBf = null
  let meanOutBf = null

  if (computeAll === true) {
    /**
     * Calcul sur les 12 derniers mois avant date de début
     */
    // Date début de période selecitonnée dans le calculateur (fin du mois)
    const endBf = month(new Date(dateStart), 0, 'lastday')

    // Date 12 mois avant la date de début selectionnée dans le calculateur (début du mois)
    const startBf = month(new Date(endBf), -11)
    startBf.setDate(startBf.getDate() + 1)
    startBf.setMinutes(startBf.getMinutes() + 1)

    // Clone de l'objet activities et filtre par date
    let activitesStart = cloneDeep(activities)
    activitesStart = activitesStart.filter(
      (a) => month(a.periode).getTime() >= month(startBf).getTime() && month(a.periode).getTime() <= month(endBf).getTime()
    )

    // Calcul des sorties moyennes 12 derniers mois à compter de la date de début selectionnée dans le calculateur
    meanOutBf = (activitesStart || []).filter((e) => e.sorties !== null).length !== 0 ? sumBy(activitesStart, 'sorties') / 12 : null

    if (activitesStart.length) {
      const lastActivities = activitesStart[activitesStart.length - 1]
      if (isSameMonthAndYear(lastActivities.periode, endBf)) {
        if(lastActivities.stock !== null) {
          lastStockBf = lastActivities.stock
        }
        if(lastActivities.entrees !== null) {
          totalInBf = lastActivities.entrees
        }

        if(lastActivities.sorties !== null) {
          totalOutBf = lastActivities.sorties
        }
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
      const etptAll = getHRVentilation(models, hr[i], referentielId, categories, dateStart, dateStop)

      Object.values(etptAll).map((c) => {
        if (c.etpt) {
          hrCategories[c.label].list.push(hr[i])
          hrCategories[c.label].totalEtp += fixDecimal(c.etpt, 1000)
        }
      })
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

/**
 * Calcul du temps de ventilation d'un magistrat et d'un contentieux
 * @param {*} hr
 * @param {*} referentielId
 * @param {*} categories
 * @param {*} dateStart
 * @param {*} dateStop
 * @returns
 */
export const getHRVentilation = (models, hr, referentielId, categories, dateStart, dateStop, ddgFilter = false, absLabels = null) => {
  const cache = models.HumanResources.cacheAgent(hr.id, { referentielId, categories, dateStart, dateStop, ddgFilter, absLabels })
  if (cache) {
    return cache
  }

  const list = new Object()
  categories.map((c) => {
    list[c.id] = new Object({
      etpt: 0,
      indispo: 0,
      reelEtp: 0,
      ...c,
    })
  })

  let now = new Date(dateStart)
  let nbDay = 0
  let nbDaysGone = 0
  do {
    let nextDateFinded = null
    let lastEtpAdded = null
    let lastSituationId = null

    // only working day
    if (workingDay(now)) {
      let sumByInd = 0
      if (hr.dateEnd && hr.dateEnd.getTime() <= dateStop.getTime() && now.getTime() > hr.dateEnd.getTime()) nbDaysGone++
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
      const etpByDateAndPerson = getEtpByDateAndPerson(referentielId, now, hr, ddgFilter, absLabels)
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
        nextDateFinded = new Date(nextDeltaDate)
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
        nextDateFinded = new Date(dateStop)
        nextDateFinded.setDate(nextDateFinded.getDate() + 1)
      }

      // don't block the average
      if (lastEtpAdded !== null && lastSituationId !== null) {
        const nbDayBetween = nbWorkingDays(now, nextDateFinded)
        nbDay += nbDayBetween - 1
        list[lastSituationId].etpt += nbDayBetween * lastEtpAdded
      }

      // quick move to the next date
      now = new Date(nextDateFinded)
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

  models.HumanResources.updateCacheAgent(hr.id, { referentielId, categories, dateStart, dateStop, ddgFilter, absLabels }, list)
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
    magCalculateOut = Math.floor(Math.floor(magEtpAffected * config.nbHoursPerDayAndMagistrat * (config.nbDaysByMagistrat / 12)) / magCalculateTimePerCase)
    fonCalculateOut = Math.floor(
      Math.floor(fonEtpAffected * config.nbHoursPerDayAndFonctionnaire * (config.nbDaysByFonctionnaire / 12)) / fonCalculateTimePerCase
    )
    //magCalculateOut = Math.floor((((magEtpAffected * config.nbHoursPerDayAndMagistrat) / magCalculateTimePerCase) * config.nbDaysByMagistrat) / 12)
    //fonCalculateOut = Math.floor((((fonEtpAffected * config.nbHoursPerDayAndFonctionnaire) / fonCalculateTimePerCase) * config.nbDaysByFonctionnaire) / 12)
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
