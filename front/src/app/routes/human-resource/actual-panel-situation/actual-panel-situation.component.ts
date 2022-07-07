import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core'
import { sumBy } from 'lodash'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { MainClass } from 'src/app/libs/main-class'
import { HRCommentService } from 'src/app/services/hr-comment/hr-comment.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { today } from 'src/app/utils/dates'
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
  @Input() currentHR: HumanResourceInterface | null = null
  @Input() dateStart: Date | null = null
  @Input() dateStop: Date | null = null
  @Input() canEdit: boolean = false
  @Input() canRemoveSituation: boolean = false
  @Input() etp: number = 0
  @Input() fonction: HRFonctionInterface | null = null
  @Input() indisponibilities: RHActivityInterface[] = []
  @Output() editVentilation = new EventEmitter()
  @Output() addIndispiniblity = new EventEmitter()
  @Output() onRemove = new EventEmitter()
  indisponibility: number = 0
  timeWorked: string = ''
  comment: string = ''
  commentUpdatedAt: Date | null = null
  timeoutUpdateComment: any = null
  activities: RHActivityInterface[] = []

  constructor(
    private hRCommentService: HRCommentService,
    private humanResourceService: HumanResourceService
  ) {
    super()
  }

  ngOnChanges() {
    const findSituation = this.humanResourceService.findSituation(
      this.currentHR,
      today()
    )
    this.activities = (findSituation && findSituation.activities) || []

    this.indisponibility = fixDecimal(
      sumBy(this.indisponibilities, 'percent') / 100
    )
    if (this.indisponibility > 1) {
      this.indisponibility = 1
    }

    const dateEndToJuridiction = this.currentHR && this.currentHR.dateEnd ? today(this.currentHR.dateEnd) : null
    if (
      dateEndToJuridiction &&
      this.dateStart &&
      dateEndToJuridiction.getTime() <= this.dateStart.getTime()
    ) {
      this.timeWorked = 'Parti'
    } else {
      this.timeWorked = etpLabel(this.etp)
    }

    this.onLoadComment()
  }

  onLoadComment() {
    if (this.currentHR) {
      this.hRCommentService.getHRComment(this.currentHR.id).then((result) => {
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
      if (this.currentHR) {
        this.hRCommentService
          .updateHRComment(this.currentHR.id, comment)
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
