import { inject, Injectable } from '@angular/core'
import * as Sentry from '@sentry/browser'
import { startLatencyScope } from '../../utils/sentry-latency'
import { BehaviorSubject } from 'rxjs'
import { HumanResourceService } from '../human-resource/human-resource.service'
import * as _ from 'lodash'
import { ServerService } from '../http-server/server.service'
import { UserService } from '../user/user.service'
import { MainClass } from '../../libs/main-class'
import { SimulatorInterface } from '../../interfaces/simulator'
import { SimulationInterface } from '../../interfaces/simulation'
import { HRCategoryInterface } from '../../interfaces/hr-category'
import { ChartAnnotationBoxInterface } from '../../interfaces/chart-annotation-box'
import { decimalToStringDate, setTimeToMidDay } from '../../utils/dates'
import { fixDecimal } from '../../utils/numbers'
import { buildSimulatorLatencyEventLabel } from '../../utils/simulator-latency'

/**
 * Service de la page du simulateur
 */
@Injectable({
  providedIn: 'root',
})
export class SimulatorService extends MainClass {
  serverService = inject(ServerService)
  humanResourceService = inject(HumanResourceService)
  userService = inject(UserService)
  /**
   * Loader display boolean
   */
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  /**
   * Object contenant les données propres à la situation actuelle (aujourd'hui ou date de début selectionnée)
   */
  situationActuelle: BehaviorSubject<SimulatorInterface | null> = new BehaviorSubject<SimulatorInterface | null>(null)
  /**
   * Object contenant les données propres à la situation projetée à une date de fin choisie
   */
  situationProjected: BehaviorSubject<SimulatorInterface | null> = new BehaviorSubject<SimulatorInterface | null>(null)
  /**
   * Object contenant les données propres à la situation simulée à une date de fin choisie
   */
  situationSimulated: BehaviorSubject<SimulationInterface | null> = new BehaviorSubject<SimulationInterface | null>(null)
  /**
   * Liste de contentieux/sous contentieux selectionné(s) par l'utilisateur
   */
  contentieuOrSubContentieuId: BehaviorSubject<any | null> = new BehaviorSubject<any | null>(null)
  /**
   * Date de début de simulation selectionnée par l'utilisateur (définie par défaut à aujourd'hui)
   */
  dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date())
  /**
   * Date de fin de situation selectionnée par l'utilisateur
   */
  dateStop: BehaviorSubject<Date | undefined> = new BehaviorSubject<Date | undefined>(undefined)
  /**
   * Categorie selectionnée par l'utilisateur (Magistrat/Fonctionnaire)
   */
  selectedCategory: BehaviorSubject<HRCategoryInterface | null> = new BehaviorSubject<HRCategoryInterface | null>(null)
  /**
   * Fonction(s) selectionnées par l'utilisateur
   */
  selectedFonctionsIds: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([])
  /**
   * Popin pour graphiques de simulation
   */
  chartAnnotationBox: BehaviorSubject<ChartAnnotationBoxInterface> = new BehaviorSubject<ChartAnnotationBoxInterface>({
    display: false,
    xMin: null,
    xMax: null,
    content: undefined,
  })
  /**
   * Indicateur de selection de paramètre de simulation
   */
  disabled: BehaviorSubject<string> = new BehaviorSubject<string>('disabled')

  /**
   * Validation de la situation de début sur simulateur à blanc
   */
  isValidatedWhiteSimu: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  /**
   * Nombre de jour à projeter pour la situation projetee du simulateur a blanc
   */
  whiteSimulatorNbOfDays: BehaviorSubject<number> = new BehaviorSubject<number>(0)

  /**
   * Constructeur
   */
  constructor() {
    super()

    this.watch(this.chartAnnotationBox.subscribe(() => {}))

    this.watch(
      this.contentieuOrSubContentieuId.subscribe(() => {
        const value = this.contentieuOrSubContentieuId.getValue()
        if (value !== null && (value?.parent?.length || value?.child?.length)) {
          this.getSituation(value)
        }
      }),
    )

    this.watch(
      this.selectedFonctionsIds.subscribe(() => {
        const value = this.contentieuOrSubContentieuId.getValue()
        if (value !== null) {
          this.getSituation(value, this.dateStart.getValue(), this.dateStop.getValue())
        }
      }),
    )

    this.watch(
      this.dateStart.subscribe(() => {
        const value = this.contentieuOrSubContentieuId.getValue()
        if (value !== null) {
          this.getSituation(value, this.dateStart.getValue())
        }
      }),
    )

    this.watch(
      this.dateStop.subscribe(() => {
        const value = this.contentieuOrSubContentieuId.getValue()
        if (value !== null) {
          this.getSituation(value, this.dateStart.getValue(), this.dateStop.getValue())
        }
      }),
    )
  }

  /**
   * Get situation data (current, at start date or at end date/projected depending on parameters passed)
   * @param {number | null} referentielId contentieux ID
   * @param {Date} dateStart optional start date of the situation
   * @param {Date} dateStop optional end date of the situation
   * @returns Situation data interface
   */
  getSituation(referentielId: any | null, dateStart?: Date, dateStop?: Date) {
    if (this.selectedCategory.getValue()?.id !== null && this.selectedFonctionsIds.getValue() !== null) {
      const value = this.contentieuOrSubContentieuId.getValue()
      if (value ===null||value.lenght === 0 || (value?.parent === null && value?.child === null)) return
      this.isLoading.next(true)

      return this.serverService
        .post(`simulator/get-situation`, {
          backupId: this.humanResourceService.backupId.getValue(),
          referentielId: this.contentieuOrSubContentieuId.getValue(),
          dateStart: setTimeToMidDay(dateStart),
          dateStop: setTimeToMidDay(dateStop),
          functionIds: this.selectedFonctionsIds.getValue(),
          categoryId: this.selectedCategory.getValue()?.id,
        })
        .then((data) => {
          if (dateStop) {
            this.situationProjected.next(data.data.situation.endSituation)
            this.situationActuelle.next(data.data.situation)
          } else this.situationActuelle.next(data.data.situation)
        })
        .then(() => this.isLoading.next(false))
    } else return null
  }

  /**
   * Function used to compute the simulated situation
   * @param params containing the object parameters used to compute the simulation
   * @param simulation empty situation object to be filled
   */
  toSimulate(params: any, simulation: SimulationInterface, white = false) {
    console.log('SIMULATION', simulation)
    this.isLoading.next(true)
    const latencyEvent = buildSimulatorLatencyEventLabel(params, white)
    console.log(params)
    console.log(this.userService.user)

    const l = startLatencyScope('simulator')
    const startAt = performance.now()
    const run = async () => {
      if (white === true) {
        await this.serverService
          .post(`simulator/to-simulate-white`, {
            backupId: this.humanResourceService.backupId.getValue(),
            params: params,
            simulation: simulation,
            dateStart: setTimeToMidDay(this.dateStart.getValue()),
            dateStop: setTimeToMidDay(this.dateStop.getValue()),
            selectedCategoryId: this.selectedCategory.getValue()?.id,
          })
          .then((data) => {
            console.log('simu', data.data)
            this.situationSimulated.next(data.data)
          })
      } else {
        await this.serverService
          .post(`simulator/to-simulate`, {
            backupId: this.humanResourceService.backupId.getValue(),
            params: params,
            simulation: simulation,
            dateStart: setTimeToMidDay(this.dateStart.getValue()),
            dateStop: setTimeToMidDay(this.dateStop.getValue()),
            selectedCategoryId: this.selectedCategory.getValue()?.id,
            referentielId: this.contentieuOrSubContentieuId.getValue(),
            functionIds: this.selectedFonctionsIds.getValue(),
          })
          .then((data) => {
            console.log('simu', data.data)
            this.situationSimulated.next(data.data)
          })
      }
    }
    return run()
      .then(() => {
        this.isLoading.next(false)
        try { l.finish('success') } catch {}
      })
      .catch((e) => {
        this.isLoading.next(false)
        try { l.finish('error') } catch {}
        throw e
      })
  }

  

  /**
   * Get the label of a field and return the full text name of the label
   * @param value label name
   * @returns text value of the designated label
   */
  getLabelTranslation(value: string): string {
    switch (value) {
      case 'etpMag':
        return 'ETPT'
      case 'etpFon':
        return 'ETPT greffe'
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
      case 'magRealTimePerCase':
        return 'temps moyen par dossier'
    }
    return ''
  }

  /**
   * Get the value of the displayed field
   * @param param label name
   * @param data simulated situation data object
   * @param initialValue specified if initialValue need to be converted or not in case of % or month
   * @param toCompute specified if the value returned is used afterwards to compute something, then let the value in decimal without unit
   * @returns label value as string or float
   */
  getFieldValue(param: string, data: SimulatorInterface | SimulationInterface | null, initialValue = false, toCompute = false, decimal = false): any {
    switch (param) {
      case 'etpMag':
        if (data?.etpMag === null) {
          return '0'
        }
        return toCompute ? data?.etpMag : fixDecimal(data?.etpMag || 0) || '0'
      case 'etpFon':
        if (data?.etpFon === null) {
          return '0'
        }
        return toCompute ? data?.etpFon : fixDecimal(data?.etpFon || 0) || '0'
      case 'totalOut': {
        if (data?.totalOut === null) {
          return 'N/R'
        }
        if (data?.totalOut && data?.totalOut >= 0) {
          if(decimal) {
            return toCompute ? data?.totalOut : fixDecimal(data?.totalOut)
          }
          return toCompute ? data?.totalOut : Math.round(data?.totalOut)
        } else return '0'
      }
      case 'totalIn': {
        if (data?.totalIn === null) {
          return 'N/R'
        }
        if (data?.totalIn && data?.totalIn >= 0) {
          if(decimal) {
            return toCompute ? data?.totalOut : fixDecimal(data?.totalIn)
          }
          return toCompute ? data?.totalIn : Math.round(data?.totalIn)
        } else return '0'
      }
      case 'lastStock': {
        if (data?.lastStock === null) {
          return 'N/R'
        }
        if (data?.lastStock) {
          //&& data?.lastStock >= 0) {
          if(decimal) {
            return toCompute ? data?.totalOut : fixDecimal(data?.lastStock)
          }
          return toCompute ? data?.lastStock : Math.round(data?.lastStock)
        } else return '0'
      }
      case 'etpCont':
        if (data?.etpCont === null) {
          return '0'
        }
        return toCompute ? data?.etpCont : fixDecimal(data?.etpCont || 0) || '0'
      case 'realCoverage': {
        if (data?.realCoverage === null) {
          return 'N/R'
        }
        if (data?.realCoverage && toCompute === true) {
          return data?.realCoverage || '0'
        } else if (data?.realCoverage && initialValue === true) return Math.round(data?.realCoverage) + '%' || '0'
        else if (data?.realCoverage) return Math.round(data?.realCoverage * 100) + '%' || '0'
        else return '0'
      }
      case 'realDTESInMonths':
        if (data?.realDTESInMonths === null) {
          return 'N/R'
        } else if (data?.realDTESInMonths && data?.realDTESInMonths <= 0) {
          return '0'
        } else if (data?.totalOut === null) {
          return 'N/R'
        }
        if (data?.realDTESInMonths && data?.realDTESInMonths !== Infinity) {
          if (data?.realDTESInMonths <= 0) {
            return '0'
          } else if (toCompute) return data?.realDTESInMonths
          else return fixDecimal(data?.realDTESInMonths) + ' mois' || '0'
        }
        return '0'
      case 'magRealTimePerCase':
        if (data?.magRealTimePerCase === null) {
          return 'N/R'
        }
        if (initialValue) return fixDecimal(data?.magRealTimePerCase || 0) || '0'
        else {
          return toCompute ? data?.magRealTimePerCase : decimalToStringDate(data?.magRealTimePerCase, ':') || '0'
        }
    }
    return ''
  }

  /**
   * Function to compute equal steps between a start and stop value
   * @param start
   * @param end
   * @param length
   * @returns Array of values between start and end value using a defined step
   */
  range(start: number, end: number, length: number) {
    const step = (end - start) / (length - 1)
    return Array(length)
      .fill(0)
      .map((_, index) => {
        if (index === 0) return start
        else if (index === length) return end
        else return start + step * index
      })
  }

  /**
   * Function used to generate a dataset using linear function
   * @param value1 start value
   * @param value2 end value
   * @param step number of step between values
   * @returns return a LinearDataset
   */
  generateLinearData(value1: number, value2: number, step: number, negativValues = false) {
    if (value1 < 0 && negativValues === false) value1 = 0
    if (value2 < 0 && negativValues === false) value2 = 0

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

  /**
   * Function used to get an Array of identical values
   * @param value1
   * @param size lenght of the array
   * @returns Array of values
   */
  generateData(value1: number, size: number) {
    if (value1 < 0) value1 = 0
    return Array(size).fill(value1)
  }
}
