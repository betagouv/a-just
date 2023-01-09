import { Component, OnDestroy, OnInit } from '@angular/core'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { orderBy, sumBy } from 'lodash'
import { MainClass } from 'src/app/libs/main-class'
import {
  HRCategoryInterface,
  HRCategorySelectedInterface,
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
import { AppService } from 'src/app/services/app/app.service'
import { DocumentationInterface } from 'src/app/interfaces/documentation'

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
  etpLabel: string
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
  showFilterPanel: number = -1
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
    path: 'https://a-just.gitbook.io/documentation-deploiement/ventilateur/quest-ce-que-cest',
  }

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
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private route: ActivatedRoute,
    private router: Router,
    private workforceService: WorkforceService,
    private userService: UserService,
    private appService: AppService
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
            value: this.referentielMappingName(r.label),
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

        this.categoriesFilterList = categories.map((c) => ({
          ...c,
          selected: this.categoriesFilterListIds.indexOf(c.id) !== -1,
          label:
            c.label && c.label === 'Magistrat' ? 'Magistrat du siège' : c.label,
          labelPlural:
            c.label && c.label === 'Magistrat'
              ? 'Magistrats du siège'
              : `${c.label}s`,
          etpt: 0,
          nbPersonal: 0,
        }))

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
   * Maj de catégorie filtrée
   */
  updateCategoryValues() {
    this.categoriesFilterList = this.categoriesFilterList.map((c) => {
      const formatedList = this.listFormated.find((l) => l.categoryId === c.id)
      let personal = []
      let etpt = 0

      if (formatedList) {
        personal = formatedList.hrFiltered
        personal.map((h) => {
          let realETP = (h.etp || 0) - h.hasIndisponibility
          if (realETP < 0) {
            realETP = 0
          }
          etpt += realETP
        })
      }

      return {
        ...c,
        etpt,
        nbPersonal: personal.length,
      }
    })

    console.log(this.categoriesFilterList)

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
    if (
      !this.searchValue ||
      ((hr.firstName || '') + (hr.lastName || ''))
        .toLowerCase()
        .includes(this.searchValue.toLowerCase())
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
    console.log(this.listFormated)
    this.valuesFinded = valuesFinded.length === nbPerson ? null : valuesFinded
    this.indexValuesFinded = 0

    if (this.valuesFinded && this.valuesFinded.length) {
      this.onGoTo(this.valuesFinded[this.indexValuesFinded].id)
    } else {
      this.onGoTo(null)
      if (this.searchValue.length !== 0)
        this.appService.alert.next({
          text: 'La personne recherchée n’est pas présente à la date sélectionnée.',
        })
    }
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

    this.humanResourceService
      .onFilterList(
        this.humanResourceService.backupId.getValue() || 0,
        this.dateSelected,
        selectedReferentielIds,
        this.humanResourceService.categoriesFilterListIds
      )
      .then((list) => {
        this.listFormated = list

        this.orderListWithFiltersParams()
        this.onSearchBy()
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
}
