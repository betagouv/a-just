import { isFirstDayOfMonth } from 'date-fns'
import { groupBy, map, meanBy, orderBy, sortBy, sumBy } from 'lodash'
import { checkIfDateIsNotToday, getRangeOfMonthsAsObject, getShortMonthString, month, nbOfDays, today, workingDay } from './date'
import { fixDecimal } from './number'
import config from 'config'
import { calculateETPForContentieux, getEtpByDateAndPersonSimu } from './human-resource'
import { canHaveUserCategoryAccess } from './hr-catagories'
import { HAS_ACCESS_TO_CONTRACTUEL, HAS_ACCESS_TO_GREFFIER, HAS_ACCESS_TO_MAGISTRAT } from '../constants/access'
import { checkAbort } from './abordTimeout'

/**
 * Variable de temps travail en fonction de la category
 */
export const environment = {
  nbDaysByMagistrat: config.nbDaysByMagistrat,
  nbDaysPerMonthByMagistrat: config.nbDaysByMagistrat / 12,
  nbHoursPerDayAndByMagistrat: config.nbHoursPerDayAndMagistrat,
  nbDaysByGreffe: 229.57,
  nbDaysPerMonthByGreffe: 229.57 / 12,
  nbHoursPerDayAndByGreffe: 7,
  nbDaysByContractuel: 229.57,
  nbDaysPerMonthByContractuel: 229.57 / 12,
  nbHoursPerDayAndByContractuel: 7,
}

/**
 * Situation null
 */
const emptySituation = {
  totalIn: null,
  totalOut: null,
  lastStock: null,
  realCoverage: null,
  realDTESInMonths: null,
  etpMag: null,
  magRealTimePerCase: null,
  etpFon: null,
  etpCont: null,
  etpUseToday: null,
  etpAffected: null,
  etpToCompute: null,
}

/**
 * Aggrégation de simulation permettant d'ajouter les calculs d'ETP des catégories non selectionnées
 * @param {*} situationFiltered situation calculé
 * @param {*} situation situation
 * @param {*} categories category magistrat, fonctionnaire, greffier
 * @param {*} categoryId catégory selectionnée
 * @returns situation
 */
export function mergeSituations(situationFiltered, situation, categories, categoryId, ctx) {
  const etpMagAccess = canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_MAGISTRAT)
  const etpFonAccess = canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_GREFFIER)
  const etpContAccess = canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_CONTRACTUEL)

  categories.map((x) => {
    if (x.id !== categoryId) {
      if (x.id === 1) situationFiltered.etpMag = situation.etpMag
      if (x.id === 2) situationFiltered.etpFon = situation.etpFon
      if (x.id === 3) situationFiltered.etpCont = situation.etpCont || situation.etpCon
      if (situation.endSituation) {
        situationFiltered.endSituation.monthlyReport[x.id - 1] = situation.endSituation.monthlyReport[x.id - 1]
        if (x.id === 1) situationFiltered.endSituation.etpMag = situation.endSituation.etpMag
        if (x.id === 2) situationFiltered.endSituation.etpFon = situation.endSituation.etpFon
        if (x.id === 3) situationFiltered.endSituation.etpCont = situation.endSituation.etpCont
      }
    }
  })

  situationFiltered = {
    ...situationFiltered,
    etpMag: etpMagAccess ? situationFiltered.etpMag : 0,
    etpFon: etpFonAccess ? situationFiltered.etpFon : 0,
    etpCont: etpContAccess ? situationFiltered.etpCont : 0,
  }

  return situationFiltered
}

/**
 * Filtre des situations par catégorie et par fonction
 * @param {*} hr liste de ressources
 * @param {*} categoryId catégorie selectionnée
 * @param {*} functionIds fonctions selectionées
 * @param {*} date date selectionées en option
 * @returns liste de hr avec situations filtrées
 */
export function filterByCategoryAndFonction(hr, categoryId, functionIds, date) {
  hr = hr
    .map((human) => {
      const situations = (human.situations || []).map((situation) => {
        if (categoryId && situation.category && situation.category.id !== categoryId) {
          situation.etp = null
        }

        if (functionIds && !functionIds.includes(situation.fonction.id)) {
          situation.etp = null
        }

        return situation
      })

      return {
        ...human,
        situations,
      }
    })
    .filter((x) => {
      const situations = x.situations || []
      const hasEtp = situations.some((s) => s.etp !== null)

      return hasEtp
    })

  // mouve null etp to 0 to fix calculs
  hr = hr.map((human) => {
    const situations = (human.situations || []).map((situation) => {
      if (situation.etp === null) {
        situation.etp = 0
      }

      return situation
    })

    return {
      ...human,
      situations,
    }
  })

  if (date) {
    date = today(date)
    hr = hr.filter((h) => {
      const dateStart = h.dateStart ? today(h.dateStart) : null
      const dateEnd = h.dateEnd ? today(h.dateEnd) : null

      if (dateStart && dateStart.getTime() > date.getTime()) {
        return false
      }

      if (dateEnd && dateEnd.getTime() <= date.getTime()) {
        return false
      }

      return true
    })
  }

  return hr
}

/**
 * Calcul d'une situation
 * @param {*} referentielId contentieux selectionné
 * @param {*} hr liste de ressources humaines
 * @param {*} allActivities liste des activités
 * @param {*} categories liste des catégories
 * @param {*} dateStart date de début
 * @param {*} dateStop date de fin
 * @param {*} selectedCategoryId catégorie selectionnée
 * @returns une situation à une date donnée ou sur une période
 */
