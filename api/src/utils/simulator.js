import { isFirstDayOfMonth } from 'date-fns'
import { meanBy, orderBy, sortBy, sumBy } from 'lodash'
import { filterActivitiesByDateAndContentieuxId } from './activities'
import {
  checkIfDateIsNotToday,
  decimalToStringDate,
  getRangeOfMonthsAsObject,
  getShortMonthString,
  isSameMonthAndYear,
  month,
  nbOfDays,
  stringToDecimalDate,
  workingDay,
} from './date'
import { fixDecimal } from './number'
import config from 'config'
import { getEtpByDateAndPersonSimu } from './human-resource'

export const environment = {
  nbDaysByMagistrat: config.nbDaysByMagistrat,
  nbDaysPerMonthByMagistrat: config.nbDaysByMagistrat / 12,
  nbHoursPerDayAndByMagistrat: config.nbHoursPerDayAndMagistrat,
  nbDaysByFonctionnaire: 229.57,
  nbDaysPerMonthByFonctionnaire: 229.57 / 12,
  nbHoursPerDayAndByFonctionnaire: 7,
}

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
  etpAffected: null,
  etpToCompute: null,
}

export function mergeSituations (situationFiltered, situation, categories, categoryId) {
  categories.map((x) => {
    if (x.id !== categoryId) {
      if (x.id === 1) situationFiltered.etpMag = situation.etpMag
      if (x.id === 2) situationFiltered.etpFon = situation.etpFon
      if (x.id === 3) situationFiltered.etpCont = situation.etpCont

      if (situation.endSituation) {
        situationFiltered.endSituation.monthlyReport[x.id - 1] = situation.endSituation.monthlyReport[x.id - 1]
        if (x.id === 1) situationFiltered.endSituation.etpMag = situation.endSituation.etpMag
        if (x.id === 2) situationFiltered.endSituation.etpFon = situation.endSituation.etpFon
        if (x.id === 3) situationFiltered.endSituation.etpCont = situation.endSituation.etpCont
      }
    }
  })

  return situationFiltered
}

