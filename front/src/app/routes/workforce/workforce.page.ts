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

export interface HumanResourceSelectedInterface extends HumanResourceInterface {
  opacity: number
  tmpActivities?: any
  etpLabel: string
  hasIndisponibility: number
  currentActivities: RHActivityInterface[]
  etp: number
  category: HRCategoryInterface | null
  fonction: HRFonctionInterface | null
  currentSituation: HRSituationInterface | null
}

interface listFormatedInterface {
  textColor: string
  bgColor: string
  label: string
  hr: HumanResourceSelectedInterface[]
  hrFiltered: HumanResourceSelectedInterface[]
  referentiel: ContentieuReferentielInterface[]
  categoryId: number
}

@Component({
  templateUrl: './workforce.page.html',
  styleUrls: ['./workforce.page.scss'],
})
export class WorkforcePage extends MainClass implements OnInit, OnDestroy {
  allHumanResources: HumanResourceInterface[] = []
  preformatedAllHumanResource: HumanResourceSelectedInterface[] = []
  humanResources: HumanResourceSelectedInterface[] = []
  humanResourcesFilters: HumanResourceSelectedInterface[] = []
  referentiel: ContentieuReferentielInterface[] = []
  formReferentiel: dataInterface[] = []
  categoriesFilterList: HRCategorySelectedInterface[] = []
  categoriesFilterListIds: number[] = []
  selectedReferentielIds: number[] = []
  searchValue: string = ''
  valuesFinded: HumanResourceInterface[] | null = null
  indexValuesFinded: number = 0
  hrBackup: BackupInterface | null = null
  dateSelected: Date = this.workforceService.dateSelected.getValue()
  listFormated: listFormatedInterface[] = []
  filterSelected: ContentieuReferentielInterface | null = null
  lastScrollTop: number = 0
  showFilterPanel: number = -1
  filterParams: FilterPanelInterface | null = this.workforceService.filterParams
  canViewReaffectator: boolean = false

  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private route: ActivatedRoute,
    private router: Router,
    private workforceService: WorkforceService,
    private userService: UserService
  ) {
    super()
  }

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

  ngOnDestroy() {
    this.watcherDestroy()
  }

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
  }

  async addHR() {
    const newId = await this.humanResourceService.createHumanResource(
      this.dateSelected
    )
    this.route.snapshot.fragment = newId + ''
    this.router.navigate(['/resource-humaine', newId])
  }

  trackById(index: number, item: any) {
    return item.id
  }

  calculTotalTmpActivity(
    currentActivities: RHActivityInterface[],
    formActivities: RHActivityInterface[]
  ) {
    // total main activities whitout form
    const totalWhitout = sumBy(
      currentActivities.filter((ca) => {
        const ref = this.referentiel.find((r) => r.id === ca.referentielId)
        if (ref && ca.referentielId !== formActivities[0].id) {
          return true
        } else {
          return false
        }
      }),
      'percent'
    )

    return totalWhitout + (formActivities[0].percent || 0)
  }

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
        this.categoriesFilterListIds
      )
      .then((list) => {
        console.log(list)
        this.listFormated = list

        this.orderListWithFiltersParams()
        this.onSearchBy()
      })

    if (this.route.snapshot.fragment) {
      this.onGoTo(+this.route.snapshot.fragment)
    }
  }

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

  onDateChanged(date: any) {
    this.dateSelected = date
    this.workforceService.dateSelected.next(date)
    this.onFilterList()
  }

  onFilterBy(ref: ContentieuReferentielInterface) {
    if (!this.filterSelected || this.filterSelected.id !== ref.id) {
      this.filterSelected = ref
    } else {
      this.filterSelected = null
    }

    this.orderListWithFiltersParams()
  }

  updateFilterParams(event: FilterPanelInterface) {
    this.workforceService.filterParams = event // memorize in cache
    this.filterParams = event

    this.orderListWithFiltersParams()
  }

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

  clearFilterFilter() {
    if (this.filterParams) {
      this.filterParams.filterNames = null
      this.filterParams.filterValues = null
      this.filterParams.filterFunction = null
    }

    this.orderListWithFiltersParams()
  }
}
