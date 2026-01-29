import { CommonModule, DecimalPipe } from '@angular/common'
import { AfterViewInit, Component, EventEmitter, HostBinding, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
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
import { addMonths } from 'date-fns'
import { SIMULATOR_DONNEES } from '../../../constants/simulator'

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
   * Connexion au css pour forcer l'affichage des enfants
   */
  @HostBinding('class.show-children') showChildren: boolean = (this.calculator && this.calculator.childIsVisible) || false
  /**
   * Type de projection actuelle
   */
  @Output() currentProjectionTypeChange: EventEmitter<'stock' | 'dtes' | 'etpt'> = new EventEmitter<'stock' | 'dtes' | 'etpt'>()
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
   * Constructor
   */
  constructor(
    public userService: UserService,
    private referentielService: ReferentielService,
    private calculatorService: CalculatorService,
    private activitiesService: ActivitiesService,
    private kpiService: KPIService,
  ) {
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
  initProjectionFooterGrid() {
    const list: { label: string; button: string; link: any; queryParams: any }[] = []
    const dateStart = getTime(this.calculatorService.dateStop.value)
    let nbMonths = monthDiff(new Date(dateStart), today(this.calculatorService.dateStart.value || new Date()))
    if (nbMonths < 0) {
      nbMonths *= -1
    }
    const dateStop = addMonths(new Date(dateStart), nbMonths).getTime()

    if (this.currentProjectionType === 'stock' || this.currentProjectionType === 'dtes') {
      // TODO
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
        // TODO
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
      // TODO
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
  }
}
