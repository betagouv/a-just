import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core'
import * as Sentry from '@sentry/browser'
import { cloneDeep, isNaN, orderBy, sortBy, sumBy } from 'lodash'
import { Router } from '@angular/router'
import { HumanResourceInterface } from '../../interfaces/human-resource-interface'
import { RHActivityInterface } from '../../interfaces/rh-activity'
import { HRCategoryInterface } from '../../interfaces/hr-category'
import { HRFonctionInterface } from '../../interfaces/hr-fonction'
import { HRSituationInterface } from '../../interfaces/hr-situation'
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel'
import { MainClass } from '../../libs/main-class'
import { WrapperComponent } from '../../components/wrapper/wrapper.component'
import { DateSelectComponent } from '../../components/date-select/date-select.component'
import { dataInterface, SelectComponent } from '../../components/select/select.component'
import { InputButtonComponent } from '../../components/input-button/input-button.component'
import { SpeedometerComponent } from '../../components/speedometer/speedometer.component'
import { CommonModule } from '@angular/common'
import { PopupComponent } from '../../components/popup/popup.component'
import { EtpPreviewComponent } from '../../components/etp-preview/etp-preview.component'
import { PanelActivitiesComponent } from '../../components/panel-activities/panel-activities.component'
import { IntroJSComponent, IntroJSStep } from '../../components/intro-js/intro-js.component'
import { ReaffectatorService } from '../../services/reaffectator/reaffectator.service'
import { HumanResourceService } from '../../services/human-resource/human-resource.service'
import { WorkforceService } from '../../services/workforce/workforce.service'
import { UserService } from '../../services/user/user.service'
import { KPIService } from '../../services/kpi/kpi.service'
import { getCategoryTitle, getCategoryTitlePlurial } from '../../utils/category'
import { fixDecimal } from '../../utils/numbers'
import { DATE_REAFECTATOR, REAFFECTOR_UPDATE_AGENT } from '../../constants/log-codes'
import { MatIconModule } from '@angular/material/icon'
import { FormsModule } from '@angular/forms'
import { SanitizeHtmlPipe } from '../../pipes/sanitize-html/sanitize-html.pipe'
import { AppService } from '../../services/app/app.service'
import { HumanResourceIsInInterface } from '../workforce/workforce.page'
import { sortDates, today } from '../../utils/dates'

/**
 * Interface d'une fiche surchargé avec des rendus visuels
 */
interface HumanResourceSelectedInterface extends HumanResourceInterface {
  /**
   * Trouvé dans la recherche ou non
   */
  opacity: number
  /**
   * Cache pour les activité courantes
   */
  tmpActivities?: any
  /**
   * Temps de travail en string
   */
  etpLabel: string | null
  /**
   * Total des indispo
   */
  hasIndisponibility: number
  /**
   * Activités de la date sélectionnée
   */
  currentActivities: RHActivityInterface[]
  /**
   * Situation orignal de l'activité
   */
  orignalCurrentActivities: RHActivityInterface[]
  /**
   * ETP a la date sélectionnée
   */
  etp: number | null
  /**
   * Categorie à la date sélectionnée
   */
  category: HRCategoryInterface | null
  /**
   * Fonction à la date sélectionnée
   */
  fonction: HRFonctionInterface | null
  /**
   * Situation à la date sélectionnée
   */
  currentSituation: HRSituationInterface | null
  /**
   * Is c'est modifié ou non
   */
  isModify: boolean
}

/**
 * Liste des fiches d'une catégories
 */
interface listFormatedInterface {
  /**
   * Couleur de la categories
   */
  textColor: string
  /**
   * Couleur de fond de la categories
   */
  bgColor: string
  /**
   * Couleur de fond de la categories au hover
   */
  hoveColor: string
  /**
   * Nom de la catégorie (pluriel ou non)
   */
  label: string
  /**
   * Nom de la catégorie (au singulier)
   */
  originalLabel: string
  /**
   * Liste des fiches
   */
  allHr: HumanResourceSelectedInterface[]
  /**
   * Liste des fiches après filtres
   */
  hrFiltered: HumanResourceSelectedInterface[]
  /**
   * Reférentiel avec les calcules d'etp, couverture propre à la catégorie
   */
  referentiel: ContentieuReferentielCalculateInterface[]
  /**
   * Liste des id des personnes selectionnée
   */
  personSelected: number[]
  /**
   * Id de la categorie
   */
  categoryId: number
  /**
   * Total des ETP d'une categorie
   */
  totalRealETp: number
}

/**
 * Référentiel surchargé avec un visuel et des calculs ajustés
 */