export async function getSituation(
  referentielId,
  hr,
  allActivities,
  categories,
  dateStart = undefined,
  dateStop = undefined,
  selectedCategoryId,
  signal = null,
  indexes,
  useNew = false,
  simulatorUse = true,
  fonctionIds = undefined,
) {
  checkAbort(signal)
  if (Array.isArray(referentielId) === false) referentielId = [referentielId]
  const nbMonthHistory = 12
  const { lastActivities, startDateCs, endDateCs } = await getCSActivities(referentielId, allActivities)
  checkAbort(signal)

  let summedlastActivities = map(groupBy(lastActivities, 'periode'), (val, idx) => {
    return { id: idx, entrees: sumBy(val, 'entrees'), sorties: sumBy(val, 'sorties'), stock: sumBy(val, 'stock') }
  })
  // calcul des entrées/sorties sur les 12 derniers mois
  let totalIn = meanBy(summedlastActivities, 'entrees') || 0
  let totalOut = meanBy(summedlastActivities, 'sorties') || 0

  // récupération du dernier stock
  let lastStock = lastActivities.length ? summedlastActivities[0].stock || 0 : 0

  let realTimePerCase = undefined
  let DTES = undefined
  let Coverage = undefined
  let etpAffectedAtStartDate = undefined
  let etpAffectedToday = undefined
  let etpMagToCompute = undefined
  let etpFonToCompute = undefined
  let etpConToCompute = undefined
  let endSituation = undefined
  let etpAffectedDeltaToCompute = undefined
  let etpMagFuturToCompute = undefined
  let etpFonFuturToCompute = undefined
  let etpConFuturToCompute = undefined
  let etpMagUntilStartDate = undefined
  let etpFonUntilStartDate = undefined
  let etpConUntilStartDate = undefined

  // indicateur pour récupérer variable d'environnement
  const categoryLabel = categories.find((element) => element.id === selectedCategoryId).label
  let sufix = 'By' + categoryLabel

  // Compute etpAffected & etpMag today (on specific date) to display & output
  etpAffectedToday = useNew
    ? calculateETPForContentieux(
        indexes,
        {
          start: today(),
          end: today(),
          category: undefined,
          fonctions: fonctionIds,
          contentieux: referentielId[0],
        },
        categories,
      )
    : await getHRPositions(hr, referentielId, categories, undefined, undefined, undefined, undefined, signal)

  let { etpMag, etpFon, etpCon } = getEtpByCategory(etpAffectedToday)

  if (lastActivities.length === 0 && totalIn === 0 && totalOut === 0) return { ...emptySituation, etpMag, etpFon, etpCon, totalIn, totalOut, lastStock }
  else {
    // Compute etpAffected of the 12 last months starting at the last month available in db to compute magRealTimePerCase
    let etpAffectedLast12MonthsToCompute = useNew
      ? calculateETPForContentieux(
          indexes,
          {
            start: new Date(startDateCs),
            end: new Date(endDateCs),
            category: undefined,
            fonctions: fonctionIds,
            contentieux: referentielId[0],
          },
          categories,
        )
      : await getHRPositions(hr, referentielId, categories, new Date(startDateCs), true, new Date(endDateCs), undefined, signal)
    checkAbort(signal)
    ;({ etpMagToCompute, etpFonToCompute, etpConToCompute } = getEtpByCategory(etpAffectedLast12MonthsToCompute, 'ToCompute'))

    //console.log('Data to calculate TMD', totalOut, etpMagToCompute)
    // Compute magRealTimePerCase to display using the etpAffected 12 last months available
    realTimePerCase = computeRealTimePerCase(totalOut, selectedCategoryId === 1 ? etpMagToCompute : etpFonToCompute, sufix)

    // Compute totalOut with etp today (specific date) to display
    totalOut = computeTotalOut(realTimePerCase, selectedCategoryId === 1 ? etpMag : etpFon, sufix)
    //console.log('To compare final totalOut : ', totalOut, 'Tmd used : ', realTimePerCase, 'ETP used : ', selectedCategoryId === 1 ? etpMag : etpFon)

    // Projection of etpAffected between the last month available and today to compute stock
    let etpAffectedDeltaToCompute = useNew
      ? calculateETPForContentieux(
          indexes,
          {
            start: new Date(endDateCs),
            end: new Date(),
            category: undefined,
            fonctions: fonctionIds,
            contentieux: referentielId[0],
          },
          categories,
        )
      : await getHRPositions(hr, referentielId, categories, new Date(endDateCs), true, new Date(), undefined, signal)
    ;({ etpMagFuturToCompute, etpFonFuturToCompute, etpConFuturToCompute } = getEtpByCategory(etpAffectedDeltaToCompute, 'FuturToCompute'))

    const countOfCalandarDays = nbOfDays(endDateCs, new Date())

    // Compute stock projection until today
    lastStock = computeLastStock(
      lastStock,
      countOfCalandarDays,
      selectedCategoryId === 1 ? etpMagFuturToCompute : etpFonFuturToCompute,
      realTimePerCase,
      totalIn,
      sufix,
    )

    // Compute realCoverage & realDTESInMonths using last available stock
    Coverage = computeCoverage(totalOut, totalIn)
    //console.log('To compare computeCoverage :', Coverage, totalOut, totalIn)
    DTES = computeDTES(lastStock, totalOut)
    if (checkIfDateIsNotToday(dateStart)) {
      const nbDayCalendar = nbOfDays(new Date(), new Date(dateStart))

      // Compute etpAffected & etpMag at dateStart (specific date) to display
      etpAffectedAtStartDate = useNew
        ? calculateETPForContentieux(
            indexes,
            {
              start: new Date(dateStart),
              end: new Date(dateStart),
              category: undefined,
              fonctions: fonctionIds,
              contentieux: referentielId[0],
            },
            categories,
          )
        : await getHRPositions(hr, referentielId, categories, new Date(dateStart), undefined, undefined, undefined, signal)
      ;({ etpMag, etpFon, etpCon } = getEtpByCategory(etpAffectedAtStartDate))

      // Compute totalOut with etp at dateStart (specific date) to display
      totalOut = computeTotalOut(realTimePerCase, selectedCategoryId === 1 ? etpMag : etpFon, sufix)

      // Projection of etpAffected between the last month available and dateStart to compute stock
      etpAffectedDeltaToCompute = useNew
        ? calculateETPForContentieux(
            indexes,
            {
              start: new Date(),
              end: new Date(dateStart),
              category: undefined,
              fonctions: fonctionIds,
              contentieux: referentielId[0],
            },
            categories,
          )
        : await getHRPositions(hr, referentielId, categories, new Date(), true, new Date(dateStart), undefined, signal)
      ;({ etpMagUntilStartDate, etpFonUntilStartDate, etpConUntilStartDate } = getEtpByCategory(etpAffectedDeltaToCompute, 'UntilStartDate'))
      checkAbort(signal)

      // Compute stock, coverage, dtes projection until dateStart
      lastStock = computeLastStock(
        lastStock,
        nbDayCalendar,
        selectedCategoryId === 1 ? etpMagUntilStartDate : etpFonUntilStartDate,
        realTimePerCase,
        totalIn,
        sufix,
      )

      Coverage = computeCoverage(totalOut, totalIn)
      DTES = computeDTES(lastStock, totalOut)
    }
    if (dateStop) {
      const nbDayCalendarProjected = nbOfDays(new Date(dateStart), new Date(dateStop))

      // Compute projected etp at stop date (specific date) to display
      const projectedEtpAffected = useNew
        ? calculateETPForContentieux(
            indexes,
            {
              start: dateStop,
              end: dateStop,
              category: undefined,
              fonctions: fonctionIds,
              contentieux: referentielId[0],
            },
            categories,
          )
        : await getHRPositions(hr, referentielId, categories, dateStop, undefined, undefined, undefined, signal)
      checkAbort(signal)

      let { etpMagProjected, etpFonProjected, etpConProjected } = getEtpByCategory(projectedEtpAffected, 'Projected')

      // Compute projected out flow with projected etp at stop date (specific date)
      const projectedTotalOut = computeTotalOut(realTimePerCase, selectedCategoryId === 1 ? etpMagProjected : etpFonProjected, sufix)

      let etpAffectedStartToEndToCompute, monthlyReport

      if (simulatorUse === true) {
        monthlyReport = await monthlyReportQuery(indexes, referentielId, categories, dateStart, dateStop, fonctionIds)
      }

      // Projection of etpAffected between start and stop date to compute stock
      etpAffectedStartToEndToCompute = calculateETPForContentieux(
        indexes,
        {
          start: dateStart,
          end: dateStop,
          category: undefined,
          fonctions: fonctionIds,
          contentieux: referentielId[0],
        },
        categories,
      )

      checkAbort(signal)

      let { etpMagStartToEndToCompute, etpFonStartToEndToCompute, etpConStartToEndToCompute } = getEtpByCategory(
        etpAffectedStartToEndToCompute,
        'StartToEndToCompute',
      )

      // Compute projectedStock with etp at datestop
      const projectedLastStock = computeLastStock(
        lastStock,
        nbDayCalendarProjected,
        selectedCategoryId === 1 ? etpMagStartToEndToCompute : etpFonStartToEndToCompute,
        realTimePerCase,
        totalIn,
        sufix,
      )
      const projectedCoverage = computeCoverage(projectedTotalOut, totalIn)
      const projectedDTES = computeDTES(projectedLastStock, projectedTotalOut)

      endSituation = {
        totalIn,
        totalOut: projectedTotalOut,
        lastStock: projectedLastStock,
        realCoverage: projectedCoverage,
        realDTESInMonths: projectedDTES,
        magRealTimePerCase: realTimePerCase,
        etpMag: etpMagProjected,
        etpAffected: etpAffectedStartToEndToCompute,
        etpFon: etpFonProjected,
        etpCont: etpConProjected,
        magCalculateCoverage: null,
        fonCalculateCoverage: null,
        magCalculateDTESInMonths: null,
        magCalculateTimePerCase: null,
        nbMonthHistory,
        etpToCompute: etpMagStartToEndToCompute,
        monthlyReport: monthlyReport,
      }
    }

    return {
      endSituation,
      countOfCalandarDays,
      totalIn,
      totalOut,
      lastStock,
      realCoverage: Coverage,
      realDTESInMonths: DTES,
      magRealTimePerCase: realTimePerCase,
      etpMag,
      etpFon,
      etpCont: etpCon,
      etpAffected: etpAffectedAtStartDate || etpAffectedToday,
      etpUseToday: selectedCategoryId === 1 ? etpMag : selectedCategoryId === 2 ? etpFon : etpCon,
      etpToCompute: etpMagToCompute,
      nbWorkingHours: environment['nbHoursPerDayAnd' + sufix],
      nbWorkingDays: environment['nbDaysPerMonth' + sufix],
    }
  }
}

