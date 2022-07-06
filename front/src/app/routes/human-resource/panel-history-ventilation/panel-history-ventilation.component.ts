import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core'
import { sumBy } from 'lodash'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { MainClass } from 'src/app/libs/main-class'
import { fixDecimal } from 'src/app/utils/numbers'
import { etpLabel } from 'src/app/utils/referentiel'

@Component({
  selector: 'panel-history-ventilation',
  templateUrl: './panel-history-ventilation.component.html',
  styleUrls: ['./panel-history-ventilation.component.scss'],
})
export class PanelHistoryVentilationComponent
  extends MainClass
  implements OnChanges
{
  @Input() dateStart: Date = new Date()
  @Input() dateStop: Date | null = null
  @Input() dateEndToJuridiction: Date | null | undefined = null
  @Input() fonction: HRFonctionInterface | null = null
  @Input() etp: number = 0
  @Input() indisponibilities: RHActivityInterface[] = []
  @Input() activities: RHActivityInterface[] = []
  @Input() id: number | null = null
  @Input() canRemoveSituation: boolean = false
  @Output() editVentilation = new EventEmitter()
  @Output() addIndispiniblity = new EventEmitter()
  @Output() onRemove = new EventEmitter()
  indisponibility: number = 0
  timeWorked: string = ''

  constructor() {
    super()
  }

  ngOnChanges() {
    this.indisponibility = fixDecimal(
      sumBy(this.indisponibilities, 'percent') / 100
    )
    if(this.indisponibility > 1) {
      this.indisponibility = 1
    }

    if (
      this.dateEndToJuridiction &&
      this.dateStop &&
      this.dateEndToJuridiction.getTime() < this.dateStop.getTime()
    ) {
      this.timeWorked = 'Sortie'
    } else {
      this.timeWorked = etpLabel(this.etp)
    }
  }

  onEditSituation() {
    this.editVentilation.emit(true)
  }
}
