import { CommonModule } from '@angular/common'
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core'
import { markDetailComplete, toggleDetail, type DetailState } from '../../../utils/latency-detail'
import { GraphsVerticalsLinesComponent } from './graphs-verticals-lines/graphs-verticals-lines.component'
import { GraphsNumbersComponent } from './graphs-numbers/graphs-numbers.component'
import { GraphsProgressComponent } from './graphs-progress/graphs-progress.component'
import { MainClass } from '../../../libs/main-class'
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel'
import { CalculatorInterface } from '../../../interfaces/calculator'
import { OPACITY_20 } from '../../../constants/colors'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { ReferentielService } from '../../../services/referentiel/referentiel.service'
import { KPIService } from '../../../services/kpi/kpi.service'
import { UserService } from '../../../services/user/user.service'
import { CalculatorService } from '../../../services/calculator/calculator.service'
import { ActivitiesService } from '../../../services/activities/activities.service'
import { userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat } from '../../../utils/user'
import { isDateBiggerThan, month } from '../../../utils/dates'
import { CALCULATOR_OPEN_DETAILS_IN_CHARTS_VIEW } from '../../../constants/log-codes'

/**
 * Composant de la page en vue analytique
 */

@Component({
  selector: 'aj-view-analytics',
  standalone: true,
  imports: [CommonModule, GraphsVerticalsLinesComponent, GraphsNumbersComponent, GraphsProgressComponent],
  templateUrl: './view-analytics.component.html',
  styleUrls: ['./view-analytics.component.scss'],
})
export class ViewAnalyticsComponent extends MainClass implements OnInit, OnDestroy {
  private humanResourceService = inject(HumanResourceService)
  private referentielService = inject(ReferentielService)
  private kpiService = inject(KPIService)
  public userService = inject(UserService)
  private activitiesService = inject(ActivitiesService)
  public calculatorService = inject(CalculatorService)
  /**
   * Référentiel
   */
  referentiel: ContentieuReferentielInterface[] = []
  /**
   * Filtre des lignes du calculateur visible
   */
  @Input() datasFilted: CalculatorInterface[] = []
  /**
   * Type of category selected
   */
  @Input() categorySelected: string = ''
  /**
   * maxDateSelectionDate
   */
  @Input() maxDateSelectionDate: Date | null = null
  /**
   * Define max DTES
   */
  dtesMax: number = 0
  /**
   * Définie le max des stocks
   */
  stockMax: number = 0
  /**
   * Define max Entrées
   */
  entreesMax: number = 0
  /**
   * Définie le max Sorties
   */
  sortiesMax: number = 0
  /**
   * Définie le max ETPT Siege
   */
  siegeMax: number = 0
  /**
   * Définie le max ETPT Greffe
   */
  greffeMax: number = 0
  /**
   * Définie le max ETPT EAM
   */
  eamMax: number = 0
  /**
   * Show detail of coverture
   */
  showDetailCover: boolean = false
  /**
   * Show detail of stock
   */
  showDetailStock: boolean = false
  /**
   * Show detail of entrees
   */
  showDetailEntrees: boolean = false
  /**
   * Show detail of sorties
   */
  showDetailSorties: boolean = false
  /**
   * Show detail of ETPT Siège
   */
  showDetailETPTSiege: boolean = false
  /**
   * Show detail of ETPT Greffe
   */
  showDetailETPTGreffe: boolean = false
  /**
   * Show detail of ETPT EAM
   */
  showDetailETPTEam: boolean = false
  /**
   * Peux voir l'interface magistrat
   */
  canViewMagistrat: boolean = false
  /**
   * Peux voir l'interface greffier
   */
  canViewGreffier: boolean = false
  /**
   * Peux voir l'interface contractuel
   */
  canViewContractuel: boolean = false
  /**
   * Opacité background des contentieux
   */
  OPACITY = OPACITY_20
  /**
   * End date
   */
  dateStop: Date | null = null

  /**
   * Mesure de latence pour l'affichage des graphes de détail
   */
  private detailLoadState: DetailState = {}

  /**
   * Constructor
   */
  constructor() {
    super()
  }

