import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { MainClass } from 'src/app/libs/main-class'
import { month } from 'src/app/utils/dates'
import { ContentieuxOptionsService } from '../contentieux-options/contentieux-options.service'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'

@Injectable({
  providedIn: 'root',
})
export class CalculatorService extends MainClass {
  calculatorDatas: BehaviorSubject<CalculatorInterface[]> = new BehaviorSubject<
    CalculatorInterface[]
  >([])
  dateStart: BehaviorSubject<Date | null> = new BehaviorSubject<Date | null>(
    null
  )
  dateStop: BehaviorSubject<Date | null> = new BehaviorSubject<Date | null>(
    null
  )
  referentielIds: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([])

  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService,
    private contentieuxOptionsService: ContentieuxOptionsService
  ) {
    super()
  }

  filterList() {
    return this.serverService
      .post(`calculator/filter-list`, {
        backupId: this.humanResourceService.backupId.getValue(),
        dateStart: this.dateStart.getValue(),
        dateStop: this.dateStop.getValue(),
        contentieuxIds: this.referentielIds.getValue(),
        optionBackupId: this.contentieuxOptionsService.backupId.getValue(),
      })
      .then((data) => data.data || [])
  }
}
