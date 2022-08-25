import { Component, OnDestroy, OnInit } from '@angular/core'
import { orderBy } from 'lodash'
import { dataInterface } from 'src/app/components/select/select.component'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { CalculatorService } from 'src/app/services/calculator/calculator.service'
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
@Component({
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
})
export class CalculatorPage extends MainClass implements OnDestroy, OnInit {
  referentiel: ContentieuReferentielInterface[] = []
  referentielIds: number[] = this.calculatorService.referentielIds.getValue()
  dateStart: Date = this.calculatorService.dateStart.getValue()
  dateStop: Date = this.calculatorService.dateStop.getValue()
  formReferentiel: dataInterface[] = []
  sortBy: string = ''
  datas: CalculatorInterface[] = []
  datasFilted: CalculatorInterface[] = []
  isLoading: boolean = false

  constructor(
    private humanResourceService: HumanResourceService,
    private calculatorService: CalculatorService,
    private referentielService: ReferentielService,
    private contentieuxOptionsService: ContentieuxOptionsService
  ) {
    super()
  }

  ngOnInit() {
    this.watch(
      this.contentieuxOptionsService.backupId.subscribe(() => {
        this.onLoad()
      })
    )
    this.watch(
      this.calculatorService.dateStart.subscribe(() => {
        this.onLoad()
      })
    )
    this.watch(
      this.calculatorService.dateStop.subscribe(() => {
        this.onLoad()
      })
    )
    this.watch(
      this.humanResourceService.backupId.subscribe(() => {
        this.onLoad()
      })
    )
    this.watch(
      this.calculatorService.referentielIds.subscribe((refs) => {
        this.referentielIds = refs
        this.onLoad()
      })
    )

    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.id) === -1
        )
        this.formatReferentiel()

        if (this.referentielIds.length === 0) {
          this.calculatorService.referentielIds.next(
            this.referentiel.map((r) => r.id)
          )
        }
      })
    )
  }

  ngOnDestroy() {
    this.watcherDestroy()
  }

  onLoad() {
    if (
      this.humanResourceService.backupId.getValue() &&
      this.contentieuxOptionsService.backupId.getValue() &&
      this.calculatorService.referentielIds.getValue().length
    ) {
      this.isLoading = true
      this.calculatorService
        .filterList()
        .then((list) => {
          this.formatDatas(list)
          this.isLoading = false
        })
        .catch(() => (this.isLoading = false))
    }
  }

  formatDatas(list: CalculatorInterface[]) {
    this.datas = list.map((l) => ({ ...l, childIsVisible: false }))
    this.filtredDatas()
  }

  filtredDatas() {
    let list = this.datas
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

  formatReferentiel() {
    this.formReferentiel = this.referentiel.map((r) => ({
      id: r.id,
      value: this.referentielMappingName(r.label),
    }))
  }

  updateReferentielSelected(type: string = '', event: any = null) {
    if (type === 'referentiel') {
      this.calculatorService.referentielIds.next(event)
    } else if (type === 'dateStart') {
      this.dateStart = new Date(event)
      this.calculatorService.dateStart.next(this.dateStart)
    } else if (type === 'dateStop') {
      this.dateStop = new Date(event)
      this.calculatorService.dateStop.next(this.dateStop)
    }

    this.filtredDatas()
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
