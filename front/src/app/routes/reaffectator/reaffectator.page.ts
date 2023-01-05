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
  isModify: boolean
}

interface listFormatedInterface {
  textColor: string
  bgColor: string
  label: string
  originalLabel: string
  allHr: HumanResourceSelectedInterface[]
  hrFiltered: HumanResourceSelectedInterface[]
  referentiel: ContentieuReferentielCalculateInterface[]
  personSelected: number[]
  categoryId: number
  totalRealETp: number
}

interface ContentieuReferentielCalculateInterface
  extends ContentieuReferentielInterface {
  dtes: number
  coverage: number
  realDTESInMonths: number
  realCoverage: number
  etpToCompute: number
  etpUseToday: number
  magRealTimePerCase: number | null
  nbWorkingHours: number
  nbWorkingDays: number
  totalIn: number
  lastStock: number
}

@Component({
  templateUrl: './reaffectator.page.html',
  styleUrls: ['./reaffectator.page.scss'],
})
export class ReaffectatorPage extends MainClass implements OnInit, OnDestroy {
  @ViewChild('wrapper') wrapper: WrapperComponent | undefined
  duringPrint: boolean = false
  humanResources: HumanResourceSelectedInterface[] = []
  referentiel: ContentieuReferentielCalculateInterface[] = []
  formReferentiel: dataInterface[] = []
  formFilterSelect: dataInterface[] = []
  formFilterFonctionsSelect: dataInterface[] = []
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
  firstETPTargetValue: (number | null)[] = []
  isolatePersons: boolean = false
  showReelValues: boolean = false

  constructor(
    private humanResourceService: HumanResourceService,
    private workforceService: WorkforceService,
    public reaffectatorService: ReaffectatorService,
    private appService: AppService
  ) {
    super()
  }

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

  ngOnDestroy() {
    this.watcherDestroy()
  }

  updateCategoryValues() {
    this.formFilterSelect = this.formFilterSelect.map((c) => {
      const itemBlock = this.listFormated.find((l) => l.categoryId === c.id)
      c.value = c.orignalValue + ''

      if (itemBlock && itemBlock.hrFiltered) {
        c.value = `${itemBlock.hrFiltered.length} ${c.value}${
          itemBlock.hrFiltered.length > 1 ? 's' : ''
        } (${fixDecimal(
          sumBy(itemBlock.referentiel || [], 'totalAffected'),
          100
        )} ETPT)`
      }

      return c
    })

    console.log('this.listFormated', this.listFormated)
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
      !this.formFilterSelect.length ||
      this.humanResourceService.backupId.getValue() === null ||
      this.reaffectatorService.selectedCategoriesId === null
    ) {
      return
    }

    let selectedReferentielIds: number[] | null = null
    if (
      this.formReferentiel.length !==
      this.reaffectatorService.selectedReferentielIds.length
    ) {
      selectedReferentielIds = this.reaffectatorService.selectedReferentielIds
    }

    const allFonctions = this.humanResourceService.fonctions.getValue()

    let selectedFonctionsIds = [
      ...this.reaffectatorService.selectedFonctionsIds,
    ]
    selectedFonctionsIds = selectedFonctionsIds.concat(
      allFonctions
        .filter(
          (f) => f.categoryId !== this.reaffectatorService.selectedCategoriesId
        )
        .map((f) => f.id)
    )

    this.reaffectatorService
      .onFilterList(
        this.humanResourceService.backupId.getValue() || 0,
        this.dateSelected,
        this.reaffectatorService.selectedCategoriesId || 0,
        selectedFonctionsIds,
        selectedReferentielIds,
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

    this.orderListWithFiltersParams()
  }

  onExport() {
    this.duringPrint = true
    this.wrapper?.exportAsPdf('simulation-d-affectation.pdf').then(() => {
      this.duringPrint = false
      this.appService.alert.next({
        text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
      })
    })
  }

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

  onSelectedFonctionsIdsChanged(list: string[] | number[]) {
    this.reaffectatorService.selectedFonctionsIds = list.map((i) => +i)

    this.onFilterList()
  }

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
        }
      })
    }
  }

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

  onToogleIsolation() {
    this.isolatePersons = !this.isolatePersons
  }

  getOrignalHuman(
    hr: HumanResourceSelectedInterface,
    itemObject: listFormatedInterface
  ) {
    return itemObject.allHr.find((h) => h.id === hr.id)
  }
}
