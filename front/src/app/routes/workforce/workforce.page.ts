import { Component, OnDestroy, OnInit } from '@angular/core'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { groupBy, orderBy, sortBy, sumBy } from 'lodash'
import { MainClass } from 'src/app/libs/main-class'
import {
  HRCategoryInterface,
  HRCategorySelectedInterface,
} from 'src/app/interfaces/hr-category'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { fixDecimal } from 'src/app/utils/numbers'
import { BackupInterface } from 'src/app/interfaces/backup'
import { dataInterface } from 'src/app/components/select/select.component'
import { copyArray } from 'src/app/utils/array'
import { etpLabel } from 'src/app/utils/referentiel'
import { ActivatedRoute, Router } from '@angular/router'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HRSituationInterface } from 'src/app/interfaces/hr-situation'
import { WorkforceService } from 'src/app/services/workforce/workforce.service'
import { FilterPanelInterface } from './filter-panel/filter-panel.component'

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
  referentiel: ContentieuReferentielInterface[]
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
  selectedReferentielIds: any[] = []
  searchValue: string = ''
  valuesFinded: HumanResourceInterface[] | null = null
  indexValuesFinded: number = 0
  timeoutUpdateSearch: any = null
  hrBackup: BackupInterface | undefined
  dateSelected: Date = this.workforceService.dateSelected.getValue()
  listFormated: listFormatedInterface[] = []
  filterSelected: ContentieuReferentielInterface | null = null
  lastScrollTop: number = 0
  isFirstLoad: boolean = true
  showFilterPanel: boolean = true
  filterParams: FilterPanelInterface | null = null

  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private route: ActivatedRoute,
    private router: Router,
    private workforceService: WorkforceService
  ) {
    super()
  }

  ngOnInit() {
    this.watch(
      this.humanResourceService.hr.subscribe((hr: HumanResourceInterface[]) => {
        this.allHumanResources = sortBy(hr, ['fonction.rank', 'category.rank'])
        this.categoriesFilterList =
          this.humanResourceService.categoriesFilterList
        this.preformatHumanResources()
      })
    )
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((ref: ContentieuReferentielInterface[]) => {
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
      })
    )
    this.watch(
      this.humanResourceService.categories.subscribe(() => {
        this.onFilterList()
      })
    )
    this.watch(
      this.humanResourceService.backupId.subscribe((backupId: number | null) => {
        const hrBackups = this.humanResourceService.backups.getValue()
        this.hrBackup = hrBackups.find((b: BackupInterface) => b.id === backupId)
      })
    )
  }

  ngOnDestroy() {
    this.watcherDestroy()
  }

  preformatHumanResources() {
    this.preformatedAllHumanResource = orderBy(
      this.allHumanResources.map((h) => {
        const indisponibilities =
          this.humanResourceService.findAllIndisponibilities(
            h,
            this.dateSelected
          )
        let hasIndisponibility = fixDecimal(
          sumBy(indisponibilities, 'percent') / 100
        )
        if (hasIndisponibility > 1) {
          hasIndisponibility = 1
        }
        const currentSituation = this.humanResourceService.findSituation(
          h,
          this.dateSelected
        )
        let etp = (currentSituation && currentSituation.etp) || 0
        if (etp < 0) {
          etp = 0
        }

        let firstSituation = currentSituation
        //console.log(h, currentSituation)
        if (!firstSituation) {
          firstSituation = this.humanResourceService.findSituation(h, undefined, 'asc')
          etp = 1
        }

        return {
          ...h,
          currentActivities:
            (currentSituation && currentSituation.activities) || [],
          indisponibilities,
          opacity: 1,
          etpLabel: etpLabel(etp),
          hasIndisponibility,
          currentSituation,
          etp,
          category: firstSituation && firstSituation.category,
          fonction: firstSituation && firstSituation.fonction,
        }
      }),
      ['fonction.rank', 'lastName'],
      ['asc', 'asc']
    )

    console.log(
      'this.preformatedAllHumanResource',
      this.preformatedAllHumanResource
    )

    this.updateCategoryValues()
    this.onFilterList()
  }

  updateCategoryValues() {
    this.categoriesFilterList = this.categoriesFilterList.map((c) => {
      const personal = this.humanResourcesFilters.filter(
        (h) => h.category && h.category.id === c.id
      )
      let etpt = 0

      personal.map((h) => {
        const activities = h.currentActivities.filter(
          (a) =>
            a.contentieux &&
            this.selectedReferentielIds.indexOf(a.contentieux.id) !== -1
        )
        if (activities.length) {
          let realETP = (h.etp || 0) - h.hasIndisponibility
          if (realETP < 0) {
            realETP = 0
          }
          etpt += (realETP * sumBy(activities, 'percent')) / 100
        }
      })

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
      (hr.firstName || '')
        .toLowerCase()
        .includes(this.searchValue.toLowerCase()) ||
      (hr.lastName || '').toLowerCase().includes(this.searchValue.toLowerCase())
    ) {
      return 1
    }

    return 0.5
  }

  onFilterList() {
    if (
      !this.categoriesFilterList.length ||
      !this.referentiel.length ||
      !this.categoriesFilterList.length
    ) {
      return
    }

    this.humanResourceService.categoriesFilterList = this.categoriesFilterList // copy to memoryse selection

    const selectedCategoryIds = this.categoriesFilterList
      .filter((c) => c.selected)
      .map((c) => c.id)
    let list: HumanResourceSelectedInterface[] =
      this.preformatedAllHumanResource
        .filter((hr) => {
          let isOk = true
          if (
            hr.category &&
            selectedCategoryIds.indexOf(hr.category.id) === -1
          ) {
            isOk = false
          }

          if (
            hr.dateEnd &&
            hr.dateEnd.getTime() < this.dateSelected.getTime()
          ) {
            isOk = false
          }

          if (
            hr.dateStart &&
            hr.dateStart.getTime() > this.dateSelected.getTime()
          ) {
            isOk = false
          }

          return isOk
        })
        .map((h) => ({
          ...h,
          opacity: this.checkHROpacity(h),
        }))

    const valuesFinded = list.filter((h) => h.opacity === 1)
    this.valuesFinded =
      valuesFinded.length === list.length ? null : valuesFinded
    this.indexValuesFinded = 0

    if (this.selectedReferentielIds.length !== this.referentiel.length) {
      list = list.filter((h) => {
        const idsOfactivities = h.currentActivities.map(
          (a) => (a.contentieux && a.contentieux.id) || 0
        )
        for (let i = 0; i < idsOfactivities.length; i++) {
          if (this.selectedReferentielIds.indexOf(idsOfactivities[i]) !== -1) {
            return true
          }
        }

        return false
      })
    }

    this.humanResources = list
    this.orderListWithFiltersParams()

    if (this.isFirstLoad && this.route.snapshot.fragment) {
      this.isFirstLoad = false
      this.onGoTo(+this.route.snapshot.fragment)
    } else if (this.valuesFinded && this.valuesFinded.length) {
      this.onGoTo(this.valuesFinded[this.indexValuesFinded].id)
    } else if (list.length) {
      this.onGoTo(null)
    }
  }

  orderListWithFiltersParams() {
    let listFiltered = [...this.humanResources]
    if(this.filterParams) {
      if(this.filterParams.sortFunction) {
        listFiltered = this.filterParams.sortFunction(listFiltered)
      }

      if(this.filterParams.order && this.filterParams.order === 'desc') {
        listFiltered = listFiltered.reverse()
      }
    }

    this.humanResourcesFilters = listFiltered
    this.formatListToShow()
    this.updateCategoryValues()
  }

  formatListToShow() {
    console.log(this.categoriesFilterList)
    const groupByCategory = groupBy(this.humanResourcesFilters, 'category.id')

    this.listFormated = [...this.categoriesFilterList].map(
      (category: HRCategorySelectedInterface) => {
        const label = category.label
        let referentiel = (
          copyArray(this.referentiel) as ContentieuReferentielInterface[]
        ).map((ref) => {
          ref.totalAffected = 0
          return ref
        })

        let group = this.humanResourcesFilters.filter(h => h.category && h.category.id === category.id).map((hr) => {
          hr.tmpActivities = {}

          referentiel = referentiel.map((ref) => {
            hr.tmpActivities[ref.id] = hr.currentActivities.filter(
              (r) => r.contentieux && r.contentieux.id === ref.id
            )
            const timeAffected = sumBy(hr.tmpActivities[ref.id], 'percent')
            if (timeAffected) {
              let realETP = (hr.etp || 0) - hr.hasIndisponibility
              if (realETP < 0) {
                realETP = 0
              }
              ref.totalAffected =
                (ref.totalAffected || 0) + (timeAffected / 100) * realETP
            }

            return ref
          })

          return hr
        })

        if (this.filterSelected) {
          group = orderBy(
            group,
            (h) => {
              const acti = (h.currentActivities || []).find(
                (a) => a.contentieux?.id === this.filterSelected?.id
              )
              return acti ? acti.percent || 0 : 0
            },
            ['desc']
          )
        }

        return {
          textColor: this.getCategoryColor(label),
          bgColor: this.getCategoryColor(label, 0.2),
          referentiel,
          label:
            group.length <= 1
              ? label && label === 'Magistrat'
                ? 'Magistrat du siège'
                : label
              : label && label === 'Magistrat'
              ? 'Magistrats du siège'
              : `${label}s`,
          hr: group,
        }
      }
    )
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

  updateSearch() {
    if (this.timeoutUpdateSearch) {
      clearTimeout(this.timeoutUpdateSearch)
      this.timeoutUpdateSearch = null
    }

    this.timeoutUpdateSearch = setTimeout(() => {
      this.onFilterList()
    }, 500)
  }

  onDateChanged(date: any) {
    this.dateSelected = date
    this.workforceService.dateSelected.next(date)
    this.preformatHumanResources()
  }

  onFilterBy(ref: ContentieuReferentielInterface) {
    if (!this.filterSelected || this.filterSelected.id !== ref.id) {
      this.filterSelected = ref
    } else {
      this.filterSelected = null
    }

    this.onFilterList()
  }
}
