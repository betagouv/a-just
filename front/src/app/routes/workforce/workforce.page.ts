import { Component, inject, OnDestroy, OnInit } from '@angular/core'
import { orderBy, sortBy, sumBy, union } from 'lodash'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { FilterPanelComponent, FilterPanelInterface } from './filter-panel/filter-panel.component'
import { debounceTime } from 'rxjs'
import { HumanResourceInterface } from '../../interfaces/human-resource-interface'
import { HRSituationInterface } from '../../interfaces/hr-situation'
import { HRFonctionInterface } from '../../interfaces/hr-fonction'
import { HRCategoryInterface, HRCategorypositionInterface, HRCategorySelectedInterface } from '../../interfaces/hr-category'
import { RHActivityInterface } from '../../interfaces/rh-activity'
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel'
import { WrapperComponent } from '../../components/wrapper/wrapper.component'
import { DateSelectComponent } from '../../components/date-select/date-select.component'
import { RadioButtonComponent } from '../../components/radio-button/radio-button.component'
import { CommonModule } from '@angular/common'
import { PersonPreviewComponent } from './person-preview/person-preview.component'
import { InputButtonComponent } from '../../components/input-button/input-button.component'
import { MainClass } from '../../libs/main-class'
import { childrenInterface, dataInterface } from '../../components/select/select.component'
import { BackupInterface } from '../../interfaces/backup'
import { DocumentationInterface } from '../../interfaces/documentation'
import { OPACITY_20 } from '../../constants/colors'
import { HumanResourceService } from '../../services/human-resource/human-resource.service'
import { ReferentielService } from '../../services/referentiel/referentiel.service'
import { WorkforceService } from '../../services/workforce/workforce.service'
import { UserService } from '../../services/user/user.service'
import { HRFonctionService } from '../../services/hr-fonction/hr-function.service'
import { FILTER_LIMIT_ON_SEARCH } from '../../constants/workforce'
import { fixDecimal } from '../../utils/numbers'
import { sortDates, today } from '../../utils/dates'
import { MatIconModule } from '@angular/material/icon'
import { FormsModule } from '@angular/forms'
import { EmptyInputComponent } from '../../components/empty-input/empty-input.component'
import { AppService } from '../../services/app/app.service'
import { IntroJSStep } from '../../services/tour/tour.service'

/**
 * Interface d'une fiche avec ses valeurs rendu
 */
export interface HumanResourceIsInInterface extends HumanResourceInterface {
  /**
   * Est présent dans l'interface
   */
  isIn: boolean
  /**
   * Category name
   */
  categoryName?: string
  /**
   * Category rank
   */
  categoryRank?: number | null
  /**
   * Fonction rank
   */
  fonctionRank?: number | null
  /**
   * Categorie de la personne
   */
  category?: HRCategoryInterface
}

/**
 * Interface d'une fiche avec ses valeurs rendu
 */
export interface HumanResourceSelectedInterface extends HumanResourceInterface {
  /**
   * Prénom de l'agent
   */
  firstName?: string
  /**
   * Nom de l'agent
   */
  lastName?: string
  /**
   * Total d'affectation
   */
  totalAffected?: number
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
   * ETP a la date sélectionnée
   */
  etp: number
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
}

/**
 * Liste des fiches d'une catégories
 */