interface ContentieuReferentielCalculateInterface
  /**
   * Référentiel surchargé avec un visuel et des calculs ajustés
   */
  extends ContentieuReferentielInterface {
  /**
   * Délai Total d'Ecoulement des Stock
   */
  dtes: number
  /**
   * Taux de couverture
   */
  coverage: number
  /**
   * Délai Total d'Ecoulement des Stock réél
   */
  realDTESInMonths: number
  /**
   * Taux de couverture réél
   */
  realCoverage: number
  /**
   * ETP moyen sur une période
   */
  etpToCompute: number
  /**
   * ETP disponible à aujourd'hui
   */
  etpUseToday: number
  /**
   * Temps moyen par dossier
   */
  magRealTimePerCase: number | null
  /**
   * Nombre d'heure travaillé
   */
  nbWorkingHours: number
  /**
   * Nombre de jour travaillé
   */
  nbWorkingDays: number
  /**
   * Total d'entrée
   */
  totalIn: number
  /**
   * Dernier stock disponible
   */
  lastStock: number
}

/**
 * Page de réaffectation
 */
@Component({
  standalone: true,
  imports: [
    WrapperComponent,
    DateSelectComponent,
    SelectComponent,
    InputButtonComponent,
    SpeedometerComponent,
    CommonModule,
    PopupComponent,
    EtpPreviewComponent,
    PanelActivitiesComponent,
    IntroJSComponent,
    MatIconModule,
    FormsModule,
    SanitizeHtmlPipe,
  ],
  templateUrl: './reaffectator.page.html',
  styleUrls: ['./reaffectator.page.scss'],
})
/**
 * Page de réaffectation
 */
export class ReaffectatorPage extends MainClass implements OnInit, OnDestroy {
  humanResourceService = inject(HumanResourceService)
  workforceService = inject(WorkforceService)
  rs = inject(ReaffectatorService)
  userService = inject(UserService)
  router = inject(Router)
  kpiService = inject(KPIService)
  appService = inject(AppService)
  /**
   * Dom du wrapper
   * @param wrapper
   */
  @ViewChild('wrapper') wrapper: WrapperComponent | undefined
  /**
   * Liste de toutes les personnes quelque soit l'arrivée ou le départ
   */
  allPersons: HumanResourceIsInInterface[] = []
  /**
   * Boulean lors de l'impression
   */
  duringPrint: boolean = false
  /**
   * Liste des fiches
   */
  humanResources: HumanResourceSelectedInterface[] = []
  /**
   * Referentiel complet
   */
  referentiel: ContentieuReferentielCalculateInterface[] = []
  /**
   * Menu déroulant pour le référentiel
   */
  formReferentiel: dataInterface[] = []
  /**
   * Menu déroulant pour les catégories
   */
  formFilterSelect: dataInterface[] = []
  /**
   * Menu déroulant pour les fonctions
   */
  formFilterFonctionsSelect: dataInterface[] = []
  /**
   * Recherche textuelle
   */
  searchValue: string = ''
  /**
   * List des personnes trouvé lors de la recherche
   */
  valuesFinded: HumanResourceInterface[] | null = null
  /**
   * Index de la personne que nous avons trouvé
   */
  indexValuesFinded: number = 0
  /**
   * Instance du timeout pour la recherche
   */
  timeoutUpdateSearch: any = null
  /**
   * Date sélectionnée
   */
  dateSelected: Date = this.workforceService.dateSelected.getValue()
  /**
   * Liste reçu par le serveur
   */
  listFormated: listFormatedInterface[] = []
  /**
   * Contentieux avec les calculs
   */
  filterSelected: {
    filter: ContentieuReferentielCalculateInterface | null
    up: boolean | null
  } = { filter: null, up: null }
  /**
   * Position de la dernière recherche
   */
  lastScrollTop: number = 0
  /**
   * Boolean de première recherche
   */
  isFirstLoad: boolean = true
  /**
   * Affiche ou non le paneau des indicateurs
   */
  showIndicatorPanel: boolean = true
  /**
   * Liste des ETP par défaut qui sont modifiable à titre informatif
   */
  firstETPTargetValue: (number | null)[] = []
  /**
   * Isole les personnes modifiés
   */
  isolatePersons: boolean = false
  /**
   * Affiche les personnes modifiés et leurs pendant non modifié
   */
  showReelValues: boolean = false
  /**
   * Reaffectator Service
   */
  reaffectatorService: ReaffectatorService
  /**
   * Utilisateur sort du composant
   */
  isLeaving: boolean = false
  /**
   * Utilisateur peut sortir du composant
   */
  canLeave: boolean = false

  forceDeactivate: boolean = false

  nextState: string | null = null

  /**
   * Flag pour indiquer que le composant est en cours de destruction
   */
  isDestroyed: boolean = false

  /**
   * Sentry transaction pour le premier chargement (depuis Ventilations)
   */
  private _reaffInitialTxn: any | undefined
  private _reaffInitialStartAt: number | undefined
  private _reaffInitialPending = true

  /**
   * Transactions Sentry pour recalculs suite aux actions utilisateur
   */
  private _reaffTxn: any | undefined
  private _reaffStartAt: number | undefined
  private _reaffLabel: string | undefined

