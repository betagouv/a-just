import { groupBy, sortBy, sumBy } from 'lodash'
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
export const syncCalculatorDatas = (list, nbMonth, activities, dateStart, dateStop, hr, categories, optionsBackups) => {
  console.log('syncCalculatorDatas')
  console.log('list hr', hr.map((h) => `${h.firstName} ${h.lastName}`).join(', '))
  const prefiltersActivities = groupBy(activities, 'contentieux.id')

  for (let i = 0; i < list.length; i++) {
    const childrens = (list[i].childrens || []).map((c) => ({
      ...c,
      nbMonth,
      ...getActivityValues(dateStart, dateStop, prefiltersActivities[c.contentieux.id] || [], c.contentieux.id, nbMonth, hr, categories, optionsBackups),
    }))

    list[i] = {
      ...list[i],
      ...getActivityValues(
        dateStart,
        dateStop,
        prefiltersActivities[list[i].contentieux.id] || [],
        list[i].contentieux.id,
        nbMonth,
        hr,
        categories,
        optionsBackups
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
const getActivityValues = (dateStart, dateStop, activities, referentielId, nbMonth, hr, categories, optionsBackups) => {
  activities = activities.filter((a) => month(a.periode).getTime() >= month(dateStart).getTime() && month(a.periode).getTime() <= month(dateStop).getTime())

  const totalIn = (activities || []).filter((e) => e.entrees !== null).length !== 0 ? Math.floor(sumBy(activities, 'entrees') / nbMonth) : null

  const totalOut = (activities || []).filter((e) => e.sorties !== null).length !== 0 ? Math.floor(sumBy(activities, 'sorties') / nbMonth) : null
  let lastStock = null
  if (activities.length) {
    const lastActivities = activities[activities.length - 1]
    if (lastActivities.stock !== null && isSameMonthAndYear(lastActivities.periode, dateStop)) {
      lastStock = lastActivities.stock
    }
  }

  const realCoverage = fixDecimal(totalOut / totalIn, 100)
  const realDTESInMonths = lastStock !== null ? fixDecimal(lastStock / totalOut, 100) : null

  const etpAffected = getHRPositions(hr, categories, referentielId, dateStart, dateStop)
  const etpMag = etpAffected.length > 0 ? fixDecimal(etpAffected[0].totalEtp, 1000) : 0
  const etpFon = etpAffected.length > 1 ? fixDecimal(etpAffected[1].totalEtp, 1000) : 0
  const etpCont = etpAffected.length > 2 ? fixDecimal(etpAffected[2].totalEtp, 1000) : 0

  // Temps moyens par dossier observé = (nb heures travaillées par mois) / (sorties moyennes par mois / etpt sur la periode)
  const magRealTimePerCase = fixDecimal(((config.nbDaysByMagistrat / 12) * config.nbHoursPerDayAndMagistrat) / (totalOut / etpMag))

  const fonRealTimePerCase = fixDecimal(((config.nbDaysByFonctionnaire / 12) * config.nbHoursPerDayAndFonctionnaire) / (totalOut / etpFon))

  return {
    ...calculateActivities(referentielId, totalIn, lastStock, etpMag, etpFon, optionsBackups),
    totalIn,
    totalOut,
    lastStock,
    realCoverage,
    realDTESInMonths,
    etpMag,
    magRealTimePerCase,
    etpFon,
    fonRealTimePerCase,
    etpCont,
    etpAffected,
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
const getHRPositions = (hr, categories, referentielId, dateStart, dateStop) => {
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
export const getHRVentilation = (hr, referentielId, categories, dateStart, dateStop) => {
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
  do {
    let nextDateFinded = null
    let lastEtpAdded = null
    let lastSituationId = null

    // only working day
    if (workingDay(now)) {
      nbDay++
      const { etp, situation, indispoFiltred, nextDeltaDate, reelEtp } = getEtpByDateAndPerson(referentielId, now, hr)
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

      const sumByInd = sumBy(indispoFiltred, 'percent')
      if (sumByInd !== 0) {
        indispoFiltred.map((c) => {
          if (c.contentieux.id === referentielId && list[categoryId]) list[categoryId].indispo += c.percent
        })
      }
    }

    //
    if (nextDateFinded) {
      //console.log(hr.id, nextDateFinded, now)
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
      // console.log(nextDateFinded)
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
    fonCalculateTimePerCase = optionsBackups[findIndexOption].averageProcessingTimeFonc // TODO pour JImmy a changer ici
  }

  if (magCalculateTimePerCase) {
    magCalculateOut = Math.floor((((magEtpAffected * config.nbHoursPerDayAndMagistrat) / magCalculateTimePerCase) * config.nbDaysByMagistrat) / 12)
    fonCalculateOut = Math.floor((((fonEtpAffected * config.nbHoursPerDayAndFonctionnaire) / fonCalculateTimePerCase) * config.nbDaysByFonctionnaire) / 12)
    magCalculateCoverage = fixDecimal(magCalculateOut / (totalIn || 0))
    fonCalculateCoverage = fixDecimal(fonCalculateOut / (totalIn || 0))
    magCalculateDTESInMonths = lastStock === null ? null : fixDecimal(lastStock / magCalculateOut)
    fonCalculateDTESInMonths = lastStock === null ? null : fixDecimal(lastStock / fonCalculateOut)
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