export interface listFormatedInterface {
  /**
   * Couleur de la categories
   */
  textColor: string
  /**
   * Couleur de fond de la categories
   */
  bgColor: string
  /**
   * Couleur de fond de la categories
   */
  hoverColor: string
  /**
   * Nom de la catégorie (pluriel ou non)
   */
  label: string
  /**
   * Liste des fiches
   */
  hr: HumanResourceSelectedInterface[]
  /**
   * Liste des fiches après filtres
   */
  hrFiltered: HumanResourceSelectedInterface[]
  /**
   * Reférentiel avec les calcules d'etp, couverture propre à la catégorie
   */
  referentiel: ContentieuReferentielInterface[]
  /**
   * Id de la categorie
   */
  categoryId: number
}

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  standalone: true,
  imports: [
    WrapperComponent,
    DateSelectComponent,
    FilterPanelComponent,
    RadioButtonComponent,
    CommonModule,
    PersonPreviewComponent,
    InputButtonComponent,
    RouterLink,
    MatIconModule,
    FormsModule,
    EmptyInputComponent,
  ],
  templateUrl: './workforce.page.html',
  styleUrls: ['./workforce.page.scss'],
})
export class WorkforcePage extends MainClass implements OnInit, OnDestroy {
  humanResourceService = inject(HumanResourceService)
  referentielService = inject(ReferentielService)
  route = inject(ActivatedRoute)
  router = inject(Router)
  workforceService = inject(WorkforceService)
  userService = inject(UserService)
  hrFonctionService = inject(HRFonctionService)
  appService = inject(AppService)
  /**
   * Liste de toutes les RH
   */
  allHumanResources: HumanResourceInterface[] = []
  /**
   * Liste de toutes les personnes quelque soit l'arrivée ou le départ
   */
  allPersons: HumanResourceIsInInterface[] = []
  /**
   * Liste de toutes les personnes quelque soit l'arrivée ou le départ
   */
  allPersonsFiltered: HumanResourceIsInInterface[] | null = null
  /**
   * Liste de toutes les personnes visibles
   */
  allPersonsFilteredIsIn: HumanResourceIsInInterface[] = []
  /**
   * Liste de toutes les personnes non visibles
   */
  allPersonsFilteredNotIn: HumanResourceIsInInterface[] = []
  /**
   * Formated RH
   */
  preformatedAllHumanResource: HumanResourceSelectedInterface[] = []
  /***
   * RH
   */
  humanResources: HumanResourceSelectedInterface[] = []
  /**
   * RH filtrés
   */
  humanResourcesFilters: HumanResourceSelectedInterface[] = []
  /**
   * Contentieux
   */
  referentiel: ContentieuReferentielInterface[] = []
  /**
   * Liste des référentiels
   */
  formReferentiel: dataInterface[] = []
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
   * Identifiants des sous contentieux selectionnés
   */
  selectedSubReferentielIds: number[] | null = null
  /**
   * Valeur du champs recherche
   */
  searchValue: string = ''
  /**
   * Liste des RH trouvées
   */
  valuesFinded: HumanResourceInterface[] | null = null
  /**
   * Indice des valeurs trouvées suite à une recherche
   */
  indexValuesFinded: number = 0
  /**
   * Backup des RH
   */
  hrBackup: BackupInterface | null = null
  /**
   * Date selectionnée
   */
  dateSelected: Date = this.workforceService.dateSelected.getValue()
  /**
   * Liste formatée contenant l'ensemble des informations nécessaire au chargement de la page
   */
  listFormated: listFormatedInterface[] = []
  /**
   * Liste des filtres selectionnés
   */
  filterSelected: {
    filter: ContentieuReferentielInterface | null
    up: boolean | null
  } = { filter: null, up: null }
  /**
   * Affichage du panneau de selection de filtre
   */
  showFilterPanel: boolean = false
  /**
   * Paramètres de filtre selectionnés
   */
  filterParams: FilterPanelInterface | null = this.workforceService.filterParams
  /**
   * Accès au réafectateur
   */
  canViewReaffectator: boolean = false
  hasTrackedVentilationView: boolean = false
  /**
   * Documentation module
   */
  documentation: DocumentationInterface = {
    title: 'Le ventilateur :',
    path: this.userService.isCa()
      ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/ventilateur/quest-ce-que-cest'
      : 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/ventilateur/quest-ce-que-cest',
    printSubTitle: true,
  }
  /**
   * En cour de chargement
   */
  isLoading: boolean = false
  /**
   * Poste string
   */
  listPoste = ['titulaire', 'placé', 'contractuel']
  /**
   * Opacité pour les background des contentieux
   */
  OPACITY = OPACITY_20
  /**
   * Intro JS Steps
   */
  introSteps: IntroJSStep[] = this.isTJ()
    ? [
        {
          target: '#wrapper-contener',
          title: 'A quoi sert le ventilateur ?',
          intro:
            "En renseignant la situation de chacun des agents de votre juridiction dans une fiche individuelle, cette fonctionnalité vous permet de <b>visualiser en un coup d'œil et à la date de votre choix pour l'ensemble des agents du TJ leur ETPT réel et l'affectation de chacun</b> sur les différents contentieux.",
        },
        {
          target: '.header-list',
          title: 'Liste des contentieux',
          intro:
            "Retrouvez ici la <b>liste des contentieux</b> traités par la juridiction et sur lesquels vos agents sont mobilisés. Une fois leur fiche individuelle renseignée, vous pourrez visualiser le <b>volume global d'ETPT</b> affecté par votre juridiction au <b>traitement de chaque type d'activité</b> par <b>catégorie d'agent</b>.",
        },
        {
          target: '.step-3 > .title',
          title: "Le calendrier, le choix des contentieux et le nombre d'agents",
          intro:
            "En <b>modifiant la date dans le calendrier</b>, affichez <b>la liste des agents présents</b> et les <b>ETPT mobilisés sur les différents contentieux</b> à la date choisie. Vous pouvez aussi <b>choisir</b> de n'afficher que les données d'ETPT relatives à <b>certains contentieux</b>.",
        },
        {
          target: '.header-list .filter-button',
          title: 'Filtrer et trier',
          intro:
            "Vous avez la possibilité de <b>filtrer</b> cette liste d'agents par fonction, la <b>trier</b> par <b>nom</b>, <b>fonction</b>, <b>date de mise à jour ou taux d'affectation</b> et de <b>modifier l'affichage</b> des agents d'abord par nom ou par prénom.",
        },
        {
          target: 'person-preview',
          title: 'Ajuster une fiche en cliquant directement sur celle-ci',
          intro:
            "Vous pourrez ainsi modifier les <b>nom</b>, <b>prénom</b>, <b>matricule</b> et <b>date d'arrivée</b> ou de départ de la juridiction d'un agent, en saisissant les nouvelles valeurs directement dans les champs concernés. Vous aurez également la possibilité d'ajouter un commentaire et des indisponibilités.<br/><br/>Dans ces fiches agents, vous pourrez <b>renseigner ou modifier la répartition en pourcentage du temps de travail</b> de chaque agent sur les différents contentieux ou sous-contentieux qu'il traite.<br/><br/>Dès lors, plus besoin de faire de calculs d'ETPT en proportion du temps de travail ou de la <b>date d’arrivée</b> dans la juridiction : A-JUST s’en chargera pour vous !",
        },
        {
          target: '.search-zone',
          title: 'Rechercher un agent :',
          intro:
            "Le <b>champ dédié en haut à droite</b> de l'écran vous permet de <b>trouver rapidement la fiche d'un agent</b> (même s'il a quitté votre juridiction). Pour cela, il vous suffit de saisir son nom ou son prénom et de cliquer sur la fiche proposée.",
        },
        {
          target: '.add-collaborator',
          title: 'Ajouter un nouvel agent :',
          intro:
            "Vous pouvez ajouter un agent s'il n'est pas dans les effectifs présents dans A-JUST. <br/><br/>Renseignez les informations demandées, une date d'arrivée et de départ lors que celle-ci est connue. Vous pouvez effectuer une première ventilation ; pensez à <b>vérifier que votre taux d'affectation est de 100%</b> à l’aide de la barre de remplissage située sous les contentieux.",
        },
        {
          target: '.menu-item.tools',
          //target: '.menu .sub-tools > p:nth-child(2n)',
          title: 'Découvrez nos outils :',
          intro:
            "Téléchargeable dans chaque fiche agent, la <b>calculatrice</b> vous permet d'obtenir rapidement le pourcentage de temps de travail qu’un agent (magistrat, ou fonctionnaire) consacre à une activité.<br/><br/>La <b>nomenclature</b> permet par les codes NAC de connaître la nature des affaires prises en compte dans un sous-contentieux : c'est la colonne vertébrale d'A-JUST !",
          /*intro:
        "vous permet de convertir en <b>pourcentage d'ETPT la part de temps de travail</b> qu'un agent consacre à une activité.",
        beforeLoad: async (intro: any) => {
          const subTools = document.querySelector('.menu .sub-tools')
          if(!subTools) {
            const itemToClick = document.querySelector('.menu-item.tools')
            if(itemToClick) {
              // @ts-ignore
              itemToClick.click()
              await sleep(200)
            }
          }
        }*/
        },
        {
          target: '.menu-item.tools',
          //target: '.menu .sub-tools > p:nth-child(3n)',
          title: "L'extracteur d'ETPT :",
          intro:
            "Choisissez la <b>période</b> et la <b>catégorie d'agents souhaitées</b> et obtenez toutes ces informations dans un <b>fichier Excel</b> que vous pourrez utiliser pour simplifier l'exercice annuel des déclaratifs d'ETPT",
        },
      ]
    : [
        {
          target: '#wrapper-contener',
          title: 'A quoi sert le ventilateur ?',
          intro:
            "En renseignant la situation de chacun des agents de votre cour d'appel dans une fiche individuelle, cette fonctionnalité vous permet de <b>visualiser en un coup d'œil et à la date de votre choix pour l'ensemble des agents de la CA leur ETPT réel et l'affectation de chacun</b> sur les différents contentieux.",
        },
        {
          target: '.header-list',
          title: 'Liste des contentieux',
          intro:
            "Retrouvez ici la <b>liste des contentieux</b> traités par la cour d'appel et sur lesquels vos agents sont mobilisés. Une fois leur fiche individuelle renseignée, vous pourrez visualiser le <b>volume global d'ETPT</b> affecté par votre juridiction au <b>traitement de chaque type d'activité</b> par <b>catégorie d'agent</b>.",
        },
        {
          target: '.header-list .filter-button',
          title: 'Filtrer et trier',
          intro:
            "Vous avez la possibilité de <b>filtrer</b> cette liste d'agents par fonction, la <b>trier</b> par <b>nom</b>, <b>fonction</b>, <b>date de mise à jour ou taux d'affectation</b> et de <b>modifier l'affichage</b> des agents d'abord par nom ou par prénom.",
        },
        {
          target: 'person-preview',
          title: 'Ajuster une fiche en cliquant directement sur celle-ci',
          intro:
            "Vous pourrez ainsi modifier les <b>nom</b>, <b>prénom</b>, <b>matricule</b> et <b>date d'arrivée</b> ou de départ de la juridiction d'un agent, en saisissant les nouvelles valeurs directement dans les champs concernés. Vous aurez également la possibilité d'ajouter un commentaire et des indisponibilités.<br/><br/>Dans ces fiches agents, vous pourrez <b>renseigner ou modifier la répartition en pourcentage du temps de travail</b> de chaque agent sur les différents contentieux ou sous-contentieux qu'il traite.<br/><br/>Dès lors, plus besoin de faire de calculs d'ETPT en proportion du temps de travail ou de la <b>date d’arrivée</b> dans la juridiction : A-JUST s’en chargera pour vous !",
        },
        {
          target: '.search-zone',
          title: 'Rechercher un agent :',
          intro:
            "Le <b>champ dédié en haut à droite</b> de l'écran vous permet de <b>trouver rapidement la fiche d'un agent</b> (même s'il a quitté votre juridiction). Pour cela, il vous suffit de saisir son nom ou son prénom et de cliquer sur la fiche proposée.",
        },
        {
          target: '.add-collaborator',
          title: 'Ajouter un nouvel agent :',
          intro:
            "Vous pouvez ajouter un agent s'il n'est pas dans les effectifs présents dans A-JUST. <br/><br/>Renseignez les informations demandées, une date d'arrivée et de départ lors que celle-ci est connue. Vous pouvez effectuer une première ventilation ; pensez à <b>vérifier que votre taux d'affectation est de 100%</b> à l’aide de la barre de remplissage située sous les contentieux.",
        },
        {
          target: '.menu-item.tools',
          //target: '.menu .sub-tools > p:nth-child(2n)',
          title: 'Découvrez nos outils :',
          intro:
            "Téléchargeable dans chaque fiche agent, la <b>calculatrice</b> vous permet d'obtenir rapidement le pourcentage de temps de travail qu’un agent (magistrat, ou fonctionnaire) consacre à une activité.",
        },
      ]