  private _startReaffTxn(label: string) {
    try {
      // Si une transaction est déjà en cours, la finaliser avant d'en démarrer une nouvelle
      if (this._reaffTxn && this._reaffStartAt) {
        const ms = Math.max(0, performance.now() - this._reaffStartAt)
        try { (this._reaffTxn as any)?.setAttribute?.('latency_ms', ms as any) } catch {}
        try { (this._reaffTxn as any)?.finish?.() } catch {}
      }
    } catch {}
    this._reaffLabel = label
    this._reaffStartAt = performance.now()
    // Démarrer une transaction manuelle pour garantir que la durée = fin - début
    try {
      const tx: any = (Sentry as any).startTransaction
        ? (Sentry as any).startTransaction({ name: 'reaffectateur: compute', op: 'task', forceTransaction: true })
        : null
      this._reaffTxn = tx || this._reaffTxn
      try { (Sentry as any).getCurrentHub?.().configureScope?.((scope: any) => scope.setSpan?.(tx)) } catch {}
      try { (this._reaffTxn as any)?.setAttribute?.('sentry.tag.latency_event', label) } catch {}
    } catch {}
  }

  private _finishReaffTxn() {
    if (this._reaffTxn && this._reaffStartAt) {
      try {
        const ms = Math.max(0, performance.now() - this._reaffStartAt)
        ;(this._reaffTxn as any)?.setAttribute?.('latency_ms', ms as any)
      } catch {}
      try { (this._reaffTxn as any)?.finish?.() } catch {}
    }
    this._reaffTxn = undefined
    this._reaffStartAt = undefined
    this._reaffLabel = undefined
  }

  introSteps: IntroJSStep[] = [
    {
      target: '#wrapper-contener',
      title: 'À quoi sert le simulateur des affectations ?',
      intro:
        '<p>Cet écran qui se présente comme le ventilateur en mode « nuit », c’est-à-dire simulation, vous permet <b>d’adapter finement l’affectation de vos effectifs, à ressources constantes</b>, sur les différents contentieux, <b>en visualisant instantanément l’impact de votre projet de réorganisation sur les délais de traitement du contentieux que vous voulez renforcer</b> mais aussi sur les autres matières que vous allez de ce fait nécessairement dégarnir.</p><p><b>Toutes vos actions sur cet écran n’ont aucun impact sur la ventilation actuelle de vos agents</b> : ce ne sont que des projections.</p>',
    },
    {
      target: '#content .container .title',
      title: 'Choisissez la date et la catégorie d’agent',
      intro:
        '<p>afin de déterminer <b>le champ d’application des hypothèses que vous allez jouer.</b> Comme dans le ventilateur, en modifiant la date dans le calendrier, vous affichez la liste <b>des agents présents selon leur catégorie ainsi que la ventilation de leur ETPT</b> sur les différents contentieux à la date choisie. Vous pouvez <b>filtrer par fonction ou contentieux</b> selon vos besoins.</p>',
    },
    {
      target: '#content .container .title .search-bar',
      title: 'Rechercher',
      intro: '<p>Vous pouvez également rechercher un agent de façon nominative</p>',
    },
    {
      target: '#content .container .indicators',
      title: 'Vos indicateurs d’impact affichent',
      intro:
        "<p>pour chaque contentieux, la situation à la date choisie : <ul><li>des <b>ETPT affectés</b></li><li> du <b>taux de couverture et du DTES exprimé en nombre de mois</b></li></ul> issue des <b>données d'activité</b> et <b>d’effectifs</b> enregistrées dans A-JUST. La projection sera d’autant plus précise et fine que vous aurez actualisé ces éléments, en fonction des informations dont vous disposez, dans le ventilateur et l'écran de données d’activité.<br/> Vous pouvez renseigner la <b>valeur cible d’ETPT</b> que vous souhaitez atteindre dans un contentieux.</p>",
    },
    {
      target: '#wrapper-contener',
      title: 'Découvrir la fonctionnalité',
      intro:
        '<p>Explorez notre vidéo explicative du "<b>simulateur des affectations</b>", orientée autour de deux cas d\'usage : <b>réagir à une diminution des ETPT disponibles</b> et <b>prioriser un contentieux pour en améliorer les délais de traitement</b>.</p><video controls class="intro-js-video"><source src="/assets/videos/video-reaffectateur.mp4" type="video/mp4" /></video>',
    },
  ]

  /**
   * Constructeur
   */
  constructor() {
    super()
    this.reaffectatorService = this.rs
  }

  popupAction = [
    { id: 'leave', content: 'Quitter sans exporter' },
    { id: 'export', content: 'Exporter en PDF et quitter', fill: true },
  ]

