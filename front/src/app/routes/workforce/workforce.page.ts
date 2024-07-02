import { Component, OnDestroy, OnInit } from '@angular/core'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { orderBy, sumBy, union } from 'lodash'
import { MainClass } from 'src/app/libs/main-class'
import {
  HRCategoryInterface,
  HRCategorySelectedInterface,
  HRCategorypositionInterface,
} from 'src/app/interfaces/hr-category'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { BackupInterface } from 'src/app/interfaces/backup'
import { dataInterface } from 'src/app/components/select/select.component'
import { ActivatedRoute, Router } from '@angular/router'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HRSituationInterface } from 'src/app/interfaces/hr-situation'
import { WorkforceService } from 'src/app/services/workforce/workforce.service'
import { FilterPanelInterface } from './filter-panel/filter-panel.component'
import { UserService } from 'src/app/services/user/user.service'
import { DocumentationInterface } from 'src/app/interfaces/documentation'
import { FILTER_LIMIT_ON_SEARCH } from 'src/app/constants/workforce'
import { HRFonctionService } from 'src/app/services/hr-fonction/hr-function.service'
import { fixDecimal } from 'src/app/utils/numbers'
import { debounceTime } from 'rxjs'
import { IntroJSStep } from 'src/app/components/intro-js/intro-js.component'

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
}

/**
 * Interface d'une fiche avec ses valeurs rendu
 */
export interface HumanResourceSelectedInterface extends HumanResourceInterface {
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
  templateUrl: './workforce.page.html',
  styleUrls: ['./workforce.page.scss'],
})
export class WorkforcePage extends MainClass implements OnInit, OnDestroy {
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
  filterSelected: ContentieuReferentielInterface | null = null
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
  /**
   * Documentation module
   */
  documentation: DocumentationInterface = {
    title: 'Le ventilateur :',
    path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/ventilateur/quest-ce-que-cest',
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
   * Intro JS Steps
   */
  introSteps: IntroJSStep[] = this.isTJ() ? [
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
      intro: 'La <b>calculatrice</b> vous permet d\'obtenir rapidement le pourcentage de temps de travail qu’un agent (magistrat, ou fonctionnaire) consacre à une activité.<br/><br/>La <b>nomenclature</b> permet par les codes NAC de connaître la nature des affaires prises en compte dans un sous-contentieux : c\'est la colonne vertébrale d\'A-JUST !'
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
  ] : [
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
      intro: 'La <b>calculatrice</b> vous permet d\'obtenir rapidement le pourcentage de temps de travail qu’un agent (magistrat, ou fonctionnaire) consacre à une activité.<br/>Téléchargeable dans chaque fiche agent.'
    },
  ]

  /**
   * Constructor
   * @param humanResourceService
   * @param referentielService
   * @param route
   * @param router
   * @param workforceService
   * @param userService
   * @param appService
   */
  constructor(
    public humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private route: ActivatedRoute,
    private router: Router,
    private workforceService: WorkforceService,
    public userService: UserService,
    private hrFonctionService: HRFonctionService,
  ) {
    super()
  }