  /**
   * Constructor
   */
  constructor() {
    super()
  }

  /**
   * Initialisation du composent
   */
  ngOnInit() {
    if (!this.userService.canViewVentilation()) {
      this.userService.redirectToHome()
    }

    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((ref: ContentieuReferentielInterface[]) => {
        this.referentiel = ref.filter((a) => this.referentielService.idsIndispo.indexOf(a.id) === -1).map((r) => ({ ...r, selected: true }))

        this.formReferentiel = this.referentiel.map((r) => ({
          id: r.id,
          value: this.userService.referentielMappingNameByInterface(r.label),
          childrens: (r.childrens || []).map((c) => ({
            id: c.id,
            value: this.userService.referentielMappingNameByInterface(c.label),
          })),
        }))

        this.selectedReferentielIds = this.humanResourceService.selectedReferentielIds
        this.selectedSubReferentielIds = this.humanResourceService.selectedSubReferentielIds

        this.onFilterList(false, true, true)
      }),
    )
    this.watch(
      this.humanResourceService.categories.subscribe((categories) => {
        this.categoriesFilterListIds = this.humanResourceService.categoriesFilterListIds

        this.categoriesFilterList = categories.map((c) => {
          let selected = true

          if (this.categoriesFilterListIds.length === categories.length) {
            const { c: categoryId } = this.route.snapshot.queryParams
            if (categoryId && c.id !== +categoryId) {
              selected = false
            }
          } else {
            selected = this.categoriesFilterListIds.indexOf(c.id) !== -1
          }

          return {
            ...c,
            selected,
            headerLabel: c.label && c.label === 'Magistrat' ? 'Siège' : c.label,
            label: c.label && c.label === 'Magistrat' ? 'magistrat' : 'agent',
            labelPlural: c.label && c.label === 'Magistrat' ? 'magistrats' : 'agents',
            etpt: 0,
            nbPersonal: 0,
            openSubMenu: false,
            poste: [
              {
                name: 'titulaire',
                selected: true,
                etpt: 0,
                nbPersonal: 0,
              },
              {
                name: 'placé',
                selected: true,
                etpt: 0,
                nbPersonal: 0,
              },
              {
                name: 'contractuel',
                selected: true,
                etpt: 0,
                nbPersonal: 0,
              },
            ],
          }
        })

        this.onFilterList()
      }),
    )
    this.watch(
      this.humanResourceService.hrBackup.subscribe((hrBackup: BackupInterface | null) => {
        this.hrBackup = hrBackup
        if (hrBackup && !this.hasTrackedVentilationView) {
          this.hasTrackedVentilationView = true
          this.humanResourceService.trackVentilationView(hrBackup.id)
        }
        this.onFilterList()
      }),
    )
    this.route.queryParams.pipe(debounceTime(300)).subscribe((params) => {
      const { c: categoryId } = params

      if (categoryId) {
        this.categoriesFilterList = this.categoriesFilterList.map((c) => {
          let selected = true
          if (categoryId && c.id !== +categoryId) {
            selected = false
          }

          return {
            ...c,
            selected,
          }
        })

        this.onFilterList()
      }
    })

