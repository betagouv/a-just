import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { groupBy, meanBy, orderBy, sumBy } from 'lodash'
import { MainClass } from 'src/app/libs/main-class'
import {
  HRCategoryInterface,
  HRCategorySelectedInterface,
} from 'src/app/interfaces/hr-category'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { fixDecimal } from 'src/app/utils/numbers'
import { dataInterface } from 'src/app/components/select/select.component'
import { copyArray } from 'src/app/utils/array'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HRSituationInterface } from 'src/app/interfaces/hr-situation'
import { WorkforceService } from 'src/app/services/workforce/workforce.service'
import { WrapperComponent } from 'src/app/components/wrapper/wrapper.component'
import { ReaffectatorService } from 'src/app/services/reaffectator/reaffectator.service'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { isDateBiggerThan, month, nbOfDays } from 'src/app/utils/dates'
import { environment } from 'src/environments/environment'
import { SimulatorService } from 'src/app/services/simulator/simulator.service'
import { etpAffectedInterface } from 'src/app/interfaces/calculator'

interface HumanResourceSelectedInterface extends HumanResourceInterface {
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
  groupId: number
  hr: HumanResourceSelectedInterface[]
  hrFiltered: HumanResourceSelectedInterface[]
  referentiel: ContentieuReferentielCalculateInterface[]
  firstETPTargetValue: number[]
  headerPanel: boolean
  personSelected: number[]
  categoryId: number
}

interface ContentieuReferentielCalculateInterface
  extends ContentieuReferentielInterface {
  dtes: number
  coverage: number
}

interface FirstETPTargetValueInterface {
  groupId: number
  list: number[]
}