  /**
   * A l'initialisation chercher les variables globals puis charger
   */
  ngOnInit() {
    this.watch(
      this.humanResourceService.backupId.subscribe(() => {
        // Démarre une transaction Sentry pour le premier chargement uniquement
        if (this._reaffInitialPending && !this._reaffInitialTxn) {
          const label = 'Chargement du reaffectateur'
          this._reaffInitialStartAt = performance.now()
          this._reaffInitialTxn = Sentry.startSpan(
            { name: 'reaffectateur: compute', op: 'task', forceTransaction: true, attributes: { 'sentry.tag.latency_event': label } },
            async () => {}
          )
          try { Sentry.getActiveSpan()?.setAttribute('sentry.tag.latency_event', label) } catch {}
        }
        this.onFilterList()
      }),
    )
    this.watch(
      this.humanResourceService.categories.subscribe((categories: HRCategoryInterface[]) => {
        this.formFilterSelect = categories.map((f) => ({
          id: f.id,
          value: f.label,
          orignalValue: getCategoryTitle(f.label),
          orignalValuePlurial: getCategoryTitlePlurial(f.label),
        }))

        this.onSelectedCategoriesIdChanged(
          this.reaffectatorService.selectedCategoriesId !== null
            ? [this.reaffectatorService.selectedCategoriesId]
            : this.formFilterSelect.length
              ? [this.formFilterSelect[0].id]
              : [],
        )
      }),
    )
  }

  /**
   * Destruction des observables
   */
  ngOnDestroy() {
    // Vider immédiatement les listes pour arrêter les @defer
    this.listFormated = []
    this.humanResources = []
    this.referentiel = []
    this.allPersons = []

    // Nettoyer les timeouts actifs
    if (this.timeoutUpdateSearch) {
      clearTimeout(this.timeoutUpdateSearch)
      this.timeoutUpdateSearch = null
    }

    // Réinitialiser les variables de recherche
    this.valuesFinded = null
    this.searchValue = ''

    // Marquer le composant comme détruit
    this.isDestroyed = true

    // Détruire les observables
    this.watcherDestroy()
  }

  canDeactivate(nextState: string) {
    const modified = this.listFormated.filter((elem) => {
      return elem.hrFiltered.some((hr) => hr.isModify)
    })
    if (modified.length === 0) return true

    this.isLeaving = true
    this.nextState = nextState
    return this.forceDeactivate
  }

  onPopupDetailAction(action: any) {
    switch (action.id) {
      case 'leave':
        {
          this.isLeaving = false
          this.forceDeactivate = true
          this.router.navigate([this.nextState])
        }
        break
      case 'export':
        {
          this.isLeaving = false
          this.forceDeactivate = true
          this.onExport()
        }
        break
    }
  }

  /**
   * Mise à jour des catégories du menu déroulant
   */
  updateCategoryValues() {
    this.formFilterSelect = this.formFilterSelect.map((c) => {
      const itemBlock = this.listFormated.find((l) => l.categoryId === c.id)
      c.value = c.orignalValue + ''

      if (itemBlock && itemBlock.hrFiltered) {
        c.value = `${itemBlock.hrFiltered.length} ${itemBlock.hrFiltered.length > 1 ? c.orignalValuePlurial || c.orignalValue : c.orignalValue} (${fixDecimal(
          sumBy(itemBlock.hrFiltered || [], function (h) {
            const etp = (h.etp || 0) - h.hasIndisponibility
            return etp > 0 ? etp : 0
          }),
          100,
        )} ETPT)`
      }

      if (c.id === this.reaffectatorService.selectedCategoriesId) {
        c.renderHTML = `<b>${c.value}</b>`
      } else {
        c.renderHTML = c.value
      }

      return c
    })
  }

  /**
   * Accélération du chargement de la liste
   * @param index
   * @param item
   * @returns id
   */
  trackById(index: number, item: any) {
    return item.id
  }

  /**
   * Retourne si une personne est trouvé par la recherche ou non
   * @param hr
   * @returns opacity
   */
  checkHROpacity(hr: HumanResourceInterface) {
    const name = (hr.firstName || '') + ' ' + (hr.lastName || '')

    if (!this.searchValue || name.toLowerCase().includes(this.searchValue.toLowerCase())) {
      return 1
    }

    return 0.5
  }