    const user = this.userService.user.getValue()
    this.canViewReaffectator = user && user.access && user.access.indexOf(7) !== -1 ? true : false
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy() {
    this.listFormated = []
    this.watcherDestroy()
  }

  /**
   * Detect is TJ
   * @returns
   */
  isTJ() {
    return this.userService.interfaceType !== 1
  }

  /**
   * Maj de catégorie filtrée
   */
  updateCategoryValues() {
    this.categoriesFilterList = this.categoriesFilterList.map((c) => {
      const formatedList = this.listFormated.find((l) => l.categoryId === c.id)
      let personal: any = []
      let etpt = 0
      let subTotalEtp: { [key: string]: { etpt: number; total: number } } = this.humanResourceService.calculateSubCategories(formatedList?.hrFiltered || [])

      if (formatedList) {
        personal = formatedList.hrFiltered

        personal.map((h: any) => {
          let realETP = (h.etp || 0) - h.hasIndisponibility
          if (realETP < 0) {
            realETP = 0
          }
          etpt += realETP
        })
      }

      const posteList = c.poste.map((f: HRCategorypositionInterface) => {
        return {
          ...f,
          name: f.name,
          etpt: fixDecimal(subTotalEtp[f.name].etpt),
          nbPersonal: personal.filter((x: any) => x.fonction?.position === f.name.charAt(0).toUpperCase() + f.name.slice(1)).length,
        }
      })

      return {
        ...c,
        etpt,
        nbPersonal: personal.length,
        poste: posteList,
      }
    })
    this.calculateTotalAffected()
  }