export function filterByCategoryAndFonction (hr, categoryId, functionIds) {
  return hr
    .map((human) => {
      let situations = human.situations.filter((situation) => {
        if (situation.category && situation.category.id === categoryId && functionIds.includes(situation.fonction.id)) return true
        else return false
      })
      if (situations.length !== 0) {
        return {
          ...human,
          situations: situations,
        }
      } else return { situations: [] }
    })
    .filter((x) => x.situations.length !== 0)
}
export async function getSituation (referentielId, hr, allActivities, categories, dateStart = undefined, dateStop = undefined, selectedCategoryId) {
  //console.log(selectedCategoryId, categories)
  const nbMonthHistory = 12
  const { lastActivities, startDateCs, endDateCs } = await getCSActivities(referentielId, allActivities, month(new Date(), -nbMonthHistory), month(new Date()))

  let totalIn = Math.floor(meanBy(lastActivities, 'entrees')) || 0
  let totalOut = Math.floor(meanBy(lastActivities, 'sorties')) || 0

  //console.log('TOTAL OUT 1', totalOut)
  let lastStock = lastActivities.length ? lastActivities[0].stock || 0 : 0

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

  const categoryLabel = categories.find((element) => element.id === selectedCategoryId).label
  let sufix = 'By' + categoryLabel
  if (lastActivities.length === 0) return emptySituation
  else {
    // Compute etpAffected & etpMag today (on specific date) to display & output
    etpAffectedToday = await getHRPositions(hr, referentielId, categories)
    console.log('etpAffectedToday', etpAffectedToday)
    // console.log(etpAffectedToday)
    let { etpMag, etpFon, etpCon } = getEtpByCategory(etpAffectedToday)
    //console.log('ETPMAG 1', etpMag)

    // Compute etpAffected of the 12 last months starting at the last month available in db to compute magRealTimePerCase
    console.log('startDateCs', startDateCs)
    console.log('endDateCs', endDateCs)
    let etpAffectedLast12MonthsToCompute = await getHRPositions(hr, referentielId, categories, new Date(startDateCs), true, new Date(endDateCs))

    console.log('etpAffectedLast12MonthsToCompute', etpAffectedLast12MonthsToCompute)
    ;({ etpMagToCompute, etpFonToCompute, etpConToCompute } = getEtpByCategory(etpAffectedLast12MonthsToCompute, 'ToCompute'))

    // console.log(etpMagToCompute)
    // Compute magRealTimePerCase to display using the etpAffected 12 last months available
    realTimePerCase = computeRealTimePerCase(totalOut, selectedCategoryId === 1 ? etpMagToCompute : etpFonToCompute, sufix)
    // console.log('realTimePerCase', realTimePerCase)

    // Compute totalOut with etp today (specific date) to display
    totalOut = computeTotalOut(realTimePerCase, selectedCategoryId === 1 ? etpMag : etpFon, sufix)
    console.log('totalOut', totalOut)

    // Projection of etpAffected between the last month available and today to compute stock
    let etpAffectedDeltaToCompute = await getHRPositions(hr, referentielId, categories, new Date(endDateCs), true, new Date())
    ;({ etpMagFuturToCompute, etpFonFuturToCompute, etpConFuturToCompute } = getEtpByCategory(etpAffectedDeltaToCompute, 'FuturToCompute'))
    console.log('etpAffectedDeltaToCompute', etpAffectedDeltaToCompute)
    const countOfCalandarDays = nbOfDays(endDateCs, month(new Date(), -1, true))

    // Compute stock projection until today
    // console.log(lastStock)
    lastStock = computeLastStock(
      lastStock,
      countOfCalandarDays,
      selectedCategoryId === 1 ? etpMagFuturToCompute : etpFonFuturToCompute,
      realTimePerCase,
      totalIn,
      sufix
    )
    console.log('lastStock', lastStock)

    //console.log({ totalOut, lastStock })

    // Compute realCoverage & realDTESInMonths using last available stock
    Coverage = computeCoverage(totalOut, totalIn)
    console.log(Coverage, totalOut, totalIn)
    DTES = computeDTES(lastStock, totalOut)
    console.log('DTES', DTES)

    if (checkIfDateIsNotToday(dateStart)) {
      const nbDayCalendar = nbOfDays(new Date(), new Date(dateStart))

      // Compute etpAffected & etpMag at dateStart (specific date) to display
      etpAffectedAtStartDate = await getHRPositions(hr, referentielId, categories, new Date(dateStart))
      ;({ etpMag, etpFon, etpCon } = getEtpByCategory(etpAffectedAtStartDate))
      //console.log('CHECK IF DATE IS NOT TODAY', etpMag)
      // Compute totalOut with etp at dateStart (specific date) to display
      totalOut = computeTotalOut(realTimePerCase, selectedCategoryId === 1 ? etpMag : etpFon, sufix)
      //console.log('totalOut', totalOut)

      // Projection of etpAffected between the last month available and dateStart to compute stock
      etpAffectedDeltaToCompute = await getHRPositions(hr, referentielId, categories, new Date(), true, new Date(dateStart))
      //console.log('DELTAAAAAA', etpAffectedDeltaToCompute)
      ;({ etpMagUntilStartDate, etpFonUntilStartDate, etpConUntilStartDate } = getEtpByCategory(etpAffectedDeltaToCompute, 'UntilStartDate'))

      // Compute stock, coverage, dtes projection until dateStart
      lastStock = computeLastStock(
        lastStock,
        nbDayCalendar,
        selectedCategoryId === 1 ? etpMagUntilStartDate : etpFonUntilStartDate,
        realTimePerCase,
        totalIn,
        sufix
      )

      Coverage = computeCoverage(totalOut, totalIn)
      DTES = computeDTES(lastStock, totalOut)
    }
    if (dateStop) {
      const nbDayCalendarProjected = nbOfDays(new Date(dateStart), new Date(dateStop))

      // Compute projected etp at stop date (specific date) to display
      const projectedEtpAffected = await getHRPositions(hr, referentielId, categories, dateStop)

      let { etpMagProjected, etpFonProjected, etpConProjected } = getEtpByCategory(projectedEtpAffected, 'Projected')

      // Compute projected out flow with projected etp at stop date (specific date)
      const projectedTotalOut = computeTotalOut(realTimePerCase, selectedCategoryId === 1 ? etpMagProjected : etpFonProjected, sufix)

      // Projection of etpAffected between start and stop date to compute stock
      let { etpAffectedStartToEndToCompute, monthlyReport } = await getHRPositions(hr, referentielId, categories, dateStart, true, dateStop, true)

      let { etpMagStartToEndToCompute, etpFonStartToEndToCompute, etpConStartToEndToCompute } = getEtpByCategory(
        etpAffectedStartToEndToCompute,
        'StartToEndToCompute'
      )

      // Compute projectedStock with etp at datestop
      const projectedLastStock = computeLastStock(
        lastStock,
        nbDayCalendarProjected,
        selectedCategoryId === 1 ? etpMagStartToEndToCompute : etpFonStartToEndToCompute,
        realTimePerCase,
        totalIn,
        sufix
      )
      const projectedCoverage = computeCoverage(projectedTotalOut, totalIn)
      const projectedDTES = computeDTES(projectedLastStock, projectedTotalOut)
      console.log({ monthlyReport: monthlyReport[2] })

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
    /**
    const tmpList = {
      etpMagFuturToCompute,
      countOfCalandarDays,
      etpAffectedDeltaToCompute,
      etpMagToCompute,
      etpAffectedToday,
      lastActivities,
      deltaOfMonths,
    }
    */

    //console.log('TOTAL ETPMAG', etpMag)
    return {
      //...tmpList,
      endSituation,
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
      etpToCompute: etpMagToCompute,
    }
  }
}

function computeCoverage (totalOut, totalIn) {
  return fixDecimal(totalOut / totalIn, 100)
}

function computeDTES (lastStock, totalOut) {
  return lastStock !== null && totalOut !== null ? fixDecimal(lastStock / totalOut, 100) : null
}

function computeLastStock (lastStock, countOfCalandarDays, futurEtp, magRealTimePerCase, totalIn, sufix) {
  console.log('Calcul des stocks', {
    lastStock,
    countOfCalandarDays,
    futurEtp,
    magRealTimePerCase,
    totalIn,
    ['nbDaysPerMonth' + sufix]: environment['nbDaysPerMonth' + sufix],
    result: Math.floor(
      lastStock -
        (countOfCalandarDays / (365 / 12)) *
          environment['nbDaysPerMonth' + sufix] *
          ((futurEtp * environment['nbHoursPerDayAnd' + sufix]) / magRealTimePerCase) +
        (countOfCalandarDays / (365 / 12)) * totalIn
    ),
  })
  if (magRealTimePerCase === 0) return Math.floor(lastStock)

  let stock = Math.floor(
    lastStock -
      (countOfCalandarDays / (365 / 12)) * environment['nbDaysPerMonth' + sufix] * ((futurEtp * environment['nbHoursPerDayAnd' + sufix]) / magRealTimePerCase) +
      (countOfCalandarDays / (365 / 12)) * totalIn
  )

  return stock < 0 ? 0 : stock
}

function computeTotalOut (magRealTimePerCase, etp, sufix) {
  console.log('etp', magRealTimePerCase, etp)
  return Math.floor((etp * environment['nbHoursPerDayAnd' + sufix] * (environment['nbDays' + sufix] / 12)) / magRealTimePerCase)
}

function computeRealTimePerCase (totalOut, etp, sufix) {
  let realTimeCorrectValue = fixDecimal(((environment['nbDays' + sufix] / 12) * environment['nbHoursPerDayAnd' + sufix]) / (totalOut / etp), 100)
  let realTimeCorrectvalueNotRounded = ((environment['nbDays' + sufix] / 12) * environment['nbHoursPerDayAnd' + sufix]) / (totalOut / etp)
  let realTimeDisplayed = decimalToStringDate(realTimeCorrectValue)
  let realTimeToUse = stringToDecimalDate(realTimeDisplayed)

  console.log(
    'computeRealTimePerCase',
    totalOut,
    etp,
    realTimeToUse,
    environment['nbDays' + sufix],
    environment['nbHoursPerDayAnd' + sufix],
    realTimeCorrectValue,
    realTimeDisplayed
  )
  //console.log('REAL TIME PER CASE 1.1', etp, realTimeCorrectValue, realTimeDisplayed, realTimeToUse)
  return realTimeToUse
}

export function getEtpByCategory (etpAffected, sufix = '') {
  //console.log(etpAffected)
  let etpMag = etpAffected.length >= 0 ? etpAffected[0].totalEtp : 0
  let etpFon = etpAffected.length >= 0 ? etpAffected[1].totalEtp : 0
  let etpCon = etpAffected.length >= 0 ? etpAffected[2].totalEtp : 0
  //console.log({ ['etpMag' + sufix]: etpMag, ['etpFon' + sufix]: etpFon, ['etpCon' + sufix]: etpCon })
  return { ['etpMag' + sufix]: etpMag, ['etpFon' + sufix]: etpFon, ['etpCon' + sufix]: etpCon }
}
/**
 * Get the Current Situations Activities of the last 12 months available
 * @param {*} referentielId
 * @param {*} allActivities
 * @param {*} filter
 * @param {*} dateStart
 * @param {*} dateStop
 * @returns
 */
export async function getCSActivities (referentielId, allActivities, dateStart, dateStop) {
  const lastActivities = orderBy(
    allActivities.filter(
      (a) =>
        a.contentieux.id === referentielId &&
        month(a.periode).getTime() >= month(dateStart).getTime() &&
        month(a.periode).getTime() <= month(dateStop).getTime()
    ),
    (a) => {
      const p = new Date(a.periode)
      return p.getTime()
    },
    ['desc']
  )

  const startDateCs = month(lastActivities[lastActivities.length - 1].periode)
  const endDateCs = month(lastActivities[0].periode, 0, 'lastday')
  endDateCs.setDate(endDateCs.getDate() + 1) // start to the first day of the next month
  endDateCs.setMinutes(endDateCs.getMinutes() + 1) // to fix JS bug

  return {
    lastActivities,
    startDateCs,
    endDateCs,
  }
}

export function hasInOutOrStock (activities) {
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

export function appearOneTimeAtLeast (situations, referentielId) {
  return situations.some((s) => {
    const activities = s.activities || []
    return activities.some((a) => a.contentieux.id === referentielId)
  })
}

export async function getHRPositions (hr, referentielId, categories, date = undefined, onPeriod = false, dateStop = undefined, monthlyReport = false) {
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
    let etptAll = []
    let monthlyList = null
    const situations = hr[i].situations || []

    if (onPeriod === true && appearOneTimeAtLeast(situations, referentielId)) {
      ({ etptAll, monthlyList } = {
        ...(await getHRVentilationOnPeriod(
          hr[i],
          referentielId,
          categories,
          date instanceof Date ? date : undefined,
          dateStop instanceof Date ? dateStop : undefined
        )),
      })
    } else if (appearOneTimeAtLeast(situations, referentielId)) {
      etptAll = await getHRVentilation(hr[i], referentielId, categories, date instanceof Date ? date : undefined)
    }

    Object.values(etptAll).map((c) => {
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
  }

  const list = []
  const listMonthly = []
  for (const [key, value] of Object.entries(hrCategories)) {
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

export async function getHRVentilationOnPeriod (hr, referentielId, categories, dateStart = undefined, dateStop = undefined) {
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
    if (isFirstDayOfMonth(now)) monthDaysCounter = 0

    if (workingDay(now)) {
      // only working day
      nbDay++
      monthDaysCounter++
      const { etp, situation } = await getEtpByDateAndPersonSimu(referentielId, now, hr)

      if (etp !== null) {
        // @ts-ignore
        list[situation.category.id].etpt += etp

        const str = getShortMonthString(now) + now.getFullYear().toString().slice(-2)

        // @ts-ignore
        monthlyList[str][situation.category.id].etpt += etp
        // @ts-ignore
        monthlyList[str][situation.category.id].nbOfDays = monthDaysCounter
        // @ts-ignore
      }
    }
    now.setDate(now.getDate() + 1)
  } while (now.getTime() <= stop.getTime())

  // format render
  for (const property in list) {
    list[property].etpt = list[property].etpt / nbDay
    Object.keys(monthlyList).map((x) => {
      if (monthlyList[x][property].nbOfDays !== 0) monthlyList[x][property].etpt = monthlyList[x][property].etpt / monthlyList[x][property].nbOfDays
    })
  }

  return { etptAll: list, monthlyList: { ...monthlyList } }
}

export async function getHRVentilation (hr, referentielId, categories, date) {
  const list = {}
  categories.map((c) => {
    list[c.id] = {
      etpt: 0,
      ...c,
    }
  })

  const now = date ? date : new Date()
  const { etp, situation } = await getEtpByDateAndPersonSimu(referentielId, now, hr)

  if (etp !== null && etp !== 0) {
    let listContentieux = situation ? situation.activities.map((c) => c.contentieux) : null
    if (listContentieux !== [] && listContentieux !== null) {
      listContentieux = listContentieux.filter((contentieux) => contentieux.id === referentielId)
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

export function execSimulation (params, simulation, dateStart, dateStop, sufix) {
  //console.log(params, simulation)
  params.toDisplay.map((x) => {
    if (params.beginSituation !== null) {
      simulation[x] = params.beginSituation[x]
      if (x === 'etpMag') simulation.etpFon = params.beginSituation.etpFon
      if (x === 'etpFon') simulation.etpMag = params.beginSituation.etpMag
    }
  })

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

  do {
    params.toCalculate.map((x) => {
      if (x === 'totalIn') {
        if (simulation.totalOut && (simulation.lastStock || simulation.lastStock === 0)) {
          simulation.totalIn = Math.floor(
            (Math.floor(simulation.lastStock) - Math.floor(params.beginSituation.lastStock)) / (nbOfDays(dateStart, dateStop) / (365 / 12)) +
              Math.floor(simulation.totalOut)
          )
        } else if (simulation.totalOut && simulation.realCoverage) {
          simulation.totalIn = Math.floor(Math.floor(simulation.totalOut) / simulation.realCoverage)
        }
      }
      if (x === 'totalOut') {
        if (simulation.etpMag && simulation.magRealTimePerCase) {
          simulation.totalOut = Math.floor(
            Math.floor(simulation.etpMag * environment['nbHoursPerDayAnd' + sufix] * environment['nbDaysPerMonth' + sufix]) / simulation.magRealTimePerCase
          )
        } else if (simulation.totalIn && (simulation.lastStock || simulation.lastStock === 0)) {
          simulation.totalOut = Math.floor(
            Math.floor(Math.floor(params.beginSituation.lastStock) - Math.floor(simulation.lastStock)) /
              (nbOfDays(new Date(dateStart), new Date(dateStop)) / (365 / 12)) +
              simulation.totalIn
          )
        } else if (simulation.lastStock && (simulation.realDTESInMonths || simulation.realDTESInMonths === 0)) {
          simulation.totalOut = Math.floor(simulation.lastStock / simulation.realDTESInMonths)
        } else if (simulation.realCoverage && simulation.totalIn) {
          simulation.totalOut = Math.floor(simulation.realCoverage * simulation.totalIn)
        } else if ((simulation.realDTESInMonths || simulation.realDTESInMonths === 0) && simulation.totalIn) {
          simulation.totalOut = Math.floor(
            (Math.floor(params.beginSituation.lastStock) + simulation.totalIn * (nbOfDays(new Date(dateStart), new Date(dateStop)) / (365 / 12))) /
              (simulation.realDTESInMonths + nbOfDays(new Date(dateStart), new Date(dateStop)) / (365 / 12))
          )
        }
      }

      if (x === 'lastStock') {
        if (simulation.realDTESInMonths === 0) {
          simulation.lastStock = 0
        } else if (simulation.totalIn && simulation.totalOut) {
          simulation.lastStock =
            Math.floor(params.beginSituation.lastStock) +
            Math.floor((nbOfDays(new Date(dateStart), new Date(dateStop)) / (365 / 12)) * simulation.totalIn) -
            Math.floor((nbOfDays(new Date(dateStart), new Date(dateStop)) / (365 / 12)) * simulation.totalOut)
        } else if ((simulation.realDTESInMonths || simulation.realDTESInMonths === 0) && simulation.totalOut) {
          simulation.lastStock = Math.floor(simulation.realDTESInMonths * simulation.totalOut)
        }
        if (simulation.lastStock && simulation.lastStock < 0) {
          simulation.lastStock = 0
        }
      }
      if (x === 'realCoverage') {
        if (simulation.totalOut && simulation.totalIn) {
          simulation.realCoverage = (simulation.totalOut || params.endSituation.totalOut) / (simulation.totalIn || params.endSituation.totalIn)
        }
      }
      if (x === 'realDTESInMonths') {
        simulation.realDTESInMonths =
          Math.round((Math.floor(simulation.lastStock || 0) / Math.floor(simulation.totalOut || params.endSituation.totalOut)) * 100) / 100
      }

      if (x === 'magRealTimePerCase') {
        simulation.magRealTimePerCase =
          Math.round(
            ((17.333 * 8 * (simulation.etpMag || params.beginSituation.etpMag)) / Math.floor(simulation.totalOut || params.endSituation.totalOut)) * 100
          ) / 100
      }

      if (x === 'etpMag') {
        simulation.etpFon = params.beginSituation.etpFon

        simulation.etpMag =
          Math.round(
            (((simulation.magRealTimePerCase || params.endSituation.magRealTimePerCase) * Math.floor(simulation.totalOut || params.endSituation.totalOut)) /
              (17.333 * 8)) *
              100
          ) / 100
      }
      if (x === 'etpFon') {
        simulation.etpMag = params.beginSituation.etpMag

        simulation.etpFon =
          Math.round(
            (((simulation.magRealTimePerCase || params.endSituation.magRealTimePerCase) * Math.floor(simulation.totalOut || params.endSituation.totalOut)) /
              ((229.57 / 12) * 7)) *
              100
          ) / 100
      }
    })
  } while (
    !(
      simulation.totalIn !== null &&
      simulation.totalOut !== null &&
      simulation.lastStock !== null &&
      (simulation.etpMag !== null || simulation.etpFon !== null) &&
      simulation.magRealTimePerCase !== null &&
      simulation.realDTESInMonths !== null &&
      simulation.realCoverage !== null
    )
  )

  //console.log('$$$$$$$$$$$', simulation)
  return simulation
}