  /**
   * Initialisation du composent
   */
  ngOnInit() {
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(
        (ref: ContentieuReferentielInterface[]) => {
          this.referentiel = ref
            .filter(
              (a) => this.referentielService.idsIndispo.indexOf(a.id) === -1
            )
            .map((r) => ({ ...r, selected: true }))
          this.formReferentiel = this.referentiel.map((r) => ({
            id: r.id,
            value: this.userService.referentielMappingNameByInterface(r.label),
          }))

          this.selectedReferentielIds =
            this.humanResourceService.selectedReferentielIds

          this.onFilterList()
        }
      )
    )
    this.watch(
      this.humanResourceService.categories.subscribe((categories) => {
        this.categoriesFilterListIds =
          this.humanResourceService.categoriesFilterListIds

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
            labelPlural:
              c.label && c.label === 'Magistrat' ? 'magistrats' : 'agents',
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
      })
    )
    this.watch(
      this.humanResourceService.hrBackup.subscribe(
        (hrBackup: BackupInterface | null) => {
          this.hrBackup = hrBackup
          this.onFilterList()
        }
      )
    )
    this.route.queryParams.pipe(debounceTime(300)).subscribe((params) => {
      const { c: categoryId } = params
      console.log('params', params)

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
    this.canViewReaffectator =
      user && user.access && user.access.indexOf(7) !== -1 ? true : false
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy() {
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
      let subTotalEtp: { [key: string]: { etpt: number; total: number } } =
        this.humanResourceService.calculateSubCategories(
          formatedList?.hrFiltered || []
        )

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
          nbPersonal: personal.filter(
            (x: any) =>
              x.fonction?.position ===
              f.name.charAt(0).toUpperCase() + f.name.slice(1)
          ).length,
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
    const newId = await this.humanResourceService.createHumanResource(
      this.dateSelected
    )
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
    return item.id
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
    if (
      !this.searchValue ||
      name.toLowerCase().includes(this.searchValue.toLowerCase())
    ) {
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
    this.indexValuesFinded = 0

    this.allPersonsFiltered = null
    let list = [...this.allPersons]
    list = list.filter((h) => this.checkHROpacity(h) === 1)
    if (
      list.length <= FILTER_LIMIT_ON_SEARCH &&
      this.allPersons.length !== list.length
    ) {
      if (this.valuesFinded && this.valuesFinded.length) {
        this.onGoTo(this.valuesFinded[this.indexValuesFinded].id)
      }

      let allPersonIds: number[] = []
      this.listFormated.map((l) => {
        allPersonIds = allPersonIds.concat(l.hrFiltered.map((h) => h.id))
      })

      this.allPersonsFiltered = list.map((person) => {
        return {
          ...person,
          isIn: allPersonIds.includes(person.id),
        }
      })
    }

    this.allPersonsFilteredIsIn = this.filterFindedPerson(
      this.allPersonsFiltered,
      true
    )
    this.allPersonsFilteredNotIn = this.filterFindedPerson(
      this.allPersonsFiltered,
      false
    )
  }

  /**
   * force to change filter values
   */
  async onSelectCategory(category: HRCategorySelectedInterface) {
    this.isLoading = true
    if (
      category.selected &&
      this.filterParams &&
      this.filterParams.filterValues
    ) {
      const fonctions = await this.hrFonctionService.getAll()
      const getIdOfFonctions = fonctions
        .filter((f) => category.id === f.categoryId)
        .map((f) => f.id)
      const filterValues =
        (this.filterParams && this.filterParams.filterValues) || []

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
  onFilterList() {
    if (
      !this.categoriesFilterList.length ||
      !this.referentiel.length ||
      !this.hrBackup
    ) {
      return
    }

    this.humanResourceService.categoriesFilterListIds =
      this.categoriesFilterList.filter((c) => c.selected).map((c) => c.id) // copy to memoryse selection
    let selectedReferentielIds: number[] | null = null
    if (this.formReferentiel.length !== this.selectedReferentielIds.length) {
      selectedReferentielIds = this.selectedReferentielIds
    }
    this.isLoading = true
    this.humanResourceService
      .onFilterList(
        this.humanResourceService.backupId.getValue() || 0,
        this.dateSelected,
        selectedReferentielIds,
        this.humanResourceService.categoriesFilterListIds
      )
      .then(({ list, allPersons }) => {
        this.listFormated = list
        this.allPersons = allPersons

        this.orderListWithFiltersParams()
        this.isLoading = false
        console.log('this.listFormated', this.listFormated)
      })

    if (this.route.snapshot.fragment) {
      this.onGoTo(+this.route.snapshot.fragment)
    }
  }

  /**
   * Ordonner une liste de RH
   */
  orderListWithFiltersParams() {
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
          listFiltered = listFiltered.filter(h => h.indisponibilities && h.indisponibilities.length && h.indisponibilities.some(i => (this.filterParams?.filterIndispoValues || []).includes(i.contentieux.id)))
        }
      }

      list.hrFiltered = listFiltered

      if (this.filterSelected) {
        list.hrFiltered = orderBy(
          list.hrFiltered,
          (h) => {
            const acti = (h.currentActivities || []).find(
              (a) => a.contentieux?.id === this.filterSelected?.id
            )
            return acti ? acti.percent || 0 : 0
          },
          ['desc']
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
  onSelectedReferentielIdsChanged(list: any) {
    this.selectedReferentielIds = list
    this.humanResourceService.selectedReferentielIds =
      this.selectedReferentielIds
    this.referentiel = this.referentiel.map((cat) => {
      cat.selected = list.indexOf(cat.id) !== -1

      return cat
    })

    this.onFilterList()
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
    if (!this.filterSelected || this.filterSelected.id !== ref.id) {
      this.filterSelected = ref
    } else {
      this.filterSelected = null
    }

    this.orderListWithFiltersParams()
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
          hr.tmpActivities[ref.id] = hr.currentActivities.filter(
            (r) => r.contentieux && r.contentieux.id === ref.id
          )
          if (hr.tmpActivities[ref.id].length) {
            const timeAffected = sumBy(hr.tmpActivities[ref.id], 'percent')
            if (timeAffected) {
              let realETP = (hr.etp || 0) - hr.hasIndisponibility
              if (realETP < 0) {
                realETP = 0
              }
              ref.totalAffected =
                (ref.totalAffected || 0) + (timeAffected / 100) * realETP
            }
          }

          return ref
        })

        return hr
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

  async switchSubFilter(
    category: HRCategorySelectedInterface,
    poste: HRCategorypositionInterface
  ) {
    const fonctions = await this.hrFonctionService.getAll()
    let fctFilterIds: number[] = this.getCurrentFilteredIds(fonctions)

    this.listPoste.map(async (position) => {
      if (poste.name === position) {
        //selected fct by position clicked
        const focusFct = fonctions.filter(
          (f) =>
            f.position ===
            position.charAt(0).toUpperCase() + position.slice(1) &&
            f.categoryId === category.id
        )
        let myArray = null

        const isSelected = poste.selected

        if (!isSelected) {
          myArray = fctFilterIds.filter(
            (el) => !focusFct.map((x) => x.id).includes(el)
          )
        } else {
          myArray = union(
            fctFilterIds,
            focusFct.map((x) => x.id)
          )
        }

        this.filterParams = await {
          display: 'prénom/nom',
          filterFunction: (list: HumanResourceSelectedInterface[]) => {
            return list.filter(
              (h) =>
                h.fonction &&
                this.filterParams &&
                this.filterParams.filterValues &&
                this.filterParams.filterValues.indexOf(h.fonction.id) !== -1
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
  async setTooglePositionSelected(
    category: HRCategorySelectedInterface,
    poste: HRCategorypositionInterface
  ) {
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
      const labels = this.selectedReferentielIds.map(id => {
        const ref = this.formReferentiel.find(formRef => formRef.id === id)
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
   * Retour une string qui affiche les options de filtre / trie des indispo
   */
  getOptionAffichageIndispoString() {
    const allIndisponibilityReferentiel = this.humanResourceService.allIndisponibilityReferentiel.slice(1).map(r => ({ id: r.id, label: r.label.replace(/\//g, ' / ') }))
    const filtre = this.filterParams?.filterIndispoValues || []
    if (filtre.length) {
      const labels = filtre.map(id => {
        const ref = allIndisponibilityReferentiel.find(f => f.id === id)
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
    this.selectedReferentielIds = this.formReferentiel.map(r => r.id)
    this.onSelectedReferentielIdsChanged(this.selectedReferentielIds)
  }
}