  /**
   * Ajout d'une RH
   */
  async addHR() {
    const newId = await this.humanResourceService.createHumanResource(this.dateSelected)
    this.route.snapshot.fragment = newId + ''
    this.router.navigate(['/resource-humaine', newId])
  }

  /**
   * Retourne l'id d'un élément
   * @param index
   * @param item
   * @returns
   */
  trackById(index: number, item: any) {
    console.log('item', item)
    return index
  }

  /**
   * Gestion de l'opacité pour une RH
   * @param hr
   * @returns
   */
  checkHROpacity(hr: HumanResourceInterface) {
    const name =
      this.filterParams && this.filterParams.display === 'nom/prénom'
        ? (hr.lastName || '') + ' ' + (hr.firstName || '')
        : (hr.firstName || '') + ' ' + (hr.lastName || '')
    if (!this.searchValue || name.toLowerCase().includes(this.searchValue.toLowerCase())) {
      return 1
    }

    return 0.5
  }

  /**
   * Recherche de RH
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
    this.valuesFinded = this.valuesFinded?.filter((x: any) => (this.humanResourceService.categoriesFilterListIds || []).includes(x.category.id)) || []
    this.indexValuesFinded = 0

    this.allPersonsFiltered = null
    let list = [...this.allPersons]
    list = list.filter((h) => this.checkHROpacity(h) === 1)
    if (list.length <= FILTER_LIMIT_ON_SEARCH && this.allPersons.length !== list.length) {
      if (this.allPersons.length !== list.length && this.valuesFinded && this.valuesFinded.length) {
        this.onGoTo(this.valuesFinded[this.indexValuesFinded].id)
      }

      let allPersonIds: number[] = []
      this.listFormated.map((l) => {
        allPersonIds = allPersonIds.concat(l.hrFiltered.map((h) => h.id))
      })

      this.allPersonsFiltered = [
        ...list.map((person) => {
          return {
            ...person,
            isIn: allPersonIds.includes(person.id),
          }
        }),
      ]
    }

    console.log('this.allPersonsFiltered', this.allPersonsFiltered)

    this.allPersonsFilteredIsIn = this.filterFindedPerson(this.allPersonsFiltered, true)
    this.allPersonsFilteredNotIn =
      this.filterFindedPerson(this.allPersonsFiltered, false)?.filter((x: any) =>
        (this.humanResourceService.categoriesFilterListIds || []).includes(x.category.id),
      ) || []
  }

  /**
   * Vérifie si un agent arrive bientôt ou est déjà parti de la juridiction
   * @param date
   * @returns
   */
  isArriving(date: Date | string, person: HumanResourceIsInInterface | null = null): boolean {
    const now = today(this.dateSelected)

    const diff = sortDates(date, now, false)

    return diff > 0 ? true : false
  }

  /**
   * Vérifie si un agent arrive bientôt ou est déjà parti de la juridiction
   * @param date
   * @returns
   */
  hasLeft(date: Date | undefined): boolean {
    if (date === undefined || date === null) {
      return false
    }

    const now = new Date(this.dateSelected)

    const diff = sortDates(date, now, false)

    return diff < 0 ? true : false
  }

  /**
   * force to change filter values
   */
  async onSelectCategory(category: HRCategorySelectedInterface) {
    this.isLoading = true
    if (category.selected && this.filterParams && this.filterParams.filterValues) {
      const fonctions = await this.hrFonctionService.getAll()
      const getIdOfFonctions = fonctions.filter((f) => category.id === f.categoryId).map((f) => f.id)
      const filterValues = (this.filterParams && this.filterParams.filterValues) || []

      getIdOfFonctions.map((fId) => {
        if (!filterValues.includes(fId)) {
          filterValues.push(fId)
        }
      })
      this.filterParams!.filterValues = filterValues
    }

    this.categoriesFilterList.map((cat) => {
      cat.poste.map(async (position) => {
        if (cat.id === category.id) {
          position.selected = category.selected
          await this.switchSubFilter(cat, position)
        }
      })
    })

    this.onFilterList()
  }

