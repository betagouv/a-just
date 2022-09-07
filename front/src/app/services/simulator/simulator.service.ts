import { Injectable } from '@angular/core'
import { sortBy, sumBy } from 'lodash'
import { BehaviorSubject } from 'rxjs'
import { SimulatorInterface } from 'src/app/interfaces/simulator'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { MainClass } from 'src/app/libs/main-class'
import {
  month,
  nbOfDays,
  workingDay,
  decimalToStringDate,
  getRangeOfMonthsAsObject,
  isFirstDayOfMonth,
  generalizeTimeZone,
} from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'
import { ActivitiesService } from '../activities/activities.service'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { environment } from 'src/environments/environment'
import { SimulationInterface } from 'src/app/interfaces/simulation'
import * as _ from 'lodash'
import { etpAffectedInterface } from 'src/app/interfaces/calculator'
import { ChartAnnotationBoxInterface } from 'src/app/interfaces/chart-annotation-box'
import { ServerService } from '../http-server/server.service'

const start = new Date()
const end = new Date()

@Injectable({
  providedIn: 'root',
})
export class SimulatorService extends MainClass {
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
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
    private serverService: ServerService,
    private humanResourceService: HumanResourceService
  ) {
    super()

    this.watch(this.chartAnnotationBox.subscribe(() => {}))

    this.watch(
      this.contentieuOrSubContentieuId.subscribe(() => {
        if (this.contentieuOrSubContentieuId.getValue() !== null) {
          this.getSituation(this.contentieuOrSubContentieuId.getValue())
        }
      })
    )

    this.watch(
      this.dateStart.subscribe(() => {
        if (this.contentieuOrSubContentieuId.getValue() !== null) {
          this.getSituation(
            this.contentieuOrSubContentieuId.getValue(),
            this.dateStart.getValue()
          )
        }
      })
    )

    this.watch(
      this.dateStop.subscribe(() => {
        if (this.contentieuOrSubContentieuId.getValue() !== null) {
          this.getSituation(
            this.contentieuOrSubContentieuId.getValue(),
            this.dateStart.getValue(),
            this.dateStop.getValue()
          )
        }
      })
    )
  }

  /**
   * Get situation data
   * @param {number | null} referentielId
   * @param {Date} dateStart optional start date of the situation
   * @param {Date} dateStop optional end date of the situation
   *
   * @returns Situation data interface
   */
  getSituation(
    referentielId: number | null,
    dateStart?: Date,
    dateStop?: Date
  ) {
    this.isLoading.next(true)
    return this.serverService
      .post(`simulator/get-situation`, {
        backupId: this.humanResourceService.backupId.getValue(),
        referentielId: referentielId,
        dateStart: generalizeTimeZone(dateStart),
        dateStop: generalizeTimeZone(dateStop),
      })
      .then((data) => {
        if (dateStop) {
          this.situationProjected.next(data.data.situation.endSituation)
        } else this.situationActuelle.next(data.data.situation)
        this.isLoading.next(false)
      })
  }

  toSimulate(params: any, simulation: SimulationInterface) {
    this.isLoading.next(true)
    this.serverService
      .post(`simulator/to-simulate`, {
        backupId: this.humanResourceService.backupId.getValue(),
        params: params,
        simulation: simulation,
        dateStart: generalizeTimeZone(this.dateStart.getValue()),
        dateStop: generalizeTimeZone(this.dateStop.getValue()),
      })
      .then((data) => {
        this.situationSimulated.next(data.data)
        this.isLoading.next(false)
      })
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
        return data?.etpFon || '0'
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
        return data?.etpCont || '0'
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

  getHRPositions(
    hr: HumanResourceInterface[],
    referentiel: number,
    categories: any,
    date?: Date,
    onPeriod?: boolean,
    dateStop?: Date,
    monthlyReport = false
  ) {
    const hrCategories: any = {}
    let hrCategoriesMonthly: { [key: string]: any } = new Object({})
    let emptyList: { [key: string]: any } = new Object({})
    emptyList = { ...getRangeOfMonthsAsObject(date!, dateStop!, true) }

    Object.keys(emptyList).map((x: any) => {
      emptyList[x] = {
        ...{
          etpt: 0,
        },
      }
    })

    categories.map((c: any) => {
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
          Object.keys(monthlyList).map((month: any) => {
            if (c.label === monthlyList[month][c.id].name)
              hrCategoriesMonthly[c.label][month].etpt +=
                monthlyList[month][c.id].etpt
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

    if (monthlyReport) {
      return {
        fururEtpAffectedToCompute: sortBy(list, 'rank'),
        monthlyReport: listMonthly,
      }
    } else return sortBy(list, 'rank')
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
        const { etp, situation } =
          this.humanResourceService.getEtpByDateAndPerson(
            referentielId,
            now,
            hr
          )

        if (etp !== null && situation && situation.category) {
          list[situation.category.id].etpt += etp

          const str =
            this.getShortMonthString(now) +
            now.getFullYear().toString().slice(-2)

          monthlyList[str][situation.category.id].etpt += etp
          monthlyList[str][situation.category.id].nbOfDays = monthDaysCounter
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
}
