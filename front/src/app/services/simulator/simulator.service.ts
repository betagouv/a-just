import { Injectable } from '@angular/core'
import { groupBy, last, sortBy, sumBy } from 'lodash'
import { BehaviorSubject } from 'rxjs'
import { SimulatorInterface } from 'src/app/interfaces/simulator'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { MainClass } from 'src/app/libs/main-class'
import {
  month,
  nbOfDays,
  workingDay,
  nbOfWorkingDays,
  decimalToStringDate,
  getRangeOfMonthsAsObject,
  getRangeOfMonths,
  isFirstDayOfMonth,
} from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'
import { ActivitiesService } from '../activities/activities.service'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { environment } from 'src/environments/environment'
import { SimulationInterface } from 'src/app/interfaces/simulation'
import * as _ from 'lodash'
import { etpAffectedInterface } from 'src/app/interfaces/calculator'
import { ChartAnnotationBoxInterface } from 'src/app/interfaces/chart-annotation-box'

const start = new Date()
const end = new Date()

@Injectable({
  providedIn: 'root',
})
export class SimulatorService extends MainClass {
  situationActuelle: BehaviorSubject<SimulatorInterface | null> =
    new BehaviorSubject<SimulatorInterface | null>(null)
  situationProjected: BehaviorSubject<SimulatorInterface | null> =
    new BehaviorSubject<SimulatorInterface | null>(null)
  situationSimulated: BehaviorSubject<SimulationInterface | null> =
    new BehaviorSubject<SimulationInterface | null>(null)
  contentieuOrSubContentieuId: BehaviorSubject<number | null> =
    new BehaviorSubject<number | null>(null)
  dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(start)
  dateStop: BehaviorSubject<Date> = new BehaviorSubject<Date>(end)
  chartAnnotationBox: BehaviorSubject<ChartAnnotationBoxInterface> =
    new BehaviorSubject<ChartAnnotationBoxInterface>({
      display: false,
      xMin: null,
      xMax: null,
      content: undefined,
    })

  startCurrentSituation = month(new Date(), -12)
  endCurrentSituation = month(new Date(), -1, 'lastday')
  constructor(
    private humanResourceService: HumanResourceService,
    private activitiesService: ActivitiesService
  ) {
    super()

    this.watch(
      this.chartAnnotationBox.subscribe(() => {
        if (this.chartAnnotationBox.getValue()) {
        }
      })
    )

    this.watch(
      this.contentieuOrSubContentieuId.subscribe(() => {
        if (this.contentieuOrSubContentieuId.getValue()) {
          this.syncDatas(this.contentieuOrSubContentieuId.getValue())
        }
      })
    )

    this.watch(
      this.dateStart.subscribe(() => {
        if (this.contentieuOrSubContentieuId.getValue()) {
          this.syncDatas(
            this.contentieuOrSubContentieuId.getValue(),
            this.dateStart.getValue()
          )
        }
      })
    )

    this.watch(
      this.dateStop.subscribe(() => {
        if (this.contentieuOrSubContentieuId.getValue()) {
          this.syncDatas(
            this.contentieuOrSubContentieuId.getValue(),
            this.dateStart.getValue(),
            this.dateStop.getValue()
          )
        }
      })
    )
  }

  syncDatas(referentielId: number | null, dateStart?: Date, dateStop?: Date) {
    if (referentielId !== null) {
      const nbMonth = 12
      const list: SimulatorInterface | null = {
        ...this.getSituation(referentielId, nbMonth, dateStart, dateStop),
        etpFon: null,
        etpCont: null,
        calculateCoverage: null,
        calculateDTESInMonths: null,
        calculateTimePerCase: null,
        nbMonth,
      }
      if (!dateStop) this.situationActuelle.next(list)
    }
  }