  /**
   * Filtre liste RH
   */
  onFilterList(memorizeScroolPosition = false, keepEmptyVentilation = true, isFirstLoad = false) {
    if (!this.categoriesFilterList.length || !this.referentiel.length || !this.hrBackup) {
      return
    }

    let scrollPosition: number | null = null

    this.humanResourceService.categoriesFilterListIds = this.categoriesFilterList.filter((c) => c.selected).map((c) => c.id) // copy to memoryse selection
    let selectedReferentielIds: number[] | null = null
    if (this.formReferentiel.length !== this.selectedReferentielIds.length) {
      selectedReferentielIds = this.selectedReferentielIds
    }

    let selectedSubReferentielIds: number[] | null = []
    this.formReferentiel.map((cont) => {
      if (!this.selectedReferentielIds || (this.selectedReferentielIds || []).find((refId) => refId === cont.id)) {
        selectedSubReferentielIds = [...(selectedSubReferentielIds || []), ...(cont.childrens || []).map((c) => c.id)]
      }
    })
    if (
      isFirstLoad ||
      !this.selectedSubReferentielIds ||
      (selectedSubReferentielIds && selectedSubReferentielIds.length === this.selectedSubReferentielIds.length)
    ) {
      selectedSubReferentielIds = null
    } else {
      selectedSubReferentielIds = this.selectedSubReferentielIds
    }

    this.isLoading = true
    this.appService.appLoading.next(true)
    this.humanResourceService
      .onFilterList(
        this.humanResourceService.backupId.getValue() || 0,
        this.dateSelected,
        selectedReferentielIds,
        selectedSubReferentielIds,
        this.humanResourceService.categoriesFilterListIds,
      )
      .then(({ list, allPersons }: { list: listFormatedInterface[]; allPersons: HumanResourceIsInInterface[] }) => {
        this.listFormated = list.map((l) => {
          return {
            ...l,
            id: '0' + l.categoryId + '_' + l.label,
          }
        })
        this.allPersons = allPersons

        this.findPersonWithoutVentilations()

        this.orderListWithFiltersParams()

        this.isLoading = false
        this.appService.appLoading.next(false)

        const domContent = document.getElementById('container-list')
        if (domContent) {
          if (scrollPosition !== null) {
            domContent.scrollTop = scrollPosition
          } else {
            domContent.scrollTop = 0
          }
        }
      })
      .finally(() => {
        this.appService.appLoading.next(false)
      })

    if (this.route.snapshot.fragment) {
      this.onGoTo(+this.route.snapshot.fragment)
    }
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
        console.log('person', person)
        this.listFormated.map((l) => {
          if (l.categoryId === person.category?.id && !l.hr.find((h) => h.id === person.id)) {
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
              etp: 0,
              fonction: person.situations[0].fonction,
              currentSituation: null,
              category: person.situations[0].category,
            }
            l.hrFiltered = l.hrFiltered || []
            l.hrFiltered.push(newPerson)
            l.hrFiltered = sortBy(l.hrFiltered, 'fonction.rank')
            l.hr = l.hr || []
            l.hr.push(newPerson)
            l.hr = sortBy(l.hr, 'fonction.rank')
          }
        })
      })
  }

  /**
   * Ordonner une liste de RH
   */
  orderListWithFiltersParams(up: boolean | null = null) {
    this.listFormated = this.listFormated.map((list) => {
      let listFiltered = [...list.hr]
      if (this.filterParams) {
        if (this.filterParams.filterFunction) {
          listFiltered = this.filterParams.filterFunction(listFiltered)
        }

        if (this.filterParams.sortFunction) {
          listFiltered = this.filterParams.sortFunction(listFiltered)
        }

        if (this.filterParams.order && this.filterParams.order === 'desc') {
          listFiltered = listFiltered.reverse()
        }

        if (this.getOptionAffichageIndispoString()) {
          listFiltered = listFiltered.filter(
            (h) =>
              h.indisponibilities &&
              h.indisponibilities.length &&
              h.indisponibilities.some((i) => (this.filterParams?.filterIndispoValues || []).includes(i.contentieux.id)),
          )
        }
      }

      list.hrFiltered = listFiltered

      if (this.filterSelected) {
        list.hrFiltered = orderBy(
          list.hrFiltered,
          (h) => {
            const acti = (h.currentActivities || []).find((a) => a.contentieux?.id === this.filterSelected.filter?.id)
            return acti ? acti.percent || 0 : 0
          },
          [up ? 'asc' : 'desc'],
        )
      }

      return list
    })

    this.updateCategoryValues()
    this.onSearchBy()
  }

  /**
   * Scroll jusqu'à une RH donnée en paramètre
   * @param hrId identifiant d'une ressource
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
          const mainTop = findContainer.getBoundingClientRect().top
          let topDelta = mainTop
          for (let i = 0; i < headers.length; i++) {
            const topHeader = headers[i].getBoundingClientRect().top
            if (topHeader === mainTop || topHeader < top) {
              topDelta += headers[i].getBoundingClientRect().height
              break
            }
          }

          let scrollTop = top - topDelta + findContainer.scrollTop - 8

          isFinded = true
          findContainer.scroll({
            behavior: 'smooth',
            top: scrollTop,
          })
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
   * Trouver la RH suivante dans la liste de recherche
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
   * Contentieux ids selectionnés
   */
  onSelectedReferentielIdsChanged({ list = [], subList = [] }: { list: number[]; subList: number[] }) {
    this.selectedReferentielIds = list
    this.humanResourceService.selectedReferentielIds = this.selectedReferentielIds

    console.log('subList', subList)

    this.selectedSubReferentielIds = [...subList]
    this.humanResourceService.selectedSubReferentielIds = this.selectedSubReferentielIds

    this.referentiel = this.referentiel.map((cat) => {
      cat.selected = list.indexOf(cat.id) !== -1

      return cat
    })

    this.onFilterList(true, false)
  }

  /**
   * Changement de date du ventilateur
   * @param date
   */
  onDateChanged(date: any) {
    this.dateSelected = date
    this.workforceService.dateSelected.next(date)
    this.onFilterList()
  }

  /**
   * Filtrer par contentieux
   * @param ref
   */
  onFilterBy(ref: ContentieuReferentielInterface) {
    if (!this.filterSelected.filter || this.filterSelected.filter?.id !== ref.id || this.filterSelected.up === true) {
      this.filterSelected.filter = ref
      this.filterSelected.up = this.filterSelected.up === null ? true : false
    } else {
      this.filterSelected.filter = null
      this.filterSelected.up = null
    }

    this.orderListWithFiltersParams(this.filterSelected.up)
  }

  /**
   * Maj des paramètres de filtre
   * @param event
   */
  updateFilterParams(event: FilterPanelInterface) {
    this.workforceService.filterParams = event // memorize in cache
    this.filterParams = event
    this.orderListWithFiltersParams()
  }

  /**
   * Reset tri
   */
  clearFilterSort() {
    if (this.filterParams) {
      this.filterParams.sort = null
      this.filterParams.sortName = null
      this.filterParams.sortFunction = null
      this.filterParams.order = null
      this.filterParams.orderIcon = null
    }

    this.orderListWithFiltersParams()
  }

  /**
   * Reset filtre
   */
  clearFilterFilter() {
    if (this.filterParams) {
      this.filterParams.filterNames = null
      this.filterParams.filterValues = null
      this.filterParams.filterFunction = null
    }

    this.orderListWithFiltersParams()
  }

  /**
   * Calcul de l'ETP total
   */
  calculateTotalAffected() {
    this.listFormated = this.listFormated.map((group) => {
      group.referentiel = group.referentiel.map((r) => ({
        ...r,
        totalAffected: 0,
      }))

      const listFiltered = group.hrFiltered || []
      listFiltered.map((hr) => {
        hr.tmpActivities = {}

        group.referentiel = group.referentiel.map((ref) => {
          hr.tmpActivities[ref.id] = hr.currentActivities.filter((r) => r.contentieux && r.contentieux.id === ref.id)
          if (hr.tmpActivities[ref.id].length) {
            const timeAffected = sumBy(hr.tmpActivities[ref.id], 'percent')
            if (timeAffected) {
              let realETP = (hr.etp || 0) - hr.hasIndisponibility
              if (realETP < 0) {
                realETP = 0
              }
              const res = (ref.totalAffected || 0) + (timeAffected / 100) * realETP
              ref.totalAffected = res
            }
          }

          return ref
        })

        return hr
      })

      group.referentiel = group.referentiel.map((ref) => {
        ref.totalAffected = fixDecimal(ref.totalAffected || 0, 1000)
        return ref
      })

      return group
    })
  }

  /**
   * Filtre la liste des personnes trouvées dans la recherche
   * @param list
   * @param isIn
   * @returns
   */
  filterFindedPerson(list: HumanResourceIsInInterface[] | null, isIn: boolean) {
    return (list || []).filter((h) => h.isIn === isIn)
  }

  getCurrentFilteredIds(fonctionsList: HRFonctionInterface[]) {
    if (this.filterParams && this.filterParams.filterValues) {
      return this.filterParams.filterValues as number[]
    } else {
      return fonctionsList.map((f) => f.id)
    }
  }

  async switchSubFilter(category: HRCategorySelectedInterface, poste: HRCategorypositionInterface) {
    this.appService.appLoading.next(true)
    const fonctions = await this.hrFonctionService.getAll()
    let fctFilterIds: number[] = this.getCurrentFilteredIds(fonctions)

    this.listPoste.map(async (position) => {
      if (poste.name === position) {
        //selected fct by position clicked
        const focusFct = fonctions.filter((f) => f.position === position.charAt(0).toUpperCase() + position.slice(1) && f.categoryId === category.id)
        let myArray = null

        const isSelected = poste.selected

        if (!isSelected) {
          myArray = fctFilterIds.filter((el) => !focusFct.map((x) => x.id).includes(el))
        } else {
          myArray = union(
            fctFilterIds,
            focusFct.map((x) => x.id),
          )
        }

        this.filterParams = await {
          display: 'prénom/nom',
          filterFunction: (list: HumanResourceSelectedInterface[]) => {
            return list.filter(
              (h) => h.fonction && this.filterParams && this.filterParams.filterValues && this.filterParams.filterValues.indexOf(h.fonction.id) !== -1,
            )
          },
          filterNames: null,
          filterValues: myArray,
          filterIndispoValues: this.filterParams?.filterIndispoValues || null,
          order: 'asc',
          orderIcon: 'sort-desc',
          sort: 'function',
          sortFunction: null,
          sortName: null,
        }
      }
    })

    if (category.poste && category.poste.length) {
      category.selected = category.poste.some((p) => p.selected)
    }
    this.onFilterList()
    this.orderListWithFiltersParams()
  }

  getTooglePositionSelected(poste: HRCategorypositionInterface) {
    return poste.selected
  }
  async setTooglePositionSelected(category: HRCategorySelectedInterface, poste: HRCategorypositionInterface) {
    poste.selected = !poste.selected
    await this.switchSubFilter(category, poste)
    // PRENDRE EN COMPTE LE TOOGLE POUR SOUSTRAIRE OU RAJOUTER LES FCT
  }

  switchBgColor(category: any, color: string) {
    category.style['background-color'] = color
  }

  /**
   * Retour une string qui affiche les options de filtre / trie
   */
  getOptionAffichageString() {
    const list = []

    if (this.selectedReferentielIds.length !== this.formReferentiel.length) {
      list.push(this.getOptionAffichageReferentielString())
    }

    if (this.selectedSubReferentielIds) {
      let count = 0
      this.formReferentiel.map((cont) => {
        if (!this.selectedReferentielIds || (this.selectedReferentielIds || []).find((refId) => refId === cont.id)) {
          count += (cont.childrens || []).length
        }
      })

      if (this.selectedSubReferentielIds.length !== count) {
        list.push(this.getOptionAffichageSubReferentielString())
      }
    }

    if (this.filterParams && this.filterParams.orderIcon && this.filterParams.sortName) {
      list.push(this.filterParams.sortName)
    }

    if (this.filterParams && this.filterParams.filterNames) {
      list.push(this.filterParams.filterNames)
    }

    const indispString = this.getOptionAffichageIndispoString()
    if (indispString) {
      list.push(indispString)
    }

    return list.length === 0 ? null : list.join(', ')
  }

  /**
   * Retour une string qui affiche les options de filtre / trie
   */
  getOptionAffichageReferentielString() {
    if (this.selectedReferentielIds.length !== this.formReferentiel.length) {
      const labels = this.selectedReferentielIds.map((id) => {
        const ref = this.formReferentiel.find((formRef) => formRef.id === id)
        return ref?.value
      })

      let text = labels.slice(0, 3).join(', ')

      if (labels.length > 3) {
        text += ' et ' + (labels.length - 3) + ' de plus'
      }

      return text
    }

    return null
  }

  /**
   * Retour une string qui affiche les options des sous contentieux
   */
  getOptionAffichageSubReferentielString() {
    if (this.selectedSubReferentielIds) {
      let allSubRefs: childrenInterface[] = []
      this.formReferentiel.map((cont) => {
        if (!this.selectedReferentielIds || (this.selectedReferentielIds || []).find((refId) => refId === cont.id)) {
          allSubRefs = [...allSubRefs, ...(cont.childrens || [])]
        }
      })

      if (this.selectedSubReferentielIds.length !== allSubRefs.length) {
        const labels = this.selectedSubReferentielIds.map((id) => {
          const ref = allSubRefs.find((formRef) => formRef.id === id)
          return ref?.value
        })

        let text = labels.slice(0, 3).join(', ')

        if (labels.length > 3) {
          text += ' et ' + (labels.length - 3) + ' de plus'
        }

        return text
      }
    }

    return null
  }

  /**
   * Retour une string qui affiche les options de filtre / trie des indispo
   */
  getOptionAffichageIndispoString() {
    const allIndisponibilityReferentiel = this.humanResourceService.allIndisponibilityReferentiel
      .slice(1)
      .map((r) => ({ id: r.id, label: r.label.replace(/\//g, ' / ') }))
    const filtre = this.filterParams?.filterIndispoValues || []
    if (filtre.length) {
      const labels = filtre.map((id) => {
        const ref = allIndisponibilityReferentiel.find((f) => f.id === id)
        return ref?.label
      })

      let text = labels.slice(0, 3).join(', ')

      if (labels.length > 3) {
        text += ' et ' + (labels.length - 3) + ' de plus'
      }

      return text
    }

    return null
  }

  clearFilterIndispo() {
    if (this.filterParams) {
      this.filterParams.filterIndispoValues = []
      this.orderListWithFiltersParams()
    }
  }

  /**
   * Supprimer le filtre des contentieux
   */
  clearFilterReferentiel() {
    this.selectedReferentielIds = this.formReferentiel.map((r) => r.id)
    this.selectedSubReferentielIds = []
    this.formReferentiel.map((cont) => {
      if (!this.selectedReferentielIds || (this.selectedReferentielIds || []).find((refId) => refId === cont.id)) {
        this.selectedSubReferentielIds = [...(this.selectedSubReferentielIds || []), ...(cont.childrens || []).map((c) => c.id)]
      }
    })

    this.onSelectedReferentielIdsChanged({
      list: this.selectedReferentielIds,
      subList: this.selectedSubReferentielIds,
    })
  }

  /**
   * Supprimer le filtre des sous contentieux
   */
  clearFilterSubReferentiel() {
    this.selectedSubReferentielIds = []
    this.formReferentiel.map((cont) => {
      if (!this.selectedReferentielIds || (this.selectedReferentielIds || []).find((refId) => refId === cont.id)) {
        this.selectedSubReferentielIds = [...(this.selectedSubReferentielIds || []), ...(cont.childrens || []).map((c) => c.id)]
      }
    })

    this.onSelectedReferentielIdsChanged({
      list: this.selectedReferentielIds,
      subList: this.selectedSubReferentielIds,
    })
  }

  /**
   * Récupération d'une coleur d'une catégorie
   * @param label
   * @param opacity
   * @returns
   */
  public getLocalCategoryColor(person: HumanResourceIsInInterface, opacity: number = 1) {
    if (person.isIn) {
      const currentSituation = this.humanResourceService.findSituation(person, this.workforceService.dateSelected.getValue())
      if (currentSituation && currentSituation.category && currentSituation.category.label) {
        return this.getCategoryColor(currentSituation.category.label || '', opacity)
      }
    }

    return this.getCategoryColor(person.categoryName || '', opacity)
  }
}
