import { Component, OnDestroy, OnInit } from '@angular/core'
import { orderBy } from 'lodash'
import { dataInterface } from 'src/app/components/select/select.component'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { CalculatorService } from 'src/app/services/calculator/calculator.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { month } from 'src/app/utils/dates'
@Component({
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
})
export class CalculatorPage extends MainClass implements OnDestroy, OnInit {
  referentiel: ContentieuReferentielInterface[] = []
  referentielIds: number[] = []
  dateStart: Date | null = null
  dateStop: Date | null = null
  formReferentiel: dataInterface[] = []
  sortBy: string = ''
  datas: CalculatorInterface[] = []
  datasFilted: CalculatorInterface[] = []
  isLoading: boolean = false
  maxDateSelectionDate: Date | null = null

  constructor(
    private humanResourceService: HumanResourceService,
    private calculatorService: CalculatorService,
    private referentielService: ReferentielService,
    private activitiesService: ActivitiesService
  ) {
    super()
  }

  ngOnInit() {
    this.watch(
      this.calculatorService.dateStart.subscribe((d) => (this.dateStart = d))
    )
    this.watch(
      this.calculatorService.dateStop.subscribe((d) => (this.dateStop = d))
    )
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.id) === -1
        )
        this.formatReferenteil()
        this.onCalculate()

        if (this.isLoading === false) {
          this.isLoading = true

          this.activitiesService.getLastMonthActivities().then((date) => {
            date = new Date(date ? date : '')
            const max = month(date, 0, 'lastday')

            if (this.dateStop === null || max.getTime() < this.dateStop.getTime()) {
              this.calculatorService.dateStart.next(month(max, -2))
              this.calculatorService.dateStop.next(max)
            }
            this.maxDateSelectionDate = max
            this.isLoading = false
          })
        }
      })
    )
    this.watch(
      this.calculatorService.calculatorDatas.subscribe((d) =>
        this.formatDatas(d)
      )
    )

    this.calculatorService.syncDatas()
  }

  ngOnDestroy() {
    this.watcherDestroy()
  }

  formatDatas(list: CalculatorInterface[]) {
    this.datas = list
    this.filtredDatas()
  }

  filtredDatas() {
    let list = this.datas.filter(
      (d) => this.referentielIds.indexOf(d.contentieux.id) !== -1
    )
    if (this.sortBy) {
      list = orderBy(
        list,
        [
          (o) => {
            // @ts-ignore
            return o[this.sortBy] || 0
          },
        ],
        ['desc']
      )
    }

    this.datasFilted = list
  }

  formatReferenteil() {
    this.formReferentiel = this.referentiel.map((r) => ({
      id: r.id,
      value: this.referentielMappingName(r.label),
    }))
  }

  updateReferentielSelected(type: string = '', event: any = null) {
    if (type === 'referentiel') {
      this.referentielIds = event
      this.calculatorService.referentielIds = this.referentielIds
    } else if (type === 'dateStart') {
      this.dateStart = new Date(event)
      this.calculatorService.dateStart.next(this.dateStart)
    } else if (type === 'dateStop') {
      this.dateStop = new Date(event)
      this.calculatorService.dateStop.next(this.dateStop)
    }

    this.filtredDatas()
  }

  onCalculate() {
    if (this.referentiel.length && this.referentielIds.length === 0) {
      this.referentielIds = this.referentiel.map((r) => r.id)
      this.filtredDatas()
    }
  }

  trackBy(index: number, item: CalculatorInterface) {
    return item.contentieux.id
  }

  onSortBy(type: string) {
    if (this.sortBy === type) {
      this.sortBy = ''
    } else {
      this.sortBy = type
    }

    this.filtredDatas()
  }
}