  /**
   * Get situation data
   * @param {number | null} referentielId
   * @param {number} nbMonth  nb of month in the past used to compute data
   * @param {Date} dateStart optional start date of the situation
   * @param {Date} dateStop optional end date of the situation
   *
   * @returns Situation data interface
   */
  getSituation(
    referentielId: number | null,
    nbMonth: number,
    dateStart?: Date,
    dateStop?: Date
  ) {
    // get 12 last months starting from now
    let activities = sortBy(
      this.activitiesService.activities
        .getValue()
        .filter(
          (a) =>
            a.contentieux.id === referentielId &&
            month(a.periode).getTime() >=
              month(this.startCurrentSituation).getTime() &&
            month(a.periode).getTime() <=
              month(this.endCurrentSituation).getTime()
        ),
      'periode'
    )

    // check when is the last month available on this periode with in and out flows
    let counter = 1
    let lastActivitiesEntreesSorties: any = []
    do {
      counter--
      lastActivitiesEntreesSorties = activities.filter((a) =>
        this.isSameMonthAndYear(
          a.periode,
          month(this.endCurrentSituation, counter, 'lastday')
        )
      )
      if (
        lastActivitiesEntreesSorties.length !== 0 &&
        (lastActivitiesEntreesSorties[0].entrees ||
          lastActivitiesEntreesSorties[0].sorties)
      )
        break
    } while (lastActivitiesEntreesSorties.length === 0 && counter != -12)

    // if last month not available, then get the 12 last months starting from the last available
    if (counter !== -12 && counter !== 0) {
      activities = sortBy(
        this.activitiesService.activities
          .getValue()
          .filter(
            (a) =>
              a.contentieux.id === referentielId &&
              month(a.periode).getTime() >=
                month(this.startCurrentSituation, counter).getTime() &&
              month(a.periode).getTime() <=
                month(this.endCurrentSituation, counter, 'lastday').getTime()
          ),
        'periode'
      )
    }

    let totalIn = Math.floor(sumBy(activities, 'entrees') / nbMonth)
    let totalOut = Math.floor(sumBy(activities, 'sorties') / nbMonth)
    let lastStock = null

    if (activities.length) {
      let lastActivities: any = []
      let nbOfMonth = 1
      // compute number of months without stock starting from today
      do {
        nbOfMonth--
        lastActivities = activities.filter((a) =>
          this.isSameMonthAndYear(
            a.periode,
            month(this.endCurrentSituation, nbOfMonth, 'lastday')
          )
        )
        if (lastActivities.length !== 0 && lastActivities[0].stock) break
      } while (lastActivities.length === 0 && nbOfMonth != -12)

      // last available stock
      lastStock = sumBy(lastActivities, 'stock')

      // Compute etpAffected & etpMag today (on specific date) to display & output
      let etpAffected = this.getHRPositions(
        referentielId as number
      ) as Array<etpAffectedInterface>
      let etpMag = etpAffected.length >= 0 ? etpAffected[0].totalEtp : 0

      // Compute etpAffected of the 12 last months starting at the last month available in db to compute realTimePerCase
      let etpAffectedToCompute = this.getHRPositions(
        referentielId as number,
        new Date(month(this.startCurrentSituation, counter)),
        true,
        new Date(month(this.endCurrentSituation, counter, 'lastday'))
      )
      let etpToCompute = sumBy(
        etpAffectedToCompute as Array<etpAffectedInterface>,
        'totalEtp'
      )

      // Compute realTimePerCase to display using the etpAffected 12 last months available
      let realTimePerCase = fixDecimal(
        ((environment.nbDaysByMagistrat / 12) * environment.nbHoursPerDay) /
          (totalOut / etpToCompute)
      )

      // Compute totalOut with etp at dateStart (specific date) to display
      totalOut = Math.floor((etpMag * 8 * 17.33) / realTimePerCase)

      // Projection of etpAffected between the last month available and today to compute stock
      let fururEtpAffectedToCompute = this.getHRPositions(
        referentielId as number,
        month(this.endCurrentSituation, counter, 'lastday'),
        true,
        new Date()
      )
      let futurEtpToCompute = sumBy(
        fururEtpAffectedToCompute as Array<etpAffectedInterface>,
        'totalEtp'
      )

      const countOfCalandarDays = nbOfDays(
        month(this.endCurrentSituation, counter, 'lastday'),
        new Date()
      )

      // Compute stock projection until today
      lastStock =
        Math.floor(lastStock) -
        Math.floor(
          (countOfCalandarDays / (365 / 12)) *
            17.33 *
            ((futurEtpToCompute * 8) / realTimePerCase)
        ) +
        Math.floor((countOfCalandarDays / (365 / 12)) * totalIn)

      // Compute realCoverage & realDTESInMonths using last available stock
      let realCoverage = fixDecimal(totalOut / totalIn)
      let realDTESInMonths =
        lastStock !== null && totalOut !== null
          ? fixDecimal(lastStock / totalOut)
          : null

      const today = new Date()
      if (
        dateStart &&
        (dateStart?.getDate() !== today.getDate() ||
          dateStart?.getMonth() !== today.getMonth() ||
          dateStart?.getFullYear() !== today.getFullYear())
      ) {
        const nbDayCalendar = nbOfDays(
          new Date(),
          new Date(this.dateStart.getValue())
        )

        // Compute etpAffected & etpMag at dateStart (specific date) to display
        etpAffected = this.getHRPositions(
          referentielId as number,
          dateStart
        ) as Array<etpAffectedInterface>
        etpMag = etpAffected.length >= 0 ? etpAffected[0].totalEtp : 0

        // Compute totalOut with etp at dateStart (specific date) to display
        totalOut = Math.floor((etpMag * 8 * 17.33) / realTimePerCase)

        // Projection of etpAffected between the last month available and today to compute stock
        fururEtpAffectedToCompute = this.getHRPositions(
          referentielId as number,
          new Date(),
          true,
          dateStart
        )
        futurEtpToCompute = sumBy(
          fururEtpAffectedToCompute as Array<etpAffectedInterface>,
          'totalEtp'
        )

        // Compute projectedStock with etp at dateStart
        lastStock =
          Math.floor(lastStock) -
          Math.floor(
            (nbDayCalendar / (365 / 12)) *
              17.33 *
              ((futurEtpToCompute * 8) / realTimePerCase)
          ) +
          Math.floor((nbDayCalendar / (365 / 12)) * totalIn)

        realCoverage = fixDecimal(totalOut / totalIn)
        realDTESInMonths =
          lastStock !== null && totalOut !== null
            ? fixDecimal(lastStock / totalOut)
            : null
      }
      if (dateStop) {
        const nbDayCalendarProjected = nbOfDays(
          new Date(this.dateStart.getValue()),
          new Date(this.dateStop.getValue())
        )

        // Compute projected etp at stop date (specific date) to display
        const projectedEtpAffected = this.getHRPositions(
          referentielId as number,
          dateStop
        )
        const projectedEtp = sumBy(
          projectedEtpAffected as Array<etpAffectedInterface>,
          'totalEtp'
        )

        // Compute projected out flow with projected etp at stop date (specific date)
        const projectedTotalOut = Math.floor(
          (projectedEtp * 8 * 17.33) / realTimePerCase
        )

        let monthlyReport: Array<any> = []
        // Projection of etpAffected between start and stop date to compute stock
        //@ts-ignore
        ;({ fururEtpAffectedToCompute, monthlyReport } = this.getHRPositions(
          referentielId as number,
          dateStart,
          true,
          dateStop,
          true
        ))

        futurEtpToCompute = sumBy(
          fururEtpAffectedToCompute as Array<etpAffectedInterface>,
          'totalEtp'
        )

        // Compute projectedStock with etp at datestop
        const projectedLastStock =
          Math.floor(lastStock) -
          Math.floor(
            (nbDayCalendarProjected / (365 / 12)) *
              17.33 *
              ((futurEtpToCompute * 8) / realTimePerCase)
          ) +
          Math.floor((nbDayCalendarProjected / (365 / 12)) * totalIn)

        const projectedRealCoverage = fixDecimal(projectedTotalOut / totalIn)
        const projectedRealDTESInMonths =
          projectedLastStock !== null && projectedTotalOut !== null
            ? fixDecimal(projectedLastStock / projectedTotalOut)
            : null

        const list = {
          totalIn,
          totalOut: projectedTotalOut,
          lastStock: projectedLastStock,
          realCoverage: projectedRealCoverage,
          realDTESInMonths: projectedRealDTESInMonths,
          realTimePerCase,
          etpMag: projectedEtp,
          etpAffected: projectedEtpAffected as Array<etpAffectedInterface>,
          etpFon: null,
          etpCont: null,
          calculateCoverage: null,
          calculateDTESInMonths: null,
          calculateTimePerCase: null,
          nbMonth,
          etpToCompute: futurEtpToCompute,
          monthlyReport: monthlyReport,
        }
        this.situationProjected.next(list)
      }

      return {
        totalIn,
        totalOut,
        lastStock,
        realCoverage,
        realDTESInMonths,
        realTimePerCase,
        etpMag,
        etpAffected,
        etpToCompute: etpToCompute,
      }
    } else
      return {
        totalIn: null,
        totalOut: null,
        lastStock: null,
        realCoverage: null,
        realDTESInMonths: null,
        realTimePerCase: null,
        etpMag: null,
        etpAffected: null,
        etpToCompute: null,
      }
  }

