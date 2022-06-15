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
import { HRCommentService } from 'src/app/services/hr-comment/hr-comment.service'
import { fixDecimal } from 'src/app/utils/numbers'
import { etpLabel } from 'src/app/utils/referentiel'

@Component({
  selector: 'actual-panel-situation',
  templateUrl: './actual-panel-situation.component.html',
  styleUrls: ['./actual-panel-situation.component.scss'],
})
export class ActualPanelSituationComponent
  extends MainClass
  implements OnChanges
{
  @Input() dateStart: Date = new Date()
  @Input() dateStop: Date = new Date()
  @Input() dateEndToJuridiction: Date | null | undefined = null
  @Input() fonction: HRFonctionInterface | null = null
  @Input() etp: number = 1
  @Input() indisponibilities: RHActivityInterface[] = []
  @Input() activities: RHActivityInterface[] = []
  @Input() RHId: number | null = null
  @Input() id: number | null = null
  @Output() editVentilation = new EventEmitter()
  @Output() addIndispiniblity = new EventEmitter()
  indisponibility: number = 0
  timeWorked: string = ''
  isLeft: boolean = false
  comment: string = ''
  commentUpdatedAt: Date | null = null
  timeoutUpdateComment: any = null

  constructor(
    private hRCommentService: HRCommentService
  ) {
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
      this.dateEndToJuridiction.getTime() <= this.dateStop.getTime()
    ) {
      this.isLeft = true
      this.timeWorked = 'Parti'
    } else {
      this.isLeft = false
      this.timeWorked = etpLabel(this.etp)
    }

    this.onLoadComment()
  }

  onLoadComment() {
    if (this.RHId) {
      this.hRCommentService.getHRComment(this.RHId).then((result) => {
        this.comment = (result && result.comment) || ''
        this.commentUpdatedAt =
          result && result.updatedAt ? new Date(result.updatedAt) : null
      })
    }
  }

  updateComment(comment: string) {
    if (this.timeoutUpdateComment) {
      clearTimeout(this.timeoutUpdateComment)
      this.timeoutUpdateComment = null
    }

    this.timeoutUpdateComment = setTimeout(() => {
      if (this.RHId) {
        this.hRCommentService
          .updateHRComment(this.RHId, comment)
          .then((result) => {
            this.commentUpdatedAt = result ? new Date(result) : null
          })
      }
    }, 1000)
  }

  onEditSituation() {
    this.editVentilation.emit(true)
  }
}
