import { CommonModule, DecimalPipe } from '@angular/common'
import { AfterViewInit, Component, ElementRef, EventEmitter, HostBinding, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core'
import { SpeedometerComponent } from '../../../components/speedometer/speedometer.component'
import { TooltipsComponent } from '../../../components/tooltips/tooltips.component'
import { MainClass } from '../../../libs/main-class'
import { CalculatorInterface } from '../../../interfaces/calculator'
import { OPACITY_20 } from '../../../constants/colors'
import { UserService } from '../../../services/user/user.service'
import { ReferentielService } from '../../../services/referentiel/referentiel.service'
import { CalculatorService } from '../../../services/calculator/calculator.service'
import { ActivitiesService } from '../../../services/activities/activities.service'
import { KPIService } from '../../../services/kpi/kpi.service'
import { userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat } from '../../../utils/user'
import { getTime, month, monthDiff, today } from '../../../utils/dates'
import { CALCULATOR_OPEN_CONTENTIEUX } from '../../../constants/log-codes'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import { RouterModule } from '@angular/router'
import { SIMULATOR_DONNEES } from '../../../constants/simulator'
import { findHelpCenter } from '../../../utils/help-center'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { RHActivityInterface } from '../../../interfaces/rh-activity'
import { sumBy } from 'lodash'
import { AppService } from '../../../services/app/app.service'
import { addMonths } from 'date-fns'
import { Chart, ChartItem } from 'chart.js/auto'

/**
 * Composant d'une ligne du calculateur
 */

@Component({
  standalone: true,
  imports: [CommonModule, SpeedometerComponent, ReferentielCalculatorComponent, TooltipsComponent, MatIconModule, MatTooltipModule, DecimalPipe, RouterModule],
  selector: 'aj-referentiel-calculator',
  templateUrl: './referentiel-calculator.component.html',
  styleUrls: ['./referentiel-calculator.component.scss'],
})
export class ReferentielCalculatorComponent extends MainClass implements AfterViewInit, OnChanges {
  /**
   * Service de référentiel
   */
  referentielService = inject(ReferentielService)
  /**
   * Service de l'application
   */
  appService = inject(AppService)
  /**
   * Service de user
   */
  userService = inject(UserService)
  /**
   * Service de calculateur
   */
  calculatorService = inject(CalculatorService)
  /**
   * Service de activités
   */
  activitiesService = inject(ActivitiesService)
  /**
   * Service de KPIs
   */
  kpiService = inject(KPIService)
  /**
   * Service de fiches humaines
   */
  humanResourceService = inject(HumanResourceService)
  /**
   * Liste des datas du calculateur
   */
  @Input() datas: CalculatorInterface[] = []
  /**
   * Un item de la liste du calculateur
   */
  @Input() calculator: CalculatorInterface | null = null
  /**
   * Parent Calculator
   */
  @Input() parentCalculator: CalculatorInterface | null = null
  /**
   * Champ qui est trié, purement visuel
   */
  @Input() sortBy: string = ''
  /**
   * Type de catégorie choisie
   */
  @Input() categorySelected: string = ''
  /**
   * Affiche ou non les enfants de force
   */
  @Input() forceToShowChildren: boolean = false
  /**
   * Derniere date de donnée d'activité disponible
   */
  @Input() maxDateSelectionDate: Date | null = null
  /**
   * Catégorie filtrée
   */
  @Input() categoryFiltered: { label: string; value: string; categoryId: number; accessId: number }[] = []
  /**
   * Catégorie sélectionnée
   */
  @Input() categoryIdSelected: number | null = null
  /**
   * Type de projection actuelle
   */
  @Input() currentProjectionType: 'stock' | 'dtes' | 'etpt' = 'stock'
  /**
   * Cockpit Warning Informations
   */
  @Input() cockpitWarningInformations: {
    ventilation: { dataNotUpdatedBefore6Month: boolean; nbAgentNotCompletedToday: number; haveIncompleteDatasDuringThisPeriod: boolean }
    activity: {
      dataNotUpdatedBefore12Month: boolean
      noDataToSubContentieuxDuring12Month: boolean
      lessOneOfDatasToSubContentieux: boolean
      missingDatasToSubContentieuxBefore12Month: boolean
    }
  } | null = null
  /**
   * Connexion au css pour forcer l'affichage des enfants
   */
  @HostBinding('class.show-children') showChildren: boolean = (this.calculator && this.calculator.childIsVisible) || false
  /**
   * Type de projection actuelle
   */
  @Output() currentProjectionTypeChange: EventEmitter<'stock' | 'dtes' | 'etpt'> = new EventEmitter<'stock' | 'dtes' | 'etpt'>()
  /**
   * Chart canvas
   */
  @ViewChild('chartjs') chartjs: ElementRef<HTMLElement> | null = null
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
   * Peux voir la projection
   */
  canViewPreviousProjection: boolean = false
  /**
   * Peux voir la prochaine projection
   */
  canViewNextProjection: boolean = false
  /**
   * La projection actuelle
   */
  currentProjection: CalculatorInterface | null = null
  /**
   * Type de projections disponibles
   */
  projectionTypes: { label: string; value: 'stock' | 'dtes' | 'etpt'; icon: string }[] = [
    { label: 'Stock', value: 'stock', icon: 'inventory_2' },
    { label: 'DTES', value: 'dtes', icon: 'description' },
    { label: 'ETPT', value: 'etpt', icon: 'person' },
  ]
  /**
   * Popin projection footer grid
   */
  projectionFooterGrid: { label: string; button: string; link: any; queryParams: any }[] = []
  /**
   * Affiche ou non le popin d'erreur
   */
  showAlertPopin: boolean = false
  /**
   * Affiche ou non le popin de projection
   */
  showProjectionPopin: boolean = false
  /**
   * Fonction pour trouver le centre d'aide url
   */
  findHelpCenter = findHelpCenter
  /**
   * Lien de la doc du ventilateur
   */
  VENTILATEUR_DOCUMENTATION_URL = this.userService.isCa()
    ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/ventilateur/quest-ce-que-cest'
    : 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/ventilateur/quest-ce-que-cest'
  /**
   * Lien de la doc des données d'activité
   */
  ACTIVITIES_DOCUMENTATION_URL = this.userService.isCa()
    ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/quest-ce-que-cest'
    : 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/donnees-dactivite/quest-ce-que-cest'

  /**
   * Chart de projection
   */
  projectionChart: any = null
  /**
   * Nombre de mois à comparer
   */
  nbMonthsToCompare: number = 0

  /**
   * Constructor
   */
  constructor() {
    super()

    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
        this.canViewContractuel = userCanViewContractuel(u)
      }),
    )
  }

  /**
   * Suppresion des observables lors de la suppression du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Initialisation des valeurs par défaut
   * @param changes Changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datas']) {
      this.initValues()
    }
  }

  /**
   * Initialisation de valeur par défaut
   */
  ngAfterViewInit() {
    if (this.maxDateSelectionDate === null) {
      this.activitiesService.getLastMonthActivities().then((date) => {
        if (date === null) {
          date = new Date()
        }
        date = new Date(date ? date : '')
        const max = month(date, 0, 'lastday')
        this.maxDateSelectionDate = max
      })
    }
  }

  /**
   * Initialisation des valeurs par défaut
   */
  initValues() {
    if (this.currentProjection || this.calculator) {
      this.canViewPreviousProjection = this.datas.findIndex((d) => d.contentieux.id === (this.currentProjection || this.calculator)?.contentieux.id) !== 0
      this.canViewNextProjection =
        this.datas.findIndex((d) => d.contentieux.id === (this.currentProjection || this.calculator)?.contentieux.id) !== this.datas.length - 1
    }
  }

  /**
   * Switch la visibilité des enfants
   */
  onToggleChildren() {
    if (this.calculator) {
      this.showChildren = !this.showChildren
      this.calculator.childIsVisible = this.showChildren
    }
    if (this.showChildren === true) this.kpiService.register(CALCULATOR_OPEN_CONTENTIEUX, this.calculator?.contentieux.label + '')
  }

  /**
   * Id contentieux soutien
   */
  isSoutien(id: number) {
    return this.referentielService.idsSoutien.indexOf(id) !== -1
  }

  /**
   * Troncage valeur numérique
   */
  trunc(value: number) {
    return Math.trunc(value * 100000) / 100000
  }

  /**
   * Arrondi
   * @param value
   * @returns
   */
  round(value: number) {
    return Math.round(value)
  }

  /**
   * Indique si la date de fin selectionnée est dans le passé
   */
  checkPastDate() {
    return this.calculatorService.dateStop.value! <= (this.maxDateSelectionDate || new Date())
  }

  /**
   * Affiche la prochaine projection
   */
  onNextProjection() {
    if (this.canViewNextProjection) {
      const currentProjectionIndex = this.datas.findIndex((d) => d.contentieux.id === this.currentProjection?.contentieux.id)
      if (currentProjectionIndex !== -1 && currentProjectionIndex < this.datas.length - 1) {
        this.currentProjection = this.datas[currentProjectionIndex + 1] || null
      } else {
        this.currentProjection = null
      }
      this.initValues()

      if (this.showProjectionPopin) {
        this.showChartJS()
      }
    }
  }

  /**
   * Affiche la projection précédente
   */
  onPreviousProjection() {
    if (this.canViewPreviousProjection) {
      const currentProjectionIndex = this.datas.findIndex((d) => d.contentieux.id === this.currentProjection?.contentieux.id)
      if (currentProjectionIndex !== -1 && currentProjectionIndex > 0) {
        this.currentProjection = this.datas[currentProjectionIndex - 1] || null
      } else {
        this.currentProjection = null
      }
      this.initValues()
    }
  }

  /**
   * Change le type de projection actuelle
   * @param type
   */
  onCurrentProjectionTypeChange(type: 'stock' | 'dtes' | 'etpt') {
    this.currentProjectionType = type
    this.initProjectionFooterGrid()
    this.currentProjectionTypeChange.emit(type)
  }

  /**
   * Initialisation du grid de projection footer
   */
  async initProjectionFooterGrid() {
    const list: { label: string; button: string; link: any; queryParams: any }[] = []
    const dateStart = getTime(this.calculatorService.dateStart.value)
    const dateStop = getTime(this.calculatorService.dateStop.value)
    let nbMonths = monthDiff(new Date(this.calculatorService.dateStart.value || new Date()), today(this.calculatorService.dateStop.value || new Date()))
    if (nbMonths < 0) {
      nbMonths *= -1
    }
    this.nbMonthsToCompare = nbMonths + 1

    if (this.currentProjectionType === 'stock' || this.currentProjectionType === 'dtes') {
      if (this.userService.canViewSimulator()) {
        list.push({
          label: 'Visualiser les conséquences d’un changement d’effectif',
          button: 'Estimer l’effectif',
          link: ['/simulateur'],
          queryParams: {
            r: this.currentProjection?.contentieux.id,
            t: 'etpt',
            ts: SIMULATOR_DONNEES,
            dstart: dateStart,
            dstop: dateStop,
          },
        })
      }
      if (this.userService.canViewSimulator()) {
        list.push({
          label: 'Voir les moyens nécessaires pour atteindre mon objectif',
          button: 'Voir les moyens',
          link: ['/simulateur'],
          queryParams: {
            r: this.currentProjection?.contentieux.id,
            t: 'stock',
            ts: SIMULATOR_DONNEES,
            dstart: dateStart,
            dstop: dateStop,
          },
        })
      }
    } else if (this.currentProjectionType === 'etpt') {
      if (this.userService.canViewSimulator()) {
        list.push({
          label: 'Visualiser les conséquences d’un changement d’effectif',
          button: 'Estimer l’effectif',
          link: ['/simulateur'],
          queryParams: {
            r: this.currentProjection?.contentieux.id,
            t: 'etpt',
            dstart: dateStart,
            dstop: dateStop,
          },
        })
      }

      if (this.userService.canViewReaffectator()) {
        list.push({
          label: 'Visualiser l’impact d’une réorganisation à effectif constant',
          button: 'Réorganiser mes effectifs',
          link: ['/reaffectateur'],
          queryParams: {
            dstart: getTime(this.calculatorService.dateStart.value),
          },
        })
      }
    }

    this.projectionFooterGrid = list

    this.showChartJS()
  }

  /**
   * Affiche le graphique
   */
  async showChartJS() {
    if (!this.chartjs || !this.chartjs.nativeElement) {
      setTimeout(() => {
        this.showChartJS()
      }, 200)
      return
    }

    const mainColor = this.userService.referentielMappingColorActivityByInterface(
      this.userService.referentielMappingNameByInterface(
        (this.parentCalculator || this.currentProjection)?.contentieux.label === 'Autres activités'
          ? 'other'
          : (this.parentCalculator || this.currentProjection)?.contentieux.label || '',
      ),
    )
    const secondaryColor = this.userService.referentielMappingColorActivityByInterface(
      this.userService.referentielMappingNameByInterface(
        (this.parentCalculator || this.currentProjection)?.contentieux.label === 'Autres activités'
          ? 'other'
          : (this.parentCalculator || this.currentProjection)?.contentieux.label || '',
      ),
      OPACITY_20,
    )

    let nbMonths = monthDiff(new Date(this.calculatorService.dateStart.value || new Date()), today(this.calculatorService.dateStop.value || new Date()))
    if (nbMonths < 0) {
      nbMonths *= -1
    }

    const datasPast = await this.calculatorService.rangeValues(
      this.currentProjection?.contentieux.id || 0,
      this.currentProjectionType,
      this.calculatorService.dateStart.value,
      this.calculatorService.dateStop.value,
      this.calculatorService.selectedFonctionsIds.getValue(),
      this.categorySelected,
    )
    const datasFuturs = await this.calculatorService.rangeValues(
      this.currentProjection?.contentieux.id || 0,
      this.currentProjectionType,
      addMonths(this.calculatorService.dateStop.value || new Date(), +1),
      addMonths(this.calculatorService.dateStop.value || new Date(), nbMonths + 1),
      this.calculatorService.selectedFonctionsIds.getValue(),
      this.categorySelected,
    )

    let max = [...datasPast, ...datasFuturs].reduce((max, d) => Math.max(max, d?.value || 0), 0)
    max *= 2

    const defaultDataset = {
      cubicInterpolationMode: 'default',
      tension: 0.4,
      fill: false,
      pointStyle: 'circle',
      pointRadius: 3,
      pointHoverRadius: 3,
      borderWidth: 2,
      hoverBorderWidth: 2,
      borderColor: mainColor,
      backgroundColor: mainColor,
    }

    const labels = []
    let refDate = new Date(this.calculatorService.dateStart.value || new Date())
    const endDate = addMonths(refDate, nbMonths * 2 + 1)
    const lastDatesChartJS = []
    const nextDatesChartJS = []
    let index = 0
    do {
      labels.push(refDate.getFullYear() + ' ' + this.getShortMonthString(refDate))

      const datasFinded = [...datasPast, ...datasFuturs].find((d) => d && month(d.date).getTime() === month(refDate).getTime())

      if (index < nbMonths) {
        lastDatesChartJS.push(datasFinded ? datasFinded.value : null)
        nextDatesChartJS.push(NaN)
      } else if (index === nbMonths) {
        lastDatesChartJS.push(datasFinded ? datasFinded.value : null)
        nextDatesChartJS.push(datasFinded ? datasFinded.value : null)
      } else {
        lastDatesChartJS.push(NaN)
        nextDatesChartJS.push(datasFinded ? datasFinded.value : null)
      }

      refDate = addMonths(refDate, +1)
      index++
    } while (month(refDate).getTime() <= month(endDate).getTime())

    // init chart.js
    if (!this.projectionChart) {
      const gradientPlugin = {
        id: 'chartAreaGradient',
        beforeDraw(chart: Chart) {
          const { ctx, chartArea: area } = chart
          if (!area) return
          const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom)
          gradient.addColorStop(0, secondaryColor)
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.save()
          ctx.fillStyle = gradient
          ctx.fillRect(area.left, area.top, area.right - area.left, area.bottom - area.top)
          ctx.restore()
        },
      }
      const config: any = {
        type: 'line',
        data: {
          label: [],
          datasets: [],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { left: 8, right: 8, top: 8, bottom: 8 },
          },
          plugins: {
            legend: {
              display: false,
            },
            title: false,
          },
        },
        plugins: [gradientPlugin],
      }
      this.projectionChart = new Chart(this.chartjs.nativeElement as ChartItem, config)
    }

    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { left: 8, right: 8, top: 8, bottom: 8 },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: false,
      },
      scales: {
        y: {
          max,
          min: 0,
          grid: {
            display: false,
          },
        },
        x: {
          display: false,
        },
      },
    }
    this.projectionChart.config.options = options

    const datasets: {
      data: number[]
      backgroundColor: string
      cubicInterpolationMode: string
      tension: number
      fill: any
      pointStyle: string
      pointRadius: number
      pointHoverRadius: number
    }[] = [
      {
        // datas before
        ...defaultDataset,
        data: lastDatesChartJS.map((v) => (v === null ? NaN : v)),
        fill: {
          target: 'origin',
          above: secondaryColor, // Area will be red above the origin
          below: mainColor, // Area will be red above the origin
        },
      },
      {
        // datas after
        ...defaultDataset,
        data: nextDatesChartJS.map((v) => (v === null ? NaN : v)),
      },
    ]

    this.projectionChart.config.data = {
      labels,
      datasets,
    }
    this.projectionChart.update()
    console.log('projectionChart', this.projectionChart)
  }
}