  /**
   * Appel au serveur pour avoir la liste
   * @returns list
   */
  onFilterList() {
    if (
      this.isDestroyed ||
      !this.formFilterSelect.length ||
      this.humanResourceService.backupId.getValue() === null ||
      this.reaffectatorService.selectedCategoriesId === null
    ) {
      return
    }

    let selectedReferentielIds: number[] | null = null
    if (this.formReferentiel.length !== this.reaffectatorService.selectedReferentielIds.length && this.formReferentiel.length !== 0) {
      selectedReferentielIds = this.reaffectatorService.selectedReferentielIds
    }

    let selectedFonctionsIds = null
    if (this.reaffectatorService.selectedFonctionsIds.length !== this.formFilterFonctionsSelect.length) {
      selectedFonctionsIds = [...this.reaffectatorService.selectedFonctionsIds]
    }
    this.appService.appLoading.next(true)

    this.reaffectatorService
      .onFilterList(
        this.humanResourceService.backupId.getValue() || 0,
        this.dateSelected,
        this.reaffectatorService.selectedCategoriesId || 0,
        selectedFonctionsIds,
        selectedReferentielIds,
      )
      .then(({ list, allPersons }) => {
        // Ne pas traiter la réponse si le composant est détruit
        if (this.isDestroyed) {
          return
        }

        this.allPersons = allPersons
        this.listFormated = list.map((i: listFormatedInterface, index: number) => {
          if (index === 0) {
            this.referentiel = i.referentiel.map((r) => ({
              ...r,
              selected: true,
            }))
            this.formReferentiel = i.referentiel.map((r) => ({
              id: r.id,
              value: this.referentielMappingNameByInterface(r.label),
            }))
            if (this.firstETPTargetValue.length === 0) {
              this.firstETPTargetValue = i.referentiel.map(() => null)
            }

            this.reaffectatorService.selectedReferentielIds = this.reaffectatorService.selectedReferentielIds.length
              ? this.reaffectatorService.selectedReferentielIds
              : this.formReferentiel.map((c) => c.id)
          }

          const allHr = i.allHr.map((h) => ({
            ...h,
            orignalCurrentActivities: h.currentActivities,
            isModify: false,
          }))
          return {
            ...i,
            allHr,
            hrFiltered: [...allHr],
            personSelected: [],
            referentiel: i.referentiel.map((r) => ({
              ...r,
              dtes: 0,
              coverage: 0,
            })),
          }
        })
      })
      .then(() => {
        this.findPersonWithoutVentilations()
        this.orderListWithFiltersParams()
      })
      .finally(() => {
        this.appService.appLoading.next(false)
        // Finalise la transaction de premier chargement si en cours
        if (this._reaffInitialPending && this._reaffInitialTxn) {
          try {
            const ms = this._reaffInitialStartAt ? Math.max(0, performance.now() - this._reaffInitialStartAt) : undefined
            Sentry.getActiveSpan()?.setAttribute('latency_ms', ms as any)
          } catch {}
          try { (this._reaffInitialTxn as any)?.finish?.() } catch {}
          this._reaffInitialTxn = undefined
          this._reaffInitialStartAt = undefined
          this._reaffInitialPending = false
        }
        // Finaliser une éventuelle transaction d'action utilisateur
        this._finishReaffTxn()
      })
  }

  /**
   * Trouver les personnes sans ventilation mais on une date d'arrivée avant la date sélectionnée
   */
  findPersonWithoutVentilations() {
    this.allPersons
      .filter(
        (person) =>
          !person.isIn &&
          person.dateStart &&
          sortDates(today(person.dateStart), today(this.dateSelected), false) <= 0 &&
          person.situations &&
          person.situations.length &&
          person.situations[person.situations.length - 1].dateStart &&
          sortDates(today(person.situations[person.situations.length - 1].dateStart), today(this.dateSelected), false) > 0 &&
          person.category,
      )
      .map((person) => {
        this.listFormated.map((l) => {
          if (l.categoryId === person.category?.id && !l.allHr.find((h) => h.id === person.id)) {
            const getIndispo = this.humanResourceService.findAllIndisponibilities(person, this.dateSelected)
            let hasIndisponibility = getIndispo.map((i) => i.percent).reduce((a, b) => a + b, 0)
            if (hasIndisponibility > 100) {
              hasIndisponibility = 100
            }
            const newPerson = {
              ...person,
              firstName: person.firstName || '',
              lastName: person.lastName || '',
              totalAffected: 0,
              opacity: 1,
              etpLabel: null,
              hasIndisponibility,
              currentActivities: [],
              etp: null,
              fonction: person.situations[0].fonction,
              currentSituation: null,
              category: person.situations[0].category,
              orignalCurrentActivities: [],
              isModify: false,
            }
            l.hrFiltered = l.hrFiltered || []
            l.hrFiltered.push(cloneDeep(newPerson))
            l.hrFiltered = sortBy(l.hrFiltered, 'fonction.rank')
            l.allHr = l.hrFiltered || []
          }
        })
      })
  }

  /**
   * Trie de la liste retournée
   * @param onSearch
   */
  orderListWithFiltersParams(onSearch: boolean = true, up: boolean | null = null) {
    this.listFormated = this.listFormated.map((list) => {
      list.hrFiltered = orderBy(list.hrFiltered, ['fonction.rank'], ['asc'])

      if (this.filterSelected) {
        list.hrFiltered = orderBy(
          list.hrFiltered,
          (h) => {
            const acti = (h.orignalCurrentActivities || []).find((a) => a.contentieux?.id === this.filterSelected.filter?.id)
            return acti ? acti.percent || 0 : 0
          },
          [up ? 'asc' : 'desc'],
        )
      }

      return list
    })

    if (onSearch) {
      this.onSearchBy()
    }
    this.calculateReferentielValues()
    this.updateCategoryValues()
  }