/**
 * Calcul du taux de couverture
 * @param {*} totalOut sorties
 * @param {*} totalIn entrées
 * @returns taux de couverture en %
 */
export function computeCoverage(totalOut, totalIn) {
  return fixDecimal(totalOut / totalIn, 100)
}

/**
 * Calcul du DTES
 * @param {*} lastStock quantité de stock
 * @param {*} totalOut sorties
 * @returns le délai nécessaire pour écolouer la totalité des stocks en mois
 */
export function computeDTES(lastStock, totalOut) {
  return lastStock !== null && totalOut !== null ? fixDecimal(lastStock / totalOut, 100) : null
}

/**
 * Calcul du stock
 * @param {*} lastStock quantité de stock
 * @param {*} countOfCalandarDays nombre de jours travaillés
 * @param {*} futurEtp etp moyen sur la période calculée
 * @param {*} magRealTimePerCase temps moyen par dossier
 * @param {*} totalIn entrées
 * @param {*} sufix catégorie
 * @returns stock calculé
 */
function computeLastStock(lastStock, countOfCalandarDays, futurEtp, magRealTimePerCase, totalIn, sufix) {
  if (magRealTimePerCase === 0) return Math.floor(lastStock)

  let stock =
    lastStock -
    (countOfCalandarDays / (365 / 12)) * environment['nbDaysPerMonth' + sufix] * ((futurEtp * environment['nbHoursPerDayAnd' + sufix]) / magRealTimePerCase) +
    (countOfCalandarDays / (365 / 12)) * totalIn

  return stock
}

