import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { orderBy, sumBy } from 'lodash'
import { MainClass } from 'src/app/libs/main-class'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { fixDecimal } from 'src/app/utils/numbers'
import { dataInterface } from 'src/app/components/select/select.component'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HRSituationInterface } from 'src/app/interfaces/hr-situation'
import { WorkforceService } from 'src/app/services/workforce/workforce.service'
import { WrapperComponent } from 'src/app/components/wrapper/wrapper.component'
import { ReaffectatorService } from 'src/app/services/reaffectator/reaffectator.service'
import { AppService } from 'src/app/services/app/app.service'
import { UserService } from 'src/app/services/user/user.service'

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
  templateUrl: './reaffectator.page.html',
  styleUrls: ['./reaffectator.page.scss'],
})
/**
 * Page de réaffectation
 */
export class ReaffectatorPage extends MainClass implements OnInit, OnDestroy {
  /**
   * Dom du wrapper
   * @param wrapper
   */
  @ViewChild('wrapper') wrapper: WrapperComponent | undefined
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
  filterSelected: ContentieuReferentielCalculateInterface | null = null
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
   * Constructeur
   * @param humanResourceService
   * @param workforceService
   * @param reaffectatorService
   * @param appService
   * @param  serverService
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private workforceService: WorkforceService,
    private appService: AppService,
    private rs: ReaffectatorService,
    private userService: UserService
  ) {
    super()
    this.reaffectatorService = this.rs
  }

  /**
   * A l'initialisation chercher les variables globals puis charger
   */
  ngOnInit() {
    this.watch(
      this.humanResourceService.backupId.subscribe(() => {
        this.onFilterList()
      })
    )
    this.watch(
      this.humanResourceService.categories.subscribe(
        (categories: HRCategoryInterface[]) => {
          this.formFilterSelect = categories.map((f) => ({
            id: f.id,
            value: f.label,
            orignalValue: f.label,
          }))

          this.onSelectedCategoriesIdChanged(
            this.reaffectatorService.selectedCategoriesId !== null
              ? [this.reaffectatorService.selectedCategoriesId]
              : this.formFilterSelect.length
              ? [this.formFilterSelect[0].id]
              : []
          )
        }
      )
    )
  }

  /**
   * Destruction des observables
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Mise à jour des catégories du menu déroulant
   */
  updateCategoryValues() {
    this.formFilterSelect = this.formFilterSelect.map((c) => {
      const itemBlock = this.listFormated.find((l) => l.categoryId === c.id)
      c.value = c.orignalValue + ''

      if (itemBlock && itemBlock.hrFiltered) {
        console.log(itemBlock.hrFiltered)
        c.value = `${itemBlock.hrFiltered.length} ${c.value}${
          itemBlock.hrFiltered.length > 1 ? 's' : ''
        } (${fixDecimal(
          sumBy(itemBlock.hrFiltered || [], function (h) {
            const etp = h.etp - h.hasIndisponibility
            return etp > 0 ? etp : 0
          }),
          100
        )} ETPT)`
      }

      return c
    })

    console.log('this.listFormated', this.listFormated)
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
    const name =
      (hr.firstName || '') + ' ' + (hr.lastName || '')

    if (
      !this.searchValue ||
      name.toLowerCase().includes(this.searchValue.toLowerCase())
    ) {
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
      !this.formFilterSelect.length ||
      this.humanResourceService.backupId.getValue() === null ||
      this.reaffectatorService.selectedCategoriesId === null
    ) {
      return
    }

    let selectedReferentielIds: number[] | null = null
    if (
      this.formReferentiel.length !==
        this.reaffectatorService.selectedReferentielIds.length &&
      this.formReferentiel.length !== 0
    ) {
      selectedReferentielIds = this.reaffectatorService.selectedReferentielIds
    }

    const allFonctions = this.humanResourceService.fonctions.getValue()
    let selectedFonctionsIds = null
    if (
      this.reaffectatorService.selectedFonctionsIds.length !==
      this.formFilterFonctionsSelect.length
    ) {
      console.log(this.reaffectatorService.selectedReferentielIds.length)
      selectedFonctionsIds = [...this.reaffectatorService.selectedFonctionsIds]
      selectedFonctionsIds = selectedFonctionsIds.concat(
        allFonctions
          .filter(
            (f) =>
              f.categoryId !== this.reaffectatorService.selectedCategoriesId
          )
          .map((f) => f.id)
      )
    }
    console.log(this.reaffectatorService.selectedReferentielIds.length)
    this.reaffectatorService
      .onFilterList(
        this.humanResourceService.backupId.getValue() || 0,
        this.dateSelected,
        this.reaffectatorService.selectedCategoriesId || 0,
        selectedFonctionsIds,
        selectedReferentielIds
      )
      .then((returnValues) => {
        console.log(returnValues)
        this.listFormated = returnValues.list.map(
          (i: listFormatedInterface, index: number) => {
            if (index === 0) {
              this.referentiel = i.referentiel.map((r) => ({
                ...r,
                selected: true,
              }))
              this.formReferentiel = i.referentiel.map((r) => ({
                id: r.id,
                value: this.referentielMappingName(r.label),
              }))
              if (this.firstETPTargetValue.length === 0) {
                this.firstETPTargetValue = i.referentiel.map(() => null)
              }

              this.reaffectatorService.selectedReferentielIds = this
                .reaffectatorService.selectedReferentielIds.length
                ? this.reaffectatorService.selectedReferentielIds
                : this.formReferentiel.map((c) => c.id)
            }

            const allHr = i.allHr.map((h) => ({
              ...h,
              isModify: false,
            }))
            return {
              ...i,
              allHr,
              hrFiltered: [...i.allHr],
              personSelected: [],
              referentiel: i.referentiel.map((r) => ({
                ...r,
                dtes: 0,
                coverage: 0,
              })),
            }
          }
        )

        this.orderListWithFiltersParams()
      })
  }

  /**
   * Trie de la liste retournée
   * @param onSearch
   */
  orderListWithFiltersParams(onSearch: boolean = true) {
    this.listFormated = this.listFormated.map((list) => {
      list.hrFiltered = orderBy(list.hrFiltered, ['fonction.rank'], ['asc'])

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
    } else this.onFilterList()
  }

  /**
   * Date de sélection change
   * @param date
   */
  onDateChanged(date: any) {
    this.dateSelected = date
    this.workforceService.dateSelected.next(date)
    this.onFilterList()
  }

  /**
   * Filtre de la liste
   * @param ref
   */
  onFilterBy(ref: ContentieuReferentielCalculateInterface) {
    if (!this.filterSelected || this.filterSelected.id !== ref.id) {
      this.filterSelected = ref
    } else {
      this.filterSelected = null
    }

    this.orderListWithFiltersParams()
  }

  /**
   * Export en PDF de la page
   */
  onExport() {
    this.duringPrint = true
    const date = new Date()

    this.wrapper
      ?.exportAsPdf(
        `Simulation-D-Affectation_par ${
          this.userService.user.getValue()!.firstName
        }_${this.userService.user.getValue()!.lastName!}_le ${new Date()
          .toJSON()
          .slice(0, 10)}.pdf`,
          true,
          true,
          `Simulation d'affectation par ${
            this.userService.user.getValue()!.firstName
          } ${this.userService.user.getValue()!.lastName} - le ${(date.getDate() + '').padStart(
            2,
            '0'
          )} ${this.getShortMonthString(date)} ${date.getFullYear()}`
      )
      .then(() => {
        this.duringPrint = false
      })
  }

  /**
   * Rechargement de la liste des fonctions en fonction des catégories
   * @param item
   */
  onSelectedCategoriesIdChanged(item: string[] | number[]) {
    this.reaffectatorService.selectedCategoriesId = item.length
      ? +item[0]
      : null

    const allFonctions = this.humanResourceService.fonctions.getValue()
    let fonctionList: HRFonctionInterface[] = allFonctions.filter(
      (f) => f.categoryId === this.reaffectatorService.selectedCategoriesId
    )
    this.formFilterFonctionsSelect = fonctionList.map((f) => ({
      id: f.id,
      value: f.code || f.label,
    }))

    this.onSelectedFonctionsIdsChanged(fonctionList.map((f) => f.id))
  }

  /**
   * Event lors du changement des fonctions
   * @param list
   */
  onSelectedFonctionsIdsChanged(list: string[] | number[]) {
    this.reaffectatorService.selectedFonctionsIds = list.map((i) => +i)

    this.onFilterList()
  }

  /**
   * Calcul des ETP
   * @param referentielId
   * @param hrList
   * @returns
   */
  onCalculETPAffected(
    referentielId: number,
    hrList: HumanResourceSelectedInterface[]
  ) {
    let etpCalculate = 0

    hrList.map((hr) => {
      const timeAffected = sumBy(
        hr.currentActivities.filter(
          (r) => r.contentieux && r.contentieux.id === referentielId
        ),
        'percent'
      )
      let realETP = (hr.etp || 0) - hr.hasIndisponibility
      if (realETP < 0) {
        realETP = 0
      }
      etpCalculate += (timeAffected / 100) * realETP
    })

    return fixDecimal(etpCalculate)
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

    const itemList = this.listFormated.find(
      (i) => i.categoryId === this.reaffectatorService.selectedCategoriesId
    )

    if (itemList) {
      this.referentiel = this.referentiel.map((ref) => {
        const refFromItemList = (itemList.referentiel || []).find(
          (r) => r.id === ref.id
        )

        if (!refFromItemList) {
          return ref
        }

        const averageWorkingProcess = refFromItemList.magRealTimePerCase || 0
        const etpt = refFromItemList.totalAffected || 0
        const nbWorkingHours = refFromItemList.nbWorkingHours || 0
        const nbWorkingDays = refFromItemList.nbWorkingDays || 0
        const lastStock = refFromItemList.lastStock || 0
        const inValue = refFromItemList.totalIn || 0

        let outValue =
          averageWorkingProcess === 0
            ? 0
            : (etpt * nbWorkingHours * nbWorkingDays) / averageWorkingProcess
        outValue = Math.floor(outValue)

        return {
          ...ref,
          coverage: fixDecimal(outValue / inValue) * 100,
          dtes:
            lastStock === 0 || outValue === 0
              ? 0
              : fixDecimal(lastStock / outValue),
          etpUseToday: refFromItemList.etpUseToday,
          totalAffected: refFromItemList.totalAffected,
          realCoverage: this.reaffectatorService.selectedReferentielIds.includes(ref.id) ? ref.realCoverage : 0, // make empty data if the referentiel id is not selected
        }
      })

      console.log(this.referentiel)
    }
  }

  /**
   * Mise à jour à la volé de la ventilation d'une fiche
   * @param hr
   * @param referentiels
   * @param indexList
   */
  updateHRReferentiel(
    hr: HumanResourceSelectedInterface,
    referentiels: ContentieuReferentielInterface[],
    indexList: number
  ) {
    console.log(hr, referentiels)
    const list: RHActivityInterface[] = []

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
            averageProcessingTimeFonc: null,
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
                averageProcessingTimeFonc: null,
              },
            })
          })
      })

    const humanId = hr.id
    const indexOfHR = this.listFormated[indexList].hrFiltered.findIndex(
      (hr) => hr.id === humanId
    )

    if (indexOfHR !== -1) {
      this.listFormated[indexList].hrFiltered[indexOfHR].currentActivities =
        list
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
    if (
      this.listFormated[index].personSelected.length ===
      this.listFormated[index].hrFiltered.length
    ) {
      this.listFormated[index].personSelected = []
    } else {
      this.listFormated[index].personSelected = this.listFormated[
        index
      ].hrFiltered.map((h) => h.id)
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

        if (indexOfHRFiltered !== 1 && indexOfAllHR !== -1) {
          list.hrFiltered[indexOfHRFiltered] = { ...list.allHr[indexOfAllHR] }
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
  getOrignalHuman(
    hr: HumanResourceSelectedInterface,
    itemObject: listFormatedInterface
  ) {
    return itemObject.allHr.find((h) => h.id === hr.id)
  }
}