  /**
   * Demande de recherche sur la liste
   */
  onSearchBy() {
    const valuesFinded: HumanResourceInterface[] = []
    let nbPerson = 0
    this.listFormated = this.listFormated.map((l: listFormatedInterface) => ({
      ...l,
      hrFiltered: l.hrFiltered.map((h) => {
        const opacity = this.checkHROpacity(h)
        nbPerson++
        if (opacity === 1) {
          valuesFinded.push(h)
        }

        return {
          ...h,
          opacity,
        }
      }),
    }))

    this.valuesFinded = valuesFinded.length === nbPerson ? null : valuesFinded
    this.indexValuesFinded = 0

    if (this.valuesFinded && this.valuesFinded.length) {
      this.valuesFinded = this.valuesFinded.filter((x) => x.situations[0]?.category?.id === this.reaffectatorService.selectedCategoriesId)
      this.onGoTo(this.valuesFinded[this.indexValuesFinded].id)
    } else {
      this.onGoTo(null)
    }
  }

  /**
   * Scroller sur une fiche
   * @param hrId
   */
  onGoTo(hrId: number | null) {
    let isFinded = false
    const findContainer = document.getElementById('container-list')
    if (findContainer) {
      if (hrId) {
        const findElement = findContainer.querySelector(`#human-${hrId}`)
        if (findElement) {
          const headers = findContainer.querySelectorAll('.header-list')
          const { top } = findElement.getBoundingClientRect()
          let topDelta = findContainer.getBoundingClientRect().top + 8
          for (let i = 0; i < headers.length; i++) {
            const topHeader = headers[i].getBoundingClientRect().top
            if (topHeader < top) {
              topDelta += headers[i].getBoundingClientRect().height
            }
          }

          let scrollTop = top - topDelta + findContainer.scrollTop
          if (this.lastScrollTop && this.lastScrollTop > scrollTop) {
            scrollTop -= 88
          }

          isFinded = true
          findContainer.scroll({
            behavior: 'smooth',
            top: scrollTop,
          })

          this.lastScrollTop = scrollTop
        } else {
        }
      } else {
        isFinded = true
        findContainer.scrollTo({
          behavior: 'smooth',
          top: 0,
        })
      }
    }

    if (!isFinded) {
      setTimeout(() => this.onGoTo(hrId), 200)
    }
  }

  /**
   * Recherche allez au prochain
   * @param delta
   */
  onFindNext(delta: number = 1) {
    if (this.valuesFinded) {
      this.indexValuesFinded = this.indexValuesFinded + delta
      if (this.indexValuesFinded > this.valuesFinded.length - 1) {
        this.indexValuesFinded = 0
      } else if (this.indexValuesFinded < 0) {
        this.indexValuesFinded = this.valuesFinded.length - 1
      }

      this.onGoTo(this.valuesFinded[this.indexValuesFinded].id)
    }
  }

  /**
   * Quand le referentiel du menu déroulant change
   * @param list
   */
  onSelectedReferentielIdsChanged(list: any) {
    this.reaffectatorService.selectedReferentielIds = list
    this.referentiel = this.referentiel.map((cat) => {
      cat.selected = list.indexOf(cat.id) !== -1

      return cat
    })

    if (list.length === 0) {
      this.listFormated = []
    } else {
      // Démarrer une transaction pour filtre contentieux
      const n = list.length
      this._startReaffTxn(`Chargement du reaffectateur après filtre par contentieux, ${n} sélectionné(s)`) 
      this.onFilterList()
    }
  }

  /**
   * Date de sélection change
   * @param date
   */
  onDateChanged(date: any) {
    this.dateSelected = date
    this.workforceService.dateSelected.next(date)
    // Démarrer une transaction pour changement de date
    this._startReaffTxn(`Chargement du reaffectateur après changement de date`)
    this.onFilterList()
    this.kpiService.register(DATE_REAFECTATOR, date)
  }

  /**
   * Filtre de la liste
   * @param ref
   */
  onFilterBy(ref: ContentieuReferentielCalculateInterface) {
    if (!this.filterSelected.filter || this.filterSelected.filter?.id !== ref.id || this.filterSelected.up === true) {
      this.filterSelected.filter = ref
      this.filterSelected.up = this.filterSelected.up === null ? true : false
    } else {
      this.filterSelected.filter = null
      this.filterSelected.up = null
    }

    this.orderListWithFiltersParams(false, this.filterSelected.up)
  }

  /**
   * Export en PDF de la page
   */
  onExport() {
    this.duringPrint = true
    const date = new Date()

    this.wrapper
      ?.exportAsPdf(
        `Simulation-D-Affectation_par ${this.userService.user.getValue()!.firstName}_${this.userService.user.getValue()!.lastName!}_le ${new Date()
          .toJSON()
          .slice(0, 10)}.pdf`,
        true,
        true,
        `Simulation d'affectation par ${this.userService.user.getValue()!.firstName} ${this.userService.user.getValue()!.lastName} - le ${(
          date.getDate() + ''
        ).padStart(2, '0')} ${this.getShortMonthString(date)} ${date.getFullYear()}`,
      )
      .then(() => {
        this.duringPrint = false
        if (this.forceDeactivate) this.router.navigate([this.nextState])
      })
  }

