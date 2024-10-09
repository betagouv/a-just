import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core'
import { BackupInterface } from 'src/app/interfaces/backup'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { UserService } from 'src/app/services/user/user.service'
import {
  userCanViewContractuel,
  userCanViewGreffier,
  userCanViewMagistrat,
} from 'src/app/utils/user'
import { today, dateAddDays } from 'src/app/utils/dates'
import { HRCategorySelectedInterface } from 'src/app/interfaces/hr-category'
import {
  listFormatedInterface,
  HumanResourceSelectedInterface,
} from '../workforce/workforce.page'
import { sumBy } from 'lodash'
import { IntroJSStep } from 'src/app/components/intro-js/intro-js.component'

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  templateUrl: './panorama.page.html',
  styleUrls: ['./panorama.page.scss'],
})
export class PanoramaPage
  extends MainClass
  implements OnInit, OnDestroy, AfterViewInit
{
  /**
   * Dom du contenu scrollable
   */
  @ViewChild('container') domContainer: ElementRef | null = null
  /**
   * Dom du header
   */
  @ViewChild('header') domHeader: ElementRef | null = null
  /**
   * Dom du titre des activites
   */
  @ViewChild('titleActivities') domTitleActivities: ElementRef | null = null
  /**
   * Date selected
   */
  dateSelected: Date = new Date()
  /**
   * Date de fin de requête
   */
  dateStart: Date = dateAddDays(new Date(), -15)
  /**
   * Date de début de requête
   */
  dateEnd: Date = dateAddDays(new Date(), +15)
  /**
   * Date de début de requête
   */
  now: Date = new Date()
  /**
   * liste première requête
   */
  firstList: listFormatedInterface[] = []
  /**
   * Liste seconde requête
   */
  secondList: listFormatedInterface[] = []
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
   * Peux voir la partie ventilation
   */
  canViewVentilation: boolean = false
  /**
   * Peux voir la partie activities
   */
  canViewActivities: boolean = false
  /**
   * En cour de chargement
   */
  isLoading: boolean = false
  /**
   * liste des catégories filtrées
   */
  categoriesFilterList: HRCategorySelectedInterface[] = []
  /**
   * Liste des ids catégories
   */
  categoriesFilterListIds: number[] = []
  /**
   * Identifiants des contentieux selectionnés
   */
  selectedReferentielIds: number[] = []
  /**
   * Liste formatée contenant l'ensemble des informations nécessaire au chargement de la page
   */
  listFormated: listFormatedInterface[] = []
  /**
   * Liste total des agents
   */
  allPersons: HumanResourceSelectedInterface[] = []
  /**
   *  Liste des personnes ayant une date de départ dans les 15 prochains jours ou les 15 derniers jours
   */
  listDepartures: HumanResourceSelectedInterface[] = []
  /**
   *  Liste des personnes ayant une date de début dans les 15 prochains jours ou les 15 derniers jours
   */
  listArrivals: HumanResourceSelectedInterface[] = []
  /**
   * Liste des personnes non disponibles dans les 15 prochains jours ou les 15 derniers jours
   */
  listUnavailabilities: HumanResourceSelectedInterface[] = []
  /**
   * Total des effectifs à afficher
   */
  totalWorkforce: number = 0
  /**
   * Selection du title des activités
   */
  titleSelectActivities: boolean = false
  /**
   * Filter categories to view
   */
  categoriesFiltered: number[] | null = null
  /**
   * Juridiction id
   */
  backupId: number | null = null
  /**
   * Intro JS Steps
   */
  introSteps: IntroJSStep[] = [
    {
      target: '#wrapper-contener',
      title: 'Panorama',
      intro:
        'Cette page vous offre un aperçu en un coup d’œil de la mise à jour des informations enregistrées dans l’espace ' +
        (this.isTJ() ? 'du TJ' : 'de la CA') +
        '.',
    },
    {
      target: '.effectifs-panels',
      title: "Les données d'effectifs",
      intro:
        "Récapitulent l'ensemble des ressources humaines à date, la situation des agents de la " +
        (this.isTJ() ? 'juridiction' : "cour d'appel") +
        ' et les éventuels changements dans les 15 derniers et 15 prochains jours.',
    },
    {
      target: '.wordforce-composition',
      title: 'La composition des effectifs',
      intro:
        'À la date du jour. Vous pouvez aussi renseigner la CLE pour la comparer à votre situation actuelle.',
    },
    {
      target: '.records-update',
      title: 'Pourcentage et date de mise à jour',
      intro:
        'Ici, visualisez et <b>priorisez les tâches à effectuer</b>, pour vous ou vos équipes.<br/><br/>Veillez à ce que ces données soient à jour et actualisées afin de disposer d’une vision précise et fine de la mobilisation des ressources humaines dans la ' +
        (this.isTJ() ? 'juridiction' : "cour d'appel") +
        '.',
    },
    {
      target: 'workforce-change',
      title: 'Changements récents',
      intro:
        "Cet espace rassemble les <b>arrivées, départs ou indisponibilités</b> enregistrés dans le ventilateur pour les 15 derniers et 15 prochains jours. Vous pouvez ainsi pré-renseigner dans la fiche des agents une date prévisionnelle de départ, de retour d’indisponibilité ou d'arrivée et la modifier si vous découvrez qu’elle a évolué.",
    },
  ]

  stepsOnlyForTJ: IntroJSStep[] = [
    {
      target: '#activites',
      title: "Données d'activité",
      intro: "Voici une vue d'ensemble de vos données présentes dans A-JUST.",
    },
    {
      target: 'activities-last-disponibilities',
      title: 'Dernières données disponibles',
      intro:
        'Visualisez en un coup d’œil quelles données sont présentes dans A-JUST ce jour. Si nécessaire, ajustez les entrées, sorties et stocks sur l’un ou l’autre des contentieux pour fiabiliser, avec vos données locales, les restitutions qui seront élaborées par l’outil.',
    },
    {
      target: 'activities-to-complete',
      title: 'Données à compléter',
      intro:
        'Retrouvez ici la liste des contentieux pour lesquels aucune donnée, pré-alimentée ou AJUSTée, n’est disponible pour les 12 derniers, les 3 derniers ou pour le seul dernier mois de données, afin que vous puissiez aisément les compléter selon vos besoins.',
    },
    {
      target: 'activities-last-modifications',
      title: 'Dernières modifications',
      intro:
        'Effectuées sur vos données d’activité par les différents agents de la ' +
        (this.isTJ() ? 'juridiction' : "cour d'appel") +
        " utilisateurs d'A-JUST.",
    },
  ]

  lastStep: IntroJSStep = {
    target: '.contact-us',
    title: 'Je passe à la suite :',
    intro:
      'Nous vous conseillons de commencer par renseigner la situation de vos agents. Rendez-vous sur le ventilateur !<div class="intro-js-action"><a href="/ventilations">J\'accède au ventilateur</a></div>',
  }

  /**
   * Constructor
   */
  constructor(
    public userService: UserService,
    public humanResourceService: HumanResourceService
  ) {
    super()
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  ngOnInit() {
    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
        this.canViewContractuel = userCanViewContractuel(u)
        this.canViewVentilation = this.userService.canViewVentilation()
        this.canViewActivities = this.userService.canViewActivities()

        if (this.userService.isCa())
          this.introSteps = [...this.introSteps, this.lastStep]
        else
          this.introSteps = [
            ...this.introSteps,
            ...this.stepsOnlyForTJ,
            this.lastStep,
          ]

        try {
          // @ts-ignore
          this.introSteps[this.introSteps.length - 1]['actions'][
            'onClickToIntro'
          ].enable = this.canViewVentilation
        } catch (err) {}
      })
    )

    this.watch(
      this.humanResourceService.hrBackup.subscribe(
        (hrBackup: BackupInterface | null) => {
          this.backupId = hrBackup?.id || null
          if (this.canViewVentilation) {
            this.onFilterList(hrBackup)
          }
        }
      )
    )
  }

  /**
   * Après le rendu HTML du composant
   */
  ngAfterViewInit() {
    this.listenScrollEvent()
  }

  /**
   * Listen scroll event to catch the title position
   */
  listenScrollEvent() {
    if (this.domContainer && this.domContainer.nativeElement) {
      this.domContainer.nativeElement.addEventListener('scroll', () => {
        this.controlScrollPosition()
      })

      this.controlScrollPosition()
    } else {
      setTimeout(() => {
        this.listenScrollEvent()
      }, 500)
    }
  }

  /**
   * Control la position du scroll pour l'action des onglets
   */
  controlScrollPosition() {
    if (
      this.domContainer?.nativeElement &&
      this.domTitleActivities?.nativeElement &&
      this.domHeader?.nativeElement
    ) {
      const headerBottom =
        this.domHeader.nativeElement.getBoundingClientRect().bottom
      const titleTop =
        this.domTitleActivities.nativeElement.getBoundingClientRect().top
      this.titleSelectActivities = headerBottom >= titleTop
    }
  }

  /**
   * Filtre liste RH
   */
  onFilterList(backup: BackupInterface | null = null) {
    if (!backup) {
      return
    }

    this.isLoading = true
    this.categoriesFiltered = null

    this.humanResourceService
      .onFilterList(
        this.humanResourceService.backupId.getValue() || 0,
        this.dateSelected,
        null,
        [1, 2, 3]
      )
      .then(({ allPersons, list }) => {
        this.listFormated = list.map((l: any) => ({
          ...l,
          hr: l.hr.map((h: any) => ({
            ...h,
            dateSart: h.dateStart ? new Date(h.dateSart) : null,
            dateEnd: h.dateEnd ? new Date(h.dateEnd) : null,
          })),
        }))
        this.allPersons = allPersons.map((p: any) => ({
          ...p,
          dateSart: p.dateStart ? new Date(p.dateSart) : null,
          dateEnd: p.dateEnd ? new Date(p.dateEnd) : null,
        }))
        this.formatDatasToVisualise()
      })
  }

  /**
   * Format datas to visualise
   */
  formatDatasToVisualise() {
    let hrList: HumanResourceSelectedInterface[] = []

    hrList = this.allPersons.filter(
      (hr) =>
        this.categoriesFiltered === null ||
        (this.categoriesFiltered &&
          this.categoriesFiltered.length &&
          hr?.category &&
          this.categoriesFiltered[0] === hr?.category.id)
    )

    const contentieux = this.humanResourceService.contentieuxReferentielOnly
      .getValue()
      .map((contentieux) => contentieux.id)

    hrList.map((hr) => {
      const activityPercent = sumBy(
        (hr.currentActivities || []).filter((c) =>
          contentieux.includes(c.contentieux.id)
        ),
        'percent'
      )

      hr.totalAffected = this.fixDecimal(activityPercent)
      hr.currentActivities = (hr.currentActivities || []).filter((c) =>
        contentieux.includes(c.contentieux.id)
      )
    })

    let fifteenDaysLater = today(this.dateSelected)
    fifteenDaysLater.setDate(fifteenDaysLater.getDate() + 15)
    let fifteenDaysBefore = today(this.dateSelected)
    fifteenDaysBefore.setDate(fifteenDaysBefore.getDate() - 15)
    this.listDepartures = []
    this.listArrivals = []
    this.listUnavailabilities = []
    for (let i = 0; i < hrList.length; i++) {
      const hr = hrList[i]

      // Indisponibilité
      if (hr.indisponibilities.length > 0) {
        const list = hr.indisponibilities.filter(
          (elem) =>
            today(elem.dateStart).getTime() >= fifteenDaysBefore.getTime() &&
            today(elem.dateStart).getTime() <= fifteenDaysLater.getTime()
        )
        if (list.length && !this.listUnavailabilities.includes(hr)) {
          this.listUnavailabilities.push(hr)
        }
      }

      // Arrivé
      if (hr.dateStart) {
        if (
          today(hr.dateStart).getTime() >= fifteenDaysBefore.getTime() &&
          today(hr.dateStart).getTime() <= fifteenDaysLater.getTime()
        ) {
          if (!this.listArrivals.includes(hr)) {
            this.listArrivals.push(hr)
          }
        }
      }

      //Départ
      if (hr.dateEnd) {
        if (
          today(hr.dateEnd).getTime() >= fifteenDaysBefore.getTime() &&
          today(hr.dateEnd).getTime() <= fifteenDaysLater.getTime()
        ) {
          if (!this.listDepartures.includes(hr)) {
            this.listDepartures.push(hr)
          }
        }
      }
    }

    this.totalWorkforce =
      this.listDepartures.length +
      this.listArrivals.length +
      this.listUnavailabilities.length
    this.isLoading = false
  }

  /**
   * Récuperer le type de l'app
   */
  getInterfaceType() {
    return this.userService.interfaceType === 1
      ? "cour d'appel"
      : 'tribunal judiciaire'
  }

  isTJ() {
    return this.userService.interfaceType !== 1
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Selection des categories pour filtrer les visualisations
   */
  onSelectCategories(category: number | null = null) {
    if (
      category === null ||
      (this.categoriesFiltered && this.categoriesFiltered[0] === category)
    ) {
      this.categoriesFiltered = null
    } else {
      this.categoriesFiltered = [category]
    }

    this.formatDatasToVisualise()
  }
}