/**
 * Calcul des sorties
 * @param {*} magRealTimePerCase temps moyen par dossier
 * @param {*} etp etp à un instant précis
 * @param {*} sufix catégorie
 * @returns nombre de dossier sorties
 */
function computeTotalOut(magRealTimePerCase, etp, sufix) {
  return (etp * environment['nbHoursPerDayAnd' + sufix] * (environment['nbDays' + sufix] / 12)) / magRealTimePerCase
}

/**
 * Calcul du temps moyen par dossier
 * @param {*} totalOut sortie
 * @param {*} etp etp moyen sur les 12 derniers mois
 * @param {*} sufix catégorie
 * @returns le temps moyen par dossier sur les 12 derniers mois
 */
export function computeRealTimePerCase(totalOut, etp, sufix) {
  let realTime = fixDecimal((environment['nbDays' + sufix] * environment['nbHoursPerDayAnd' + sufix] * etp) / (totalOut * 12), 1000)
  return Math.trunc(realTime) + Math.round((realTime - Math.trunc(realTime)) * 60) / 60
}

/**
 * Retourne un objet d'ETP formaté pour le front
 * @param {*} etpAffected objet d'etp calculé comprenant les 3 catégories
 * @param {*} sufix catégorie selectionnée
 * @returns objet formaté contenant les etp pour chaque catégorie
 */
export function getEtpByCategory(etpAffected, sufix = '') {
  let etpMag = etpAffected.length >= 0 ? etpAffected[0].totalEtp : 0
  let etpFon = etpAffected.length >= 0 ? etpAffected[1].totalEtp : 0
  let etpCon = etpAffected.length >= 0 ? etpAffected[2].totalEtp : 0

  return {
    ['etpMag' + sufix]: etpMag,
    ['etpFon' + sufix]: etpFon,
    ['etpCon' + sufix]: etpCon,
  }
}

/**
 * Get the Current Situations Activities of the last 12 months available
 * @param {*} referentielId contentieux id
 * @param {*} allActivities liste des activités
 * @param {*} dateStart date de début
 * @param {*} dateStop date de fin
 * @returns situation
 */
export async function getCSActivities(referentielId, allActivities) {
  if (allActivities.length !== 0) {
    const filteredByContentieux = allActivities.filter((a) => referentielId.includes(a.contentieux.id))

    const dateStop = filteredByContentieux.reduce((a, b) => {
      return a.periode > b.periode ? a.periode : b.periode
    }, new Date())
    const dateStart = month(new Date(dateStop), -11)

    const lastActivities = orderBy(
      filteredByContentieux.filter(
        (a) => month(a.periode).getTime() >= month(dateStart).getTime() && month(a.periode).getTime() <= month(dateStop).getTime() && a.stock !== null,
      ),
      (a) => {
        const p = new Date(a.periode)
        return p.getTime()
      },
      ['desc'],
    )

    const startDateCs = month(lastActivities.length ? lastActivities[lastActivities.length - 1].periode : new Date())
    const endDateCs = month(lastActivities.length ? lastActivities[0].periode : new Date(), 0, 'lastday')
    //endDateCs.setDate(endDateCs.getDate() + 1) // start to the first day of the next month
    //endDateCs.setMinutes(endDateCs.getMinutes() + 1) // to fix JS bug

    return {
      lastActivities,
      startDateCs,
      endDateCs,
    }
  } else return { lastActivities: [], dateStart: month(new Date(), -11), dateStop: new Date() }
}