  ngOnInit() {
    this.watch(
      this.humanResourceService.contentieuxReferentielOnlyFiltered.subscribe((c) => {
        this.referentiel = c.filter((r) => this.referentielService.idsSoutien.indexOf(r.id) === -1)
      }),
    )

    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
        this.canViewContractuel = userCanViewContractuel(u)
      }),
    )

    this.watch(
      this.calculatorService.dateStop.subscribe((d) => {
        this.dateStop = d
        this.activitiesService.getLastMonthActivities().then((date) => {
          date = new Date(date ? date : '')
          const max = month(date, 0, 'lastday')
          this.maxDateSelectionDate = max
        })
      }),
    )
  }

  /**
   * Suppresion des observables lors de la suppression du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  ngOnChanges() {
    const list = [...this.datasFilted].filter(
      (r) => this.referentielService.idsIndispo.indexOf(r.contentieux.id) === -1 && this.referentielService.idsSoutien.indexOf(r.contentieux.id) === -1,
    )

    const allDTES = [...list.map((d) => d.realDTESInMonthsStart || 0), ...list.map((d) => d.realDTESInMonths || 0)]
    this.dtesMax = (Math.max(...allDTES) || 0) * 1.1
    const allStocks = [...list.map((d) => d.lastStock || 0), ...list.map((d) => d.lastStockBf || 0), ...list.map((d) => d.lastStockAf || 0)]
    this.stockMax = (Math.max(...allStocks) || 0) * 1.1
    const allEntrees = [...list.map((d) => d.totalIn || 0), ...list.map((d) => d.totalInBf || 0), ...list.map((d) => d.totalInAf || 0)]
    this.entreesMax = (Math.max(...allEntrees) || 0) * 1.1
    const allSorties = [...list.map((d) => d.totalOut || 0), ...list.map((d) => d.totalOutBf || 0), ...list.map((d) => d.totalOutAf || 0)]
    this.sortiesMax = (Math.max(...allSorties) || 0) * 1.1
    const allSeges = [...list.map((d) => d.etpMag || 0), ...list.map((d) => d.etpMagBf || 0), ...list.map((d) => d.etpMagAf || 0)]
    this.siegeMax = (Math.max(...allSeges) || 0) * 1.1
    const allGreffes = [...list.map((d) => d.etpFon || 0), ...list.map((d) => d.etpFonBf || 0), ...list.map((d) => d.etpFonAf || 0)]
    this.greffeMax = (Math.max(...allGreffes) || 0) * 1.1
    const allEAM = [...list.map((d) => d.etpCont || 0), ...list.map((d) => d.etpContBf || 0), ...list.map((d) => d.etpContAf || 0)]
    this.eamMax = (Math.max(...allEAM) || 0) * 1.1
  }

  onUpdateMax({ type, max }: { type: string; max: number }) {
    switch (type) {
      case 'stocks': {
        if (this.stockMax < max) {
          this.stockMax = max
        }
        return
      }
      case 'entrees': {
        if (this.entreesMax < max) {
          this.entreesMax = max
        }
        return
      }
      case 'sorties': {
        if (this.sortiesMax < max) {
          this.sortiesMax = max
        }
        return
      }
      case 'ETPTSiege': {
        if (this.siegeMax < max) {
          this.siegeMax = max
        }
        return
      }
      case 'ETPTGreffe': {
        if (this.greffeMax < max) {
          this.greffeMax = max
        }
        return
      }
      case 'ETPTEam': {
        if (this.eamMax < max) {
          this.eamMax = max
        }
        return
      }
    }
  }

  getHours(value: number) {
    return Math.floor(value)
  }

  getMinutes(value: number) {
    //return (Math.floor((value - Math.floor(value)) * 60) + '').padStart(2, '0');
    let h = Math.floor(value)
    return Math.round((value - h) * 60)
  }

  /**
   * Ouvre ou ferme les details de l'écran analyse
   */
  openAll() {
    let checker = this.checkAllDataShow()
    if (checker) {
      this.showDetailCover = false
      this.showDetailStock = false
      this.showDetailEntrees = false
      this.showDetailSorties = false
      this.showDetailETPTSiege = false
      this.showDetailETPTGreffe = false
      this.showDetailETPTEam = false
    } else {
      this.showDetailCover = true
      this.showDetailStock = true
      this.showDetailEntrees = true
      this.showDetailSorties = true
      this.showDetailETPTSiege = true
      this.showDetailETPTGreffe = true
      this.showDetailETPTEam = true
      this.logOpenDetails()
    }
  }

  checkAllDataShow() {
    let valueToCheck = [
      this.showDetailCover,
      this.showDetailStock,
      this.showDetailEntrees,
      this.showDetailSorties,
      this.showDetailETPTSiege,
      this.showDetailETPTGreffe,
      this.showDetailETPTEam,
    ]

    return valueToCheck.every((v: boolean) => v === true)
  }

  logOpenDetails(open: boolean = true) {
    if (open === true) this.kpiService.register(CALCULATOR_OPEN_DETAILS_IN_CHARTS_VIEW, '')
  }

  /**
   * Début d'un chronométrage Sentry pour une section de détails (ex: ETPT Siège)
   */
  logOpenDetailsFor(sectionKey: string, open: boolean) {
    this.logOpenDetails(open)
    const expected = this.referentiel?.length || 0
    toggleDetail(this.detailLoadState, sectionKey, open, expected, 'view-analytics')
  }

  /**
   * Appelé par les sous-graphes quand ils terminent leur chargement de lignes de détail
   */
  onDetailGraphLoadComplete(sectionKey: string) {
    markDetailComplete(this.detailLoadState, sectionKey)
  }

  round(num: number) {
    return Math.round(num)
  }

  /**
   * Check if the end date is after max selection date
   * @returns
   */
  dateEndIsPast() {
    if (this.dateStop && this.maxDateSelectionDate) {
      return isDateBiggerThan(this.dateStop, this.maxDateSelectionDate, true)
    }

    return false
  }
}
