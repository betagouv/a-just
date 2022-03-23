import { Component, Input, OnChanges } from '@angular/core';
import { sumBy } from 'lodash';
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
import { MainClass } from 'src/app/libs/main-class';
import { HRCommentService } from 'src/app/services/hr-comment/hr-comment.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { fixDecimal } from 'src/app/utils/numbers';
import { etpLabel } from 'src/app/utils/referentiel';

@Component({
  selector: 'actual-panel-situation',
  templateUrl: './actual-panel-situation.component.html',
  styleUrls: ['./actual-panel-situation.component.scss'],
})
export class ActualPanelSituationComponent
  extends MainClass
  implements OnChanges
{
  @Input() dateStart: Date = new Date();
  @Input() dateStop: Date = new Date();
  @Input() dateEndToJuridiction: Date | null | undefined = null;
  @Input() fonction: HRFonctionInterface | null = null;
  @Input() etp: number = 1;
  @Input() indisponibilities: RHActivityInterface[] = [];
  @Input() activities: RHActivityInterface[] = [];
  @Input() RHId: number | null = null;
  @Input() id: number | null = null;
  indisponibility: number = 0;
  timeWorked: string = '';
  comment: string = '';
  commentUpdatedAt: Date | null = null;
  timeoutUpdateComment: any = null;

  constructor(
    private humanResourceService: HumanResourceService,
    private hRCommentService: HRCommentService
  ) {
    super();
  }

  ngOnChanges() {
    const referentiel = this.humanResourceService.allContentieuxReferentiel;

    this.indisponibility = fixDecimal(
      sumBy(this.indisponibilities, 'percent') / 100
    );
    this.indisponibilities = this.indisponibilities.map((i) => {
      if (!i.contentieux) {
        i.contentieux = referentiel.find((r) => r.id === i.referentielId);
      }

      return i;
    });

    if(this.dateEndToJuridiction && this.dateEndToJuridiction.getTime() <= this.dateStop.getTime()) {
      this.timeWorked = 'Parti';
    } else {
      this.timeWorked = etpLabel(this.etp);
    }

    this.onLoadComment();
  }

  onLoadComment() {
    if (this.RHId) {
      this.hRCommentService.getHRComment(this.RHId).then((result) => {
        this.comment = (result && result.comment) || '';
        this.commentUpdatedAt = result && result.updatedAt ? new Date(result.updatedAt) : null;
      });
    }
  }

  updateComment(comment: string) {
    if (this.timeoutUpdateComment) {
      clearTimeout(this.timeoutUpdateComment);
      this.timeoutUpdateComment = null;
    }

    this.timeoutUpdateComment = setTimeout(() => {
      if (this.RHId) {
        this.hRCommentService
          .updateHRComment(this.RHId, comment)
          .then((result) => {
            this.commentUpdatedAt = result ? new Date(result) : null;
          });
      }
    }, 1000);
  }

  onRemoveSituation() {
    if(this.id) {
      this.humanResourceService.removeSituation(this.id)
    }
  }

  onEditSituation() {
    
  }
}