  getHRPositions(
    referentiel: number,
    date?: Date,
    onPeriod?: boolean,
    dateStop?: Date,
    monthlyReport = false
  ) {
    const hr = this.humanResourceService.hr.getValue()
    const categories = this.humanResourceService.categories.getValue()
    const hrCategories: any = {}
    let hrCategoriesMonthly: any = {}
    let emptyList: { [key: string]: any } = new Object({})
    emptyList = { ...getRangeOfMonthsAsObject(date!, dateStop!, true) }

    Object.keys(emptyList).map((x: any) => {
      emptyList[x] = {
        etpt: 0,
      }
    })

    categories.map((c) => {
      hrCategories[c.label] = hrCategories[c.label] || {
        totalEtp: 0,
        list: [],
        rank: c.rank,
      }

      hrCategoriesMonthly[c.label] = { ...emptyList }
    })

    categories.map((c) => {
      hrCategoriesMonthly[c.label] = hrCategoriesMonthly[c.label] || emptyList
    })

    for (let i = 0; i < hr.length; i++) {
      let etptAll,
        monthlyList: any = null
      if (onPeriod === true) {
        ;({ etptAll, monthlyList } = {
          ...this.getHRVentilationOnPeriod(
            hr[i],
            referentiel,
            categories,
            date instanceof Date ? date : undefined,
            dateStop instanceof Date ? dateStop : undefined
          ),
        })
      } else
        etptAll = this.getHRVentilation(hr[i], referentiel, categories, date)

      Object.values(etptAll).map((c: any) => {
        if (c.etpt) {
          hrCategories[c.label].list.push(hr[i])
          hrCategories[c.label].totalEtp += c.etpt
        }

        if (onPeriod === true && dateStop) {
          Object.keys(monthlyList).map((x: any) => {
            hrCategoriesMonthly[c.label][x].etpt += monthlyList[x][c.id].etpt
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
        totalEtp: fixDecimal(value.totalEtp || 0),
        // @ts-ignore
        rank: value.rank,
      })

      let tmpObj: any = []

      Object.keys(hrCategoriesMonthly[key]).map((x) => {
        hrCategoriesMonthly[key][x].etpt = fixDecimal(
          hrCategoriesMonthly[key][x].etpt || 0
        )

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

    if (monthlyReport)
      return {
        fururEtpAffectedToCompute: sortBy(list, 'rank'),
        monthlyReport: listMonthly,
      }
    else return sortBy(list, 'rank')
  }

  getHRVentilation(
    hr: HumanResourceInterface,
    referentielId: number,
    categories: HRCategoryInterface[],
    date?: Date
  ): number {
    const list: any = {}
    categories.map((c) => {
      list[c.id] = {
        etpt: 0,
        ...c,
      }
    })

    const now = date ? date : new Date()
    const { etp, situation } = this.humanResourceService.getEtpByDateAndPerson(
      referentielId,
      now,
      hr
    )

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

  getHRVentilationOnPeriod(
    hr: HumanResourceInterface,
    referentielId: number,
    categories: HRCategoryInterface[],
    dateStart: Date | undefined,
    dateStop: Date | undefined
  ) {
    const list: any = {}

    let monthlyList: { [key: string]: any } = {
      ...getRangeOfMonthsAsObject(dateStart!, dateStop!, true),
    }

    categories.map((c) => {
      list[c.id] = {
        etpt: 0,
        ...c,
      }
      Object.keys(monthlyList).map((x: any) => {
        monthlyList[x][c.id] = {
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
        const { etp, situation } =
          this.humanResourceService.getEtpByDateAndPerson(
            referentielId,
            now,
            hr
          )

        if (etp !== null) {
          // @ts-ignore
          list[situation.category.id].etpt += etp

          const str: string =
            this.getShortMonthString(now) +
            now.getFullYear().toString().slice(-2)

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
      Object.keys(monthlyList).map((x: any) => {
        if (monthlyList[x][property].nbOfDays !== 0)
          monthlyList[x][property].etpt =
            monthlyList[x][property].etpt / monthlyList[x][property].nbOfDays
      })
    }

    return { etptAll: list, monthlyList: { ...monthlyList } }
  }

  toSimulate(params: any, simulation: SimulationInterface) {
    params.toDisplay.map((x: any) => {
      if (params.beginSituation !== null)
        //@ts-ignore
        simulation[x] = params.beginSituation[x]
    })

    if (
      params.lockedParams.param1.label !== '' &&
      simulation.hasOwnProperty(params.lockedParams.param1.label)
    )
      //@ts-ignore
      simulation[params.lockedParams.param1.label] =
        params.lockedParams.param1.label === 'realCoverage'
          ? parseFloat(params.lockedParams.param1.value) / 100
          : parseFloat(params.lockedParams.param1.value)
    if (
      params.lockedParams.param2.label !== '' &&
      simulation.hasOwnProperty(params.lockedParams.param2.label)
    )
      //@ts-ignore
      simulation[params.lockedParams.param2.label] =
        params.lockedParams.param2.label === 'realCoverage'
          ? parseFloat(params.lockedParams.param2.value) / 100
          : parseFloat(params.lockedParams.param2.value)

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
      params.toCalculate.map((x: any) => {
        if (x === 'totalIn') {
          if (
            simulation.totalOut &&
            (simulation.lastStock || simulation.lastStock === 0)
          ) {
            simulation.totalIn = Math.floor(
              (Math.floor(simulation.lastStock) -
                Math.floor(params.beginSituation?.lastStock as number)) /
                (nbOfDays(this.dateStart.value, this.dateStop.value) /
                  (365 / 12)) +
                Math.floor(simulation.totalOut)
            )
          } else if (simulation.totalOut && simulation.realCoverage) {
            simulation.totalIn = Math.floor(
              Math.floor(simulation.totalOut) / simulation.realCoverage
            )
          }
        }
        if (x === 'totalOut') {
          if (simulation.etpMag && simulation.realTimePerCase) {
            simulation.totalOut = Math.floor(
              Math.floor(simulation.etpMag * 8 * 17.3333) /
                simulation.realTimePerCase
            )
          } else if (
            simulation.totalIn &&
            (simulation.lastStock || simulation.lastStock === 0)
          ) {
            simulation.totalOut = Math.floor(
              Math.floor(
                Math.floor(params.beginSituation?.lastStock as number) -
                  Math.floor(simulation.lastStock)
              ) /
                (nbOfDays(this.dateStart.value, this.dateStop.value) /
                  (365 / 12)) +
                simulation.totalIn
            )
          } else if (
            simulation.lastStock &&
            (simulation.realDTESInMonths || simulation.realDTESInMonths === 0)
          ) {
            simulation.totalOut = Math.floor(
              simulation.lastStock / simulation.realDTESInMonths
            )
          } else if (simulation.realCoverage && simulation.totalIn) {
            simulation.totalOut = Math.floor(
              simulation.realCoverage * simulation.totalIn
            )
          } else if (
            (simulation.realDTESInMonths ||
              simulation.realDTESInMonths === 0) &&
            simulation.totalIn
          ) {
            simulation.totalOut = Math.floor(
              (Math.floor(params.beginSituation?.lastStock as number) +
                simulation.totalIn *
                  (nbOfDays(this.dateStart.value, this.dateStop.value) /
                    (365 / 12))) /
                (simulation.realDTESInMonths +
                  nbOfDays(this.dateStart.value, this.dateStop.value) /
                    (365 / 12))
            )
          }
        }
        if (x === 'lastStock') {
          if (simulation.realDTESInMonths === 0) {
            simulation.lastStock = 0
          } else if (simulation.totalIn && simulation.totalOut) {
            simulation.lastStock = Math.floor(
              Math.floor(
                Math.floor(params.beginSituation?.lastStock as number) +
                  Math.floor(simulation.totalIn) *
                    (nbOfDays(this.dateStart.value, this.dateStop.value) /
                      (365 / 12)) -
                  Math.floor(simulation.totalOut) *
                    (nbOfDays(this.dateStart.value, this.dateStop.value) /
                      (365 / 12))
              )
            )
          } else if (
            (simulation.realDTESInMonths ||
              simulation.realDTESInMonths === 0) &&
            simulation.totalOut
          ) {
            simulation.lastStock = Math.floor(
              simulation.realDTESInMonths * Math.floor(simulation.totalOut)
            )
          }
          if (simulation.lastStock && simulation.lastStock < 0) {
            simulation.lastStock = 0
          }
        }
        if (x === 'realCoverage') {
          if (simulation.totalOut && simulation.totalIn) {
            simulation.realCoverage =
              (simulation.totalOut ||
                (params.endSituation?.totalOut as number)) /
              (simulation.totalIn || (params.endSituation?.totalIn as number))
          }
        }
        if (x === 'realDTESInMonths') {
          simulation.realDTESInMonths =
            Math.round(
              (Math.floor(simulation.lastStock || 0) /
                Math.floor(
                  simulation.totalOut ||
                    (params.endSituation?.totalOut as number)
                )) *
                100
            ) / 100
        }

        if (x === 'realTimePerCase') {
          simulation.realTimePerCase =
            Math.round(
              ((17.333 *
                8 *
                (simulation.etpMag ||
                  (params.beginSituation?.etpMag as number))) /
                Math.floor(
                  simulation.totalOut ||
                    (params.endSituation?.totalOut as number)
                )) *
                100
            ) / 100
        }

        if (x === 'etpMag') {
          simulation.etpMag =
            Math.round(
              (((simulation.realTimePerCase ||
                (params.endSituation?.realTimePerCase as number)) *
                Math.floor(
                  simulation.totalOut ||
                    (params.endSituation?.totalOut as number)
                )) /
                (17.333 * 8)) *
                100
            ) / 100
        }
      })
    } while (
      !(
        simulation.totalIn !== null &&
        simulation.totalOut !== null &&
        simulation.lastStock !== null &&
        simulation.etpMag !== null &&
        simulation.realTimePerCase !== null &&
        simulation.realDTESInMonths !== null &&
        simulation.realCoverage !== null
      )
    )
    this.situationSimulated.next(simulation)
    return simulation
  }

  getLabelTranslation(value: string): string {
    switch (value) {
      case 'etpMag':
        return 'ETPT magistrat'
      case 'totalIn':
        return 'entrées mensuelles'
      case 'totalOut':
        return 'sorties mensuelles'
      case 'lastStock':
        return 'stock'
      case 'realDTESInMonths':
        return 'DTES'
      case 'realCoverage':
        return 'taux de couverture'
      case 'realTimePerCase':
        return 'temps moyen par dossier'
    }
    return ''
  }

  getFieldValue(
    param: string,
    data: SimulatorInterface | SimulationInterface | null,
    initialValue = false,
    toCompute = false
  ): any {
    switch (param) {
      case 'etpMag':
        return data?.etpMag || '0'
      case 'totalOut': {
        if (data?.totalOut && data?.totalOut >= 0) {
          return data?.totalOut
        } else return '0'
      }
      case 'totalIn': {
        if (data?.totalIn && data?.totalIn >= 0) {
          return data?.totalIn
        } else return '0'
      }
      case 'lastStock': {
        if (data?.lastStock && data?.lastStock >= 0) {
          return data?.lastStock
        } else return '0'
      }
      case 'etpFon':
        return ''
      case 'realCoverage': {
        if (data?.realCoverage && toCompute === true) {
          return Math.round(data?.realCoverage) || '0'
        } else if (data?.realCoverage && initialValue === true)
          return Math.round(data?.realCoverage) + '%' || '0'
        else if (data?.realCoverage)
          return Math.round(data?.realCoverage * 100) + '%' || '0'
        else return '0'
      }
      case 'realDTESInMonths':
        if (data?.realDTESInMonths && data?.realDTESInMonths !== Infinity) {
          if (data?.realDTESInMonths <= 0) {
            return '0'
          } else return data?.realDTESInMonths + ' mois' || '0'
        }
        return '0'
      case 'realTimePerCase':
        if (initialValue) return data?.realTimePerCase || '0'
        else return decimalToStringDate(data?.realTimePerCase) || '0'
      case 'ETPTGreffe':
        return ''
    }
    return ''
  }

  range(start: number, end: number, length: number, offset?: number) {
    const step = (end - start) / (length - 1)
    return Array(length)
      .fill(0)
      .map((_, index) => {
        if (index === 0) return start
        else if (index === length) return end
        else return start + step * index
      })
  }

  generateLinearData(value1: number, value2: number, step: number) {
    if (value1 < 0) value1 = 0
    if (value2 < 0) value2 = 0

    let v = null
    if (step === 1 || step === 2) {
      v = [value1, value2]
    } else if (step === 3) {
      v = [value1, (value1 + value2) / 2, value2]
    } else if (value1 === value2) {
      return Array(step).fill(value1)
    } else {
      v = this.range(value1, value2, step)
    }

    return v
  }

  generateData(value1: number, size: number) {
    if (value1 < 0) value1 = 0

    return Array(size).fill(value1)
  }
}