/**
 * Indique si une activité à au moins des entrées, des stock ou des sorties
 * @param {*} activities
 * @returns
 */
export function hasInOutOrStock(activities) {
  let hasIn = false
  let hasOut = false
  let hasStock = false

  if (activities.length !== 0)
    activities.map((activity) => {
      if (activity.entrees && activity.entrees !== 0) hasIn = true
      if (activity.sorties && activity.sorties !== 0) hasOut = true
      if (activity.stock && activity.stock !== 0) hasStock = true
    })

  return hasIn && hasOut && hasStock
}

/**
 * Indique si un contentieux se trouve dans une liste de situation
 * @param {*} situations liste de situation
 * @param {*} referentielId contentieux id
 * @returns boolean indiquant si le contentieux se trouve dans une liste de situation
 */
export function appearOneTimeAtLeast(situations, referentielId) {
  return situations.some((s) => {
    const activities = s.activities || []
    return activities.some((a) => referentielId.includes(a.contentieux.id))
  })
}

/**
 * Calcul de l'etp pour une liste de ressource humaine
 * @param {*} models liste tables de BDD
 * @param {*} hr liste des ressources humaines
 * @param {*} referentielId contentieux id
 * @param {*} categories liste de categories
 * @param {*} date date de début
 * @param {*} onPeriod indication de positions sur une période
 * @param {*} dateStop date de fin
 * @param {*} monthlyReport données mensuels
 * @returns objet contenant l'ETP calculé
 */
export async function getHRPositions(
  hr,
  referentielId,
  categories,
  date = undefined,
  onPeriod = false,
  dateStop = undefined,
  monthlyReport = false,
  signal = null,
) {
  const hrCategories = {}
  let hrCategoriesMonthly = new Object({})
  let emptyList = new Object({})

  emptyList = { ...getRangeOfMonthsAsObject(date, dateStop, true) }
  Object.keys(emptyList).map((x) => {
    emptyList[x] = {
      ...{
        etpt: 0,
      },
    }
  })

  categories.map((c) => {
    hrCategories[c.label] = hrCategories[c.label] || {
      totalEtp: 0,
      list: [],
      rank: c.rank,
    }
    hrCategoriesMonthly[c.label] = {
      ...JSON.parse(JSON.stringify(emptyList)),
    }
  })

  for (let i = 0; i < hr.length; i++) {
    checkAbort(signal)
    let etptAll = []
    let monthlyList = null
    const situations = hr[i].situations || []

    if (onPeriod === true && appearOneTimeAtLeast(situations, referentielId)) {
      ;({ etptAll, monthlyList } = {
        ...(await getHRVentilationOnPeriod(
          hr[i],
          referentielId,
          categories,
          date instanceof Date ? date : undefined,
          dateStop instanceof Date ? dateStop : undefined,
          signal,
        )),
      })
      checkAbort(signal)
    } else if (appearOneTimeAtLeast(situations, referentielId)) {
      etptAll = await getHRVentilation(hr[i], referentielId, categories, date instanceof Date ? date : undefined, signal)
      checkAbort(signal)
    }

    Object.values(etptAll).map((c) => {
      checkAbort(signal)
      if (c.etpt) {
        hrCategories[c.label].list.push(hr[i])
        hrCategories[c.label].totalEtp += c.etpt
      }

      if (onPeriod === true && dateStop) {
        Object.keys(monthlyList).map((month) => {
          if (c.label === monthlyList[month][c.id].name) hrCategoriesMonthly[c.label][month].etpt += monthlyList[month][c.id].etpt
        })
      }
    })
    checkAbort(signal)
  }

  const list = []
  const listMonthly = []
  for (const [key, value] of Object.entries(hrCategories)) {
    checkAbort(signal)
    list.push({
      name: key,
      // @ts-ignore
      totalEtp: fixDecimal(value.totalEtp || 0, 100),
      // @ts-ignore
      rank: value.rank,
    })

    if (monthlyReport) {
      let tmpObj = []

      Object.keys(hrCategoriesMonthly[key]).map((x) => {
        checkAbort(signal)
        hrCategoriesMonthly[key][x].etpt = fixDecimal(hrCategoriesMonthly[key][x].etpt || 0)

        tmpObj.push({
          ...{
            name: x,
            // @ts-ignore
            etpt: fixDecimal(hrCategoriesMonthly[key][x].etpt || 0),
          },
        })
      })

      listMonthly.push({
        name: key,
        // @ts-ignore
        values: { ...tmpObj },
      })
    }
  }

  if (monthlyReport) {
    return {
      etpAffectedStartToEndToCompute: sortBy(list, 'rank'),
      monthlyReport: listMonthly,
    }
  } else return sortBy(list, 'rank')
}

