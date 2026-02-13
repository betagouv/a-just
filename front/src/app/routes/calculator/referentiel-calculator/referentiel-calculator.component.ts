import { CommonModule, DecimalPipe } from '@angular/common'
import { AfterViewInit, Component, EventEmitter, HostBinding, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core'
import { SpeedometerComponent } from '../../../components/speedometer/speedometer.component'
import { TooltipsComponent } from '../../../components/tooltips/tooltips.component'
import { MainClass } from '../../../libs/main-class'
import { CalculatorInterface, etpAffectedInterface } from '../../../interfaces/calculator'
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
import { findHelpCenter } from '../../../utils/help-center'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { RHActivityInterface } from '../../../interfaces/rh-activity'
import { sumBy } from 'lodash'
import { AppService } from '../../../services/app/app.service'

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
   * Cockpit Warning Informations
   */
  cockpitWarningInformations = {
    ventilation: {
      dataNotUpdatedBefore6Month: false,
      nbAgentNotCompletedToday: 0,
      haveIncompleteDatasDuringThisPeriod: false, // is red
    },
    activity: {
      dataNotUpdatedBefore12Month: false,
      noDataToSubContentieuxDuring12Month: false,
      lessOneOfDatasToSubContentieux: false, // is red
      missingDatasToSubContentieuxBefore12Month: false, // is red
    },
  }

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

      if (this.showAlertPopin) {
        this.checkDataCompleteness()
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

      if (this.showAlertPopin) {
        this.checkDataCompleteness()
      }
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

  /**
   * Vérifie si les données de ventilation et d'activités sont complètes
   */
  async checkDataCompleteness() {
    if (this.currentProjection) {
      this.appService.appLoading.next(true)
      const allHR = await this.humanResourceService.onLightFilterList(
        this.humanResourceService.backupId.getValue() || 0,
        new Date(),
        this.currentProjection.contentieux.id,
      )

      let nbAgentNotCompletedToday = 0
      if (allHR.length > 0) {
        for (const hr of allHR) {
          const getCurrentVentilation = hr.currentActivities
          if (getCurrentVentilation && getCurrentVentilation.length > 0) {
            const activities = getCurrentVentilation.filter(
              (a: RHActivityInterface) => this.referentielService.mainActivitiesId.indexOf(a.contentieux.id) !== -1,
            )
            if (this.fixDecimal(sumBy(activities, 'percent'), 100) === 100) {
              continue
            }
          }
          nbAgentNotCompletedToday++
        }
      }

      let currentMonth = month(new Date())
      let nbMonthChecked = 0
      let haveIncompleteDatasDuringThisPeriod = false
      while (nbMonthChecked < 12) {
        const allHROfTheMonth = await this.humanResourceService.onLightFilterList(
          this.humanResourceService.backupId.getValue() || 0,
          currentMonth,
          this.currentProjection.contentieux.id,
        )

        if (allHROfTheMonth.length > 0) {
          for (const hr of allHROfTheMonth) {
            const getCurrentVentilation = hr.currentActivities
            if (getCurrentVentilation && getCurrentVentilation.length > 0) {
              const activities = getCurrentVentilation.filter(
                (a: RHActivityInterface) => this.referentielService.mainActivitiesId.indexOf(a.contentieux.id) !== -1,
              )
              if (this.fixDecimal(sumBy(activities, 'percent'), 100) === 100) {
                continue
              }
            }
            haveIncompleteDatasDuringThisPeriod = true
            nbMonthChecked = 12 // stop the loop
            break
          }
        }

        currentMonth = addMonths(currentMonth, -1)
        nbMonthChecked++
      }

      // Vérifier s'il y a au moins un sous-contentieux avec des données sur les 12 derniers mois
      let noDataToSubContentieuxDuring12Month = false
      currentMonth = month(new Date(), 48)
      nbMonthChecked = 0
      while (nbMonthChecked < 12) {
        const activities = await this.calculatorService.filterList(this.categorySelected, null, currentMonth, currentMonth, true, [
          this.currentProjection.contentieux.id,
        ])

        const childrens = activities.list[0].childrens || []
        if (childrens.length > 0 && childrens.every((c: CalculatorInterface) => c.totalIn === null && c.totalOut === null && c.lastStock === null)) {
          console.log('childrens with no datas', childrens)
          noDataToSubContentieuxDuring12Month = true
          nbMonthChecked = 12 // stop the loop
          break
        }

        currentMonth = addMonths(currentMonth, -1)
        nbMonthChecked++
      }

      let lessOneOfDatasToSubContentieux = false
      console.log(this.currentProjection)
      const childrens = this.currentProjection?.childrens || []
      if (childrens.length > 0 && childrens.some((c: CalculatorInterface) => c.totalIn === null && c.totalOut === null && c.lastStock === null)) {
        lessOneOfDatasToSubContentieux = true
      }

      // Vérifier s'il y a des datas manquantes sur les 12 derniers mois
      let missingDatasToSubContentieuxBefore12Month = false
      const endMonth = month(new Date(this.currentProjection.lastActivityUpdatedAt || new Date()))
      const startMonth = month(endMonth, -12)
      const allMonths = await this.calculatorService.rangeValues(this.currentProjection.contentieux.id, 'stock', startMonth, endMonth)
      if (allMonths.length !== 12 || allMonths.some((m: any) => m === null)) {
        missingDatasToSubContentieuxBefore12Month = true
      }

      this.cockpitWarningInformations = {
        ventilation: {
          dataNotUpdatedBefore6Month: this.nbMonthBetween(this.currentProjection.lastVentilationUpdatedAt) >= 6,
          nbAgentNotCompletedToday,
          haveIncompleteDatasDuringThisPeriod, // is red
        },
        activity: {
          dataNotUpdatedBefore12Month: this.nbMonthBetween(this.currentProjection.lastActivityUpdatedAt) >= 12,
          noDataToSubContentieuxDuring12Month,
          lessOneOfDatasToSubContentieux, // is red
          missingDatasToSubContentieuxBefore12Month, // is red
        },
      }
    }
    this.appService.appLoading.next(false)
  }
}