  /**
   * Rechargement de la liste des fonctions en fonction des catégories
   * @param item
   */
  onSelectedCategoriesIdChanged(item: string[] | number[]) {
    this.reaffectatorService.selectedCategoriesId = item.length ? +item[0] : null

    const allFonctions = this.humanResourceService.fonctions.getValue()
    let fonctionList: HRFonctionInterface[] = allFonctions.filter((f) => f.categoryId === this.reaffectatorService.selectedCategoriesId)
    this.formFilterFonctionsSelect = fonctionList.map((f) => ({
      id: f.id,
      value: f.code || f.label,
    }))

    // Démarrer une transaction Sentry pour le recalcul suite au choix de catégorie
    const selectedCat = this.formFilterSelect.find((c) => c.id === this.reaffectatorService.selectedCategoriesId)
    const catLabel = selectedCat?.orignalValuePlurial || selectedCat?.orignalValue || 'catégorie'
    this._startReaffTxn(`Chargement du reaffectateur après choix de catégorie, ${catLabel}`)

    // Appliquer la mise à jour des fonctions sans démarrer une seconde transaction
    this.onSelectedFonctionsIdsChanged(fonctionList.map((f) => f.id), { silent: true })
  }

  /**
   * Event lors du changement des fonctions
   * @param list
   */
  onSelectedFonctionsIdsChanged(list: string[] | number[], opts?: { silent?: boolean }) {
    this.reaffectatorService.selectedFonctionsIds = list.map((i) => +i)
    // Démarrer une transaction pour filtre fonctions (sauf si appel silencieux depuis changement de catégorie)
    if (!opts?.silent) {
      const n = this.reaffectatorService.selectedFonctionsIds.length
      this._startReaffTxn(`Chargement du reaffectateur après filtre par fonction, ${n} sélectionnée(s)`)   
    }
    this.onFilterList()
  }

  /**
   * Calcul des ETP
   * @param referentielId
   * @param hrList
   * @returns
   */
  onCalculETPAffected(referentielId: number, hrList: HumanResourceSelectedInterface[]) {
    let etpCalculate = 0

    hrList.map((hr) => {
      const timeAffected = sumBy(
        hr.currentActivities.filter((r) => r.contentieux && r.contentieux.id === referentielId),
        'percent',
      )
      let realETP = (hr.etp || 0) - hr.hasIndisponibility
      if (realETP < 0) {
        realETP = 0
      }
      etpCalculate += (timeAffected / 100) * realETP
    })

    return fixDecimal(etpCalculate, 1000)
  }

  /**
   * Calcul des couvertures et DTES en fonction des saisies
   */
  calculateReferentielValues() {
    this.listFormated = this.listFormated.map((itemList) => {
      return {
        ...itemList,
        referentiel: itemList.referentiel.map((r) => ({
          ...r,
          etpUseToday: this.onCalculETPAffected(r.id, itemList.allHr),
          totalAffected: this.onCalculETPAffected(r.id, itemList.hrFiltered),
        })),
      }
    })

    const itemList = this.listFormated.find((i) => i.categoryId === this.reaffectatorService.selectedCategoriesId)

    if (itemList) {
      this.referentiel = this.referentiel.map((ref) => {
        const refFromItemList = (itemList.referentiel || []).find((r) => r.id === ref.id)

        if (!refFromItemList) {
          return ref
        }

        const averageWorkingProcess = refFromItemList.magRealTimePerCase || 0
        let etpt = 0
        switch (this.reaffectatorService.selectedCategoriesId) {
          case 1: {
            etpt = (refFromItemList as any).etpMag ?? 0
            break
          }
          case 2: {
            etpt = (refFromItemList as any).etpFon ?? 0
            break
          }
          case 3: {
            etpt = (refFromItemList as any).etpCon ?? 0
            break
          }
          default: {
            etpt = refFromItemList.totalAffected ?? 0
          }
        }
        if (refFromItemList.etpUseToday !== refFromItemList.totalAffected) etpt = refFromItemList.totalAffected || 0
        const nbWorkingHours = refFromItemList.nbWorkingHours || 0
        const nbWorkingDays = refFromItemList.nbWorkingDays || 0
        const lastStock = refFromItemList.lastStock || 0
        const inValue = refFromItemList.totalIn || 0

        let outValue = averageWorkingProcess === 0 ? 0 : (etpt * nbWorkingHours * nbWorkingDays) / averageWorkingProcess

        let dtes = outValue && Number.isFinite(lastStock / outValue) ? Math.max(0, fixDecimal(lastStock / outValue, 100)) : Infinity

        let realDTESInMonths = outValue && Number.isFinite(ref.realDTESInMonths) ? ref.realDTESInMonths : Infinity

        let coverage = outValue && refFromItemList.totalIn !== 0 ? Math.round((outValue / inValue) * 100) : NaN

        let realCoverage =
          this.reaffectatorService.selectedReferentielIds.includes(ref.id) && outValue && refFromItemList.totalIn !== 0 ? ref.realCoverage : NaN

        return {
          ...ref,
          realDTESInMonths: this.noNegativValues(realDTESInMonths),
          coverage,
          dtes: this.noNegativValues(dtes),
          etpUseToday: refFromItemList.etpUseToday,
          totalAffected: refFromItemList.totalAffected,
          realCoverage: realCoverage,
        }
      })
    }
  }