export async function getHRVentilationOnPeriod(hr, referentielId, categories, dateStart = undefined, dateStop = undefined, signal = null) {
  const list = {}
  let monthlyList = {}

  if (dateStart && dateStop) {
    monthlyList = {
      ...getRangeOfMonthsAsObject(dateStart, dateStop, true),
    }
  }

  categories.map((c) => {
    list[c.id] = {
      etpt: 0,
      ...c,
    }

    Object.keys(monthlyList).map((x) => {
      monthlyList[x][c.id] = {
        name: c.label,
        etpt: 0,
        nbOfDays: 0,
      }
    })
  })

  const now = dateStart instanceof Date ? new Date(dateStart) : new Date()
  const stop = dateStop instanceof Date ? new Date(dateStop) : new Date()

  let nbDay = 0
  let monthDaysCounter = 0
  do {
    checkAbort(signal)
    if (isFirstDayOfMonth(now)) monthDaysCounter = 0

    if (workingDay(now)) {
      // only working day
      nbDay++
      monthDaysCounter++
      const { etp, situation } = await getEtpByDateAndPersonSimu(referentielId, now, hr, signal)
      checkAbort(signal)

      if (etp !== null && situation && situation.category) {
        const str = getShortMonthString(now) + now.getFullYear().toString().slice(-2)

        if (monthlyList[str]) {
          // @ts-ignore
          list[situation.category.id].etpt += etp
          // @ts-ignore
          monthlyList[str][situation.category.id].etpt += etp
          // @ts-ignore
          monthlyList[str][situation.category.id].nbOfDays = monthDaysCounter
        }
      }
    }
    checkAbort(signal)
    now.setDate(now.getDate() + 1)
  } while (now.getTime() <= stop.getTime())

  // format render
  for (const property in list) {
    checkAbort(signal)
    list[property].etpt = list[property].etpt / nbDay
    Object.keys(monthlyList).map((x) => {
      if (monthlyList[x][property].nbOfDays !== 0) monthlyList[x][property].etpt = monthlyList[x][property].etpt / monthlyList[x][property].nbOfDays
    })
  }

  return { etptAll: list, monthlyList: { ...monthlyList } }
}

/**
 * Recupère les ventilations à une date donnée
 * @param {*} hr liste des ressources humaines
 * @param {*} referentielId contentieux id
 * @param {*} categories liste des categories
 * @param {*} date date selectionné
 * @returns objet contenant l'etp
 */
export async function getHRVentilation(hr, referentielId, categories, date, signal = null) {
  const list = {}
  categories.map((c) => {
    list[c.id] = {
      etpt: 0,
      ...c,
    }
  })

  const now = date ? date : new Date()
  const { etp, situation } = await getEtpByDateAndPersonSimu(referentielId, now, hr, signal)
  checkAbort(signal)

  if (etp !== null && etp !== 0) {
    let listContentieux = situation ? situation.activities.map((c) => c.contentieux) : null
    if (listContentieux !== [] && listContentieux !== null) {
      listContentieux = listContentieux.filter((contentieux) => referentielId.includes(contentieux.id))
    }
  }

  if (etp !== null) {
    // @ts-ignore
    list[situation.category.id].etpt += etp
  }

  // format render
  for (const property in list) {
    list[property].etpt = list[property].etpt / 1
  }

  return list
}

/**
 * Calcule d'une simulation
 * @param {*} params paramètres de la simulation
 * @param {*} simulation simulation initialisée
 * @param {*} dateStart date de début
 * @param {*} dateStop date de fin
 * @param {*} sufix catégorie
 * @returns simulation calculée
 */