@Component({
  templateUrl: './reaffectator.page.html',
  styleUrls: ['./reaffectator.page.scss'],
})
export class ReaffectatorPage extends MainClass implements OnInit, OnDestroy {
  @ViewChild('wrapper') wrapper: WrapperComponent | undefined
  duringPrint: boolean = false
  allHumanResources: HumanResourceInterface[] = []
  preformatedAllHumanResource: HumanResourceSelectedInterface[] = []
  humanResources: HumanResourceSelectedInterface[] = []
  referentiel: ContentieuReferentielCalculateInterface[] = []
  formReferentiel: dataInterface[] = []
  formFilterSelect: dataInterface[] = []
  formFilterFonctionsSelect: dataInterface[] = []
  categoriesFilterList: HRCategorySelectedInterface[] = []
  searchValue: string = ''
  valuesFinded: HumanResourceInterface[] | null = null
  indexValuesFinded: number = 0
  timeoutUpdateSearch: any = null
  dateSelected: Date = this.workforceService.dateSelected.getValue()
  listFormated: listFormatedInterface[] = []
  filterSelected: ContentieuReferentielCalculateInterface | null = null
  lastScrollTop: number = 0
  isFirstLoad: boolean = true
  showIndicatorPanel: boolean = true
  objectOfFirstETPTargetValue: FirstETPTargetValueInterface[] = []
  timeoutUpdateETPTargetAfterDelay: any

  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private workforceService: WorkforceService,
    public reaffectatorService: ReaffectatorService,
    private activitiesService: ActivitiesService,
    private simulatorService: SimulatorService
  ) {
    super()
  }

  ngOnInit() {
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((ref) => {
        this.referentiel = ref
          .filter(
            (a) => this.referentielService.idsIndispo.indexOf(a.id) === -1
          )
          .map((r) => ({ ...r, selected: true, dtes: 0, coverage: 0 }))
        this.formReferentiel = this.referentiel.map((r) => ({
          id: r.id,
          value: this.referentielMappingName(r.label),
        }))

        this.reaffectatorService.selectedReferentielIds = this
          .reaffectatorService.selectedReferentielIds.length
          ? this.reaffectatorService.selectedReferentielIds
          : this.formReferentiel.map((c) => c.id)

        this.onFilterList()
      })
    )
    this.watch(
      this.humanResourceService.categories.subscribe(
        (categories: HRCategoryInterface[]) => {
          this.formFilterSelect = categories.map((f) => ({
            id: f.id,
            value: f.label,
          }))

          this.onSelectedCategoriesIdsChanged(
            this.reaffectatorService.selectedCategoriesIds.length
              ? this.reaffectatorService.selectedCategoriesIds
              : categories.map((c) => c.id)
          )
        }
      )
    )
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

    /*this.formFilterSelect = this.categoriesFilterList.map((c) => {
      let value = `${c.nbPersonal} ${
        c.nbPersonal > 1 ? c.labelPlural : c.label
      }`

      return {
        id: c.id,
        value,
      }
    })*/
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
    if (!this.formFilterSelect.length || !this.referentiel.length) {
      return
    }

    // init datas
    this.objectOfFirstETPTargetValue = []

    this.reaffectatorService
      .onFilterList(
        this.humanResourceService.backupId.getValue() || 0,
        this.dateSelected,
        this.reaffectatorService.selectedReferentielIds,
        this.reaffectatorService.selectedCategoriesIds,
        this.reaffectatorService.selectedFonctionsIds
      )
      .then((list) => {
        console.log(list)
        this.listFormated = list.map((i: listFormatedInterface) => ({
          ...i,
          headerPanel: true,
          personSelected: [],
          firstETPTargetValue: [],
        }))

        this.orderListWithFiltersParams()
        this.onSearchBy()
        // this.calculateReferentielValues()
      })
  }
  
  orderListWithFiltersParams() {
    this.listFormated = this.listFormated.map((list) => {
      list.hrFiltered = [...list.hr]

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
    this.reaffectatorService.selectedReferentielIds = list
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

  onFilterBy(ref: ContentieuReferentielCalculateInterface) {
    if (!this.filterSelected || this.filterSelected.id !== ref.id) {
      this.filterSelected = ref
    } else {
      this.filterSelected = null
    }

    this.onFilterList()
  }

  onExport() {
    this.duringPrint = true
    this.wrapper
      ?.exportAsPdf('simulation-d-affectation.pdf', false)
      .then(() => {
        this.duringPrint = false
      })
  }

  onSelectedCategoriesIdsChanged(list: string[] | number[]) {
    console.log('onSelectedCategoriesIdsChanged', list)
    this.reaffectatorService.selectedCategoriesIds = list.map((i) => +i)

    const allFonctions = this.humanResourceService.fonctions.getValue()
    console.log('allFonctions', allFonctions)
    let fonctionList: HRFonctionInterface[] = []
    this.reaffectatorService.selectedCategoriesIds.map((cId) => {
      fonctionList = fonctionList.concat(allFonctions.filter((f) => f.categoryId === cId))
    })

    this.formFilterFonctionsSelect = fonctionList.map((f) => ({
      id: f.id,
      value: f.label,
    }))

    this.onSelectedFonctionsIdsChanged(fonctionList.map((f) => f.id))
  }

  onSelectedFonctionsIdsChanged(list: string[] | number[]) {
    this.reaffectatorService.selectedFonctionsIds = list.map((i) => +i)

    this.onFilterList()
  }

  calculateReferentielValues() {
    console.log(this.listFormated)
    const magistrats = this.listFormated.find((l) => l.groupId === 1)
    const activities = this.activitiesService.activities.getValue()

    this.referentiel = this.referentiel.map((r) => {
      // list all activities
      const activitiesFiltered = orderBy(
        activities.filter(
          (a) =>
            a.contentieux.id === r.id &&
            isDateBiggerThan(this.dateSelected, a.periode)
        ),
        (a) => {
          const p = new Date(a.periode)
          return p.getTime()
        },
        ['desc']
      ).slice(0, 12)

      // find new ETPT of today
      let etpt = 0
      if (magistrats) {
        const ref = magistrats.referentiel.find(
          (referentiel) => referentiel.id === r.id
        )
        if (ref) {
          etpt = fixDecimal(ref.totalAffected!) || 0
        }
      }

      const nbDaysByMonthForMagistrat = environment.nbDaysByMagistrat / 12
      const inValue = Math.floor(meanBy(activitiesFiltered, 'entrees')) || 0
      const averageOut = Math.floor(meanBy(activitiesFiltered, 'sorties')) || 0
      let lastStock = activitiesFiltered.length
        ? activitiesFiltered[0].stock || 0
        : 0

      // simulate value if last datas are before selected month
      const lastPeriode = activitiesFiltered.length
        ? month(activitiesFiltered[0].periode, 0, 'lastday')
        : null

      if (
        lastPeriode &&
        lastPeriode.getTime() < month(this.dateSelected).getTime()
      ) {
        // ETPT of the last 12 months
        let etpAffectedLast12Months = this.simulatorService.getHRPositions(
          r.id,
          new Date(month(lastPeriode, -11)),
          true,
          new Date(month(lastPeriode, 0, 'lastday'))
        ) as Array<etpAffectedInterface>
        let etpToComputeLast12Months =
          etpAffectedLast12Months.length >= 0
            ? etpAffectedLast12Months[0].totalEtp
            : 0

        let averageWorkingProcess = fixDecimal(
          (nbDaysByMonthForMagistrat * environment.nbHoursPerDay) /
            (averageOut / etpToComputeLast12Months)
        )

        let outValue = Math.floor(
          (etpt * environment.nbHoursPerDay * nbDaysByMonthForMagistrat) /
            averageWorkingProcess
        )

        // ETPT Delta between lastperiod and today/selected date in the futur
        const etpAffected = this.simulatorService.getHRPositions(
          r.id,
          lastPeriode,
          true,
          this.dateSelected
        ) as Array<etpAffectedInterface>
        const etpMagDelta =
          etpAffected.length >= 0 ? etpAffected[0].totalEtp : 0
        const nbDayCalendar = nbOfDays(lastPeriode, this.dateSelected)

        // Compute stock projection until today
        lastStock =
          Math.floor(lastStock) -
          Math.floor(
            (nbDayCalendar / (365 / 12)) *
              nbDaysByMonthForMagistrat *
              ((etpMagDelta * environment.nbHoursPerDay) /
                averageWorkingProcess)
          ) +
          Math.floor((nbDayCalendar / (365 / 12)) * inValue)

        return {
          ...r,
          in: inValue,
          out: outValue,
          stock: lastStock,
          coverage: fixDecimal(outValue / inValue) * 100,
          dtes: fixDecimal(lastStock / outValue),
        }
      }

      return {
        ...r,
        in: inValue,
        out: averageOut,
        stock: lastStock,
        coverage: fixDecimal(averageOut / inValue) * 100,
        dtes: fixDecimal(lastStock / averageOut),
      }
    })
  }

  updateHRReferentiel(
    hr: HumanResourceSelectedInterface,
    referentiels: ContentieuReferentielInterface[]
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

    const indexOfHR = this.preformatedAllHumanResource.findIndex(
      (p) => p.id === hr.id
    )
    if (indexOfHR !== -1) {
      this.preformatedAllHumanResource[indexOfHR].currentActivities = list
      this.onFilterList()
    }
  }

  updateETPTargetAfterDelay(list: number[], index: number, value: number) {
    if (this.timeoutUpdateETPTargetAfterDelay) {
      clearTimeout(this.timeoutUpdateETPTargetAfterDelay)
      this.timeoutUpdateETPTargetAfterDelay = null
    }

    this.timeoutUpdateETPTargetAfterDelay = setTimeout(() => {
      list[index] = value || 0
    }, 500)
  }

  toogleCheckPerson(index: number, hr: HumanResourceSelectedInterface) {
    const indexFinded = this.listFormated[index].personSelected.indexOf(hr.id)
    if (indexFinded === -1) {
      this.listFormated[index].personSelected.push(hr.id)
    } else {
      this.listFormated[index].personSelected.splice(indexFinded, 1)
    }
  }

  toogleCheckAllPerson(index: number) {
    if (
      this.listFormated[index].personSelected.length ===
      this.listFormated[index].hr.length
    ) {
      this.listFormated[index].personSelected = []
    } else {
      this.listFormated[index].personSelected = this.listFormated[index].hr.map(
        (h) => h.id
      )
    }
  }

  onInitList(list: listFormatedInterface) {
    if (list.personSelected.length) {
      list.personSelected.map((id) => {
        const indexOfFormatedList = this.preformatedAllHumanResource.findIndex(
          (h) => h.id === id
        )
        const orginalPerson = this.allHumanResources.find((h) => h.id === id)

        if (orginalPerson && indexOfFormatedList !== -1) {
          /*this.preformatedAllHumanResource[indexOfFormatedList] =
            this.formatHR(orginalPerson)*/
          // TODO ICI
        }
      })

      list.personSelected = []
      this.onFilterList()
    }
  }
}