  /**
   * Mise à jour à la volé de la ventilation d'une fiche
   * @param hr
   * @param referentiels
   * @param indexList
   */
  updateHRReferentiel(hr: HumanResourceSelectedInterface, referentiels: ContentieuReferentielInterface[], indexList: number) {
    // Arrêter le traitement si le composant est détruit
    if (this.isDestroyed) {
      return
    }

    const list: RHActivityInterface[] = []
    this.kpiService.register(REAFFECTOR_UPDATE_AGENT, hr.id.toString())

    referentiels
      .filter((r) => r.percent)
      .map((r) => {
        list.push({
          id: -1,
          percent: r.percent || 0,
          contentieux: {
            id: r.id,
            label: r.label,
            averageProcessingTime: null,
          },
        })
        ;(r.childrens || [])
          .filter((rc: ContentieuReferentielInterface) => rc.percent)
          .map((rc: ContentieuReferentielInterface) => {
            list.push({
              id: -1,
              percent: rc.percent || 0,
              contentieux: {
                id: rc.id,
                label: rc.label,
                averageProcessingTime: null,
              },
            })
          })
      })

    const humanId = hr.id
    const indexOfHR = this.listFormated[indexList].hrFiltered.findIndex((hr) => hr.id === humanId)

    if (indexOfHR !== -1) {
      this.listFormated[indexList].hrFiltered[indexOfHR].currentActivities = list
      this.listFormated[indexList].hrFiltered[indexOfHR].isModify = true

      this.orderListWithFiltersParams(false)
    }
  }

  /**
   * Selection on non une fiche
   * @param index
   * @param hr
   */
  toogleCheckPerson(index: number, hr: HumanResourceSelectedInterface) {
    const indexFinded = this.listFormated[index].personSelected.indexOf(hr.id)
    if (indexFinded === -1) {
      this.listFormated[index].personSelected.push(hr.id)
    } else {
      this.listFormated[index].personSelected.splice(indexFinded, 1)
    }

    if (this.listFormated[index].personSelected.length === 0) {
      // force to reset isolate var
      this.isolatePersons = false
    }
  }

  /**
   * Selectionne ou non toutes les fiches
   * @param index
   */
  toogleCheckAllPerson(index: number) {
    if (this.listFormated[index].personSelected.length === this.listFormated[index].hrFiltered.length) {
      this.listFormated[index].personSelected = []
    } else {
      this.listFormated[index].personSelected = this.listFormated[index].hrFiltered.map((h) => h.id)
    }
  }

  /**
   * Supprime les données modifiés sélectionnées
   * @param list
   */
  onInitList(list: listFormatedInterface) {
    if (list.personSelected.length) {
      list.personSelected.map((id) => {
        const indexOfHRFiltered = list.hrFiltered.findIndex((h) => h.id === id)
        const indexOfAllHR = list.allHr.findIndex((h) => h.id === id)

        if (indexOfHRFiltered !== -1 && indexOfAllHR !== -1) {
          list.hrFiltered[indexOfHRFiltered] = cloneDeep(list.allHr[indexOfAllHR])
        }
      })

      list.personSelected = []
      this.orderListWithFiltersParams()
    }
  }

  /**
   * Isole ou non
   */
  onToogleIsolation() {
    this.isolatePersons = !this.isolatePersons
  }

  /**
   * Trouve les valeurs non modifiés d'une fiche
   * @param hr
   * @param itemObject
   * @returns
   */
  getOrignalHuman(hr: HumanResourceSelectedInterface, itemObject: listFormatedInterface) {
    return itemObject.allHr.find((h) => h.id === hr.id)
  }

  /**
   * Récuperer le type de l'app
   */
  getInterfaceType() {
    return this.userService.interfaceType === 1
  }

  /**
   * Mapping des noms de contentieux selon l'interface
   * @param label
   * @returns
   */
  referentielMappingNameByInterface(label: string) {
    if (this.getInterfaceType() === true) return this.referentielCAMappingName(label)
    else return this.referentielMappingName(label)
  }

  /**
   * Arrondir un nombre à l'entier le plus proche
   * @param valeur
   * @returns
   */
  round(valeur: number) {
    return Math.round(valeur)
  }

  noNegativValues(value: number) {
    return value < 0 ? 0 : value
  }

  isInfinity(value: number) {
    return isNaN(value) || !Number.isFinite(value) ? true : false
  }
}