export function execSimulation(params, simulation, dateStart, dateStop, sufix, ctx) {
  params.toDisplay.map((x) => {
    if (params.beginSituation !== null) {
      simulation[x] = params.beginSituation[x]
      if (x === 'etpMag') simulation.etpFon = params.endSituation.etpFon
      if (x === 'etpFon') simulation.etpMag = params.endSituation.etpMag
    }
  })

  const nbDays = nbOfDays(today(dateStart), today(dateStop))

  if (params.lockedParams.param1.label !== '' && simulation[params.lockedParams.param1.label] !== undefined)
    //@ts-ignore
    simulation[params.lockedParams.param1.label] =
      params.lockedParams.param1.label === 'realCoverage' ? parseFloat(params.lockedParams.param1.value) / 100 : parseFloat(params.lockedParams.param1.value)
  if (params.lockedParams.param2.label !== '' && simulation[params.lockedParams.param2.label] !== undefined)
    //@ts-ignore
    simulation[params.lockedParams.param2.label] =
      params.lockedParams.param2.label === 'realCoverage' ? parseFloat(params.lockedParams.param2.value) / 100 : parseFloat(params.lockedParams.param2.value)

  if (params.modifiedParams.param1.input !== 0)
    //@ts-ignore
    simulation[params.modifiedParams.param1.label] =
      params.modifiedParams.param1.label === 'realCoverage'
        ? parseFloat(params.modifiedParams.param1.value) / 100
        : parseFloat(params.modifiedParams.param1.value)

  if (params.modifiedParams.param2.input !== 0)
    //@ts-ignore
    simulation[params.modifiedParams.param2.label] =
      params.modifiedParams.param2.label === 'realCoverage'
        ? parseFloat(params.modifiedParams.param2.value) / 100
        : parseFloat(params.modifiedParams.param2.value)

  let counterExit = 0
  do {
    params.toCalculate.map((x) => {
      if (x === 'totalIn') {
        if (simulation.totalOut && (simulation.lastStock || simulation.lastStock === 0)) {
          simulation.totalIn = (simulation.lastStock - params.beginSituation.lastStock) / (nbDays / (365 / 12)) + simulation.totalOut
        } else if (simulation.totalOut && simulation.realCoverage) {
          simulation.totalIn = simulation.totalOut / simulation.realCoverage
        }
      }
      if (x === 'totalOut') {
        if ((simulation.etpMag || simulation.etpFon) && simulation.magRealTimePerCase) {
          if ([...params.toDisplay, ...params.toCalculate].includes('etpMag')) {
            //console.log('compute 1.1', Math.floor(
            //simulation.etpMag * environment['nbHoursPerDayAnd' + sufix] * environment['nbDaysPerMonth' + sufix] / simulation.magRealTimePerCase
            //),Math.floor(simulation.etpMag * environment['nbHoursPerDayAnd' + sufix] * environment['nbDaysPerMonth' + sufix]), simulation.etpMag,environment['nbHoursPerDayAnd' + sufix],environment['nbDaysPerMonth' + sufix],simulation.magRealTimePerCase)
            simulation.totalOut =
              (simulation.etpMag * environment['nbHoursPerDayAnd' + sufix] * environment['nbDaysPerMonth' + sufix]) / simulation.magRealTimePerCase
          } else {
            simulation.totalOut =
              (simulation.etpFon * environment['nbHoursPerDayAnd' + sufix] * environment['nbDaysPerMonth' + sufix]) / simulation.magRealTimePerCase
          }
        } else if (simulation.totalIn && (simulation.lastStock || simulation.lastStock === 0)) {
          simulation.totalOut = (params.beginSituation.lastStock - simulation.lastStock) / (nbDays / (365 / 12)) + simulation.totalIn
        } else if (simulation.lastStock && (simulation.realDTESInMonths || simulation.realDTESInMonths !== 0)) {
          simulation.totalOut = simulation.lastStock / simulation.realDTESInMonths
        } else if (simulation.realCoverage && simulation.totalIn) {
          simulation.totalOut = simulation.realCoverage * simulation.totalIn
        } else if ((simulation.realDTESInMonths || simulation.realDTESInMonths === 0) && simulation.totalIn) {
          simulation.totalOut =
            (params.beginSituation.lastStock + simulation.totalIn * (nbDays / (365 / 12))) / (simulation.realDTESInMonths + nbDays / (365 / 12))
        }
      }

      if (x === 'lastStock') {
        //if (simulation.realDTESInMonths === 0) {
        //simulation.lastStock = 0
        //} else
        if (simulation.totalIn && simulation.totalOut) {
          simulation.lastStock = params.beginSituation.lastStock + (nbDays / (365 / 12)) * simulation.totalIn - (nbDays / (365 / 12)) * simulation.totalOut
        } else if ((simulation.realDTESInMonths || simulation.realDTESInMonths !== 0) && simulation.totalOut) {
          simulation.lastStock = simulation.realDTESInMonths * simulation.totalOut
        } else if (simulation.totalOut && simulation.realDTESInMonths === 0) {
          simulation.lastStock = 0
        }
        if (simulation.lastStock && simulation.lastStock < 0) {
          //simulation.lastStock = 0
        }
      }
      if (x === 'realCoverage') {
        if (simulation.totalOut && simulation.totalIn) {
          simulation.realCoverage = (simulation.totalOut || params.endSituation.totalOut) / (simulation.totalIn || params.endSituation.totalIn)
        }
      }
      if (x === 'realDTESInMonths') {
        simulation.realDTESInMonths = (simulation.lastStock || 0) / (simulation.totalOut || params.endSituation.totalOut)
      }

      if (x === 'magRealTimePerCase') {
        if ([...params.toDisplay, ...params.toCalculate].includes('etpMag')) {
          simulation.magRealTimePerCase =
            (environment['nbDaysPerMonthByMagistrat'] * 8 * (simulation.etpMag || params.beginSituation.etpMag)) /
            (simulation.totalOut || params.endSituation.totalOut)
        } else {
          simulation.magRealTimePerCase =
            (environment['nbDaysPerMonthByGreffe'] * 7 * (simulation.etpFon || params.beginSituation.etpFon)) /
            (simulation.totalOut || params.endSituation.totalOut)
        }
      }

      if (x === 'etpMag') {
        simulation.etpFon = params.endSituation.etpFon
        simulation.etpMag =
          ((simulation.magRealTimePerCase || params.endSituation.magRealTimePerCase) * (simulation.totalOut || params.endSituation.totalOut)) /
          (environment['nbDaysPerMonthByMagistrat'] * 8)
      }
      if (x === 'etpFon') {
        simulation.etpMag = params.endSituation.etpMag
        simulation.etpFon =
          ((simulation.magRealTimePerCase || params.endSituation.magRealTimePerCase) * (simulation.totalOut || params.endSituation.totalOut)) /
          (environment['nbDaysPerMonthByGreffe'] * 7)
      }
    })
    if (counterExit >= 5) {
      return null
    }
    counterExit++
  } while (
    !(
      simulation.totalIn !== undefined &&
      simulation.totalOut !== undefined &&
      simulation.lastStock !== undefined &&
      (simulation.etpMag !== undefined || simulation.etpFon !== undefined) &&
      simulation.magRealTimePerCase !== undefined &&
      simulation.realDTESInMonths !== undefined &&
      simulation.realCoverage !== undefined
    )
  )
  return simulation
}

export const filterByFonctionWithIndex = (hr, fonctionsIds, functionIndex, periodsDatabase) => {
  if (!fonctionsIds || !fonctionsIds.length) {
    return hr
  }

  // Créer un Set des periodIds correspondant aux fonctions filtrées
  const periodIdSet = new Set(fonctionsIds.flatMap((fid) => functionIndex.get(fid) || []))

  // Créer un Set des agentIds ayant au moins un periodId correspondant
  const agentIdSet = new Set()

  periodIdSet.forEach((periodId) => {
    const period = periodsDatabase.get(periodId)
    if (period) {
      agentIdSet.add(period.agentId)
    } else {
      console.warn(`⚠️ periodId ${periodId} not found in periodsDatabase`)
    }
  })

  // Filtrer les agents dont l'id est dans agentIdSet
  const filteredAgents = hr.filter((agent) => agentIdSet.has(agent.id))

  return filteredAgents
}

export const filterByContentieuxWithIndex = (hr, contentieuxIds, contentieuxIndex) => {
  if (!contentieuxIds || !contentieuxIds.length) return hr

  // Récupérer tous les situationIds correspondant aux contentieux demandés
  const situationIdSet = new Set(contentieuxIds.flatMap((cid) => contentieuxIndex.get(cid) || []))

  return hr
    .filter((agent) => (agent.situations || []).some((situation) => situationIdSet.has(situation.id)))
    .map((agent) => {
      const situations = (agent.situations || []).map((situation) => {
        // Vérifier si la situation est concernée par l'un des contentieux demandés
        const keepContentieux = situationIdSet.has(situation.id)

        return {
          ...situation,
          etp: keepContentieux ? situation.etp : 0,
        }
      })

      return {
        ...agent,
        situations,
      }
    })
    .filter((agent) => (agent.situations || []).some((s) => s.etp && s.etp !== 0))
}

// NEW OPTIMISED CODE :

/**
 * Construction de l'index des périodes par agent à partir des périodes RH stables
 */
export function buildPeriodsByAgent(periodsList) {
  const periodsByAgent = new Map()

  for (const period of periodsList) {
    if (!periodsByAgent.has(period.agentId)) {
      periodsByAgent.set(period.agentId, [])
    }
    periodsByAgent.get(period.agentId).push(period)
  }

  for (const periods of periodsByAgent.values()) {
    periods.sort((a, b) => new Date(a.start) - new Date(b.start))
  }

  return periodsByAgent
}

export function getStartAndEndDateOfMonth(label, yearSuffix) {
  const monthsMap = {
    'Janv.': 0,
    'Févr.': 1,
    Mars: 2,
    'Avr.': 3,
    'Mai.': 4,
    Juin: 5,
    'Juil.': 6,
    Août: 7,
    'Sept.': 8,
    'Oct.': 9,
    'Nov.': 10,
    'Déc.': 11,
  }

  const month = monthsMap[label]
  const year = parseInt('20' + yearSuffix)

  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)

  return { start, end }
}

export function splitMonthKey(key) {
  const match = key.match(/^([^\d]+)(\d{2})$/)
  if (match) return [match[1], match[2]]
  throw new Error(`Mois invalide : ${key}`)
}

export async function monthlyReportQuery(indexes, referentielId, categories, dateStart, dateStop, fonctionIds, signal = null) {
  const monthlyList = getRangeOfMonthsAsObject(dateStart, dateStop, true)

  // Initialisation des données
  Object.keys(monthlyList).forEach((monthKey) => {
    categories.forEach((category) => {
      monthlyList[monthKey][category.id] = {
        name: category.label,
        etpt: 0,
        nbOfDays: 0,
      }
    })
  })

  // Traitement rapide par mois
  for (const monthKey of Object.keys(monthlyList)) {
    const [monthLabel, yearSuffix] = splitMonthKey(monthKey) // Ex: "Août25" => ["Août", "25"]
    const { start, end } = getStartAndEndDateOfMonth(monthLabel, yearSuffix) // à implémenter
    const etps = await calculateETPForContentieux(
      indexes,
      {
        start,
        end,
        category: undefined,
        fonctions: fonctionIds,
        contentieux: referentielId[0],
      },
      categories,
    )

    etps.forEach(({ name, totalEtp }) => {
      const category = categories.find((c) => c.label === name)

      if (!category) {
        console.warn(`Catégorie "${name}" non trouvée dans la liste des catégories.`)
        return
      }

      const catId = category.id.toString()

      if (!monthlyList[monthKey]?.[catId]) {
        console.warn(`monthlyList[${monthKey}][${catId}] introuvable.`)
        return
      }

      monthlyList[monthKey][catId].etpt = parseFloat(totalEtp.toFixed(3))
    })
  }

  const finalFormatted = formatMonthlyListToCategoryArray(monthlyList, categories)

  return finalFormatted
}
function formatMonthlyListToCategoryArray(monthlyList, categories) {
  const formatted = categories.map((category) => ({
    name: category.label,
    values: {},
  }))

  const monthKeys = Object.keys(monthlyList)

  monthKeys.forEach((monthKey, index) => {
    const categoryValues = monthlyList[monthKey]

    categories.forEach((category) => {
      const categoryData = formatted.find((f) => f.name === category.label)

      categoryData.values[index.toString()] = {
        name: monthKey,
        etpt: parseFloat((categoryValues[category.id]?.etpt || 0).toFixed(3)),
      }
    })
  })

  return formatted
}
