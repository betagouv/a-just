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

/**
 * Panneau de la situation actuelle
 */

@Component({
  selector: 'actual-panel-situation',
  templateUrl: './actual-panel-situation.component.html',
  styleUrls: ['./actual-panel-situation.component.scss'],
})
export class ActualPanelSituationComponent
  extends MainClass
  implements OnChanges
{
  /**
   * Fiche courante
   */
  @Input() currentHR: HumanResourceInterface | null = null
  /** 
   * Date de début de la situation actuelle
   */
  @Input() dateStart: Date | null = null
  /**
   * Date de fin de la situation actuelle
   */
  @Input() dateStop: Date | null = null
  /**
   * Affiche ou non un bouton "modifier la situation"
   */
  @Input() canEdit: boolean = false
  /**
   * Affiche ou non un bouton "Supprimer la situation"
   */
  @Input() canRemoveSituation: boolean = false
  /**
   * Affiche l'ETP calculé
   */
  @Input() etp: number = 0
  /**
   * Fonction courante
   */
  @Input() fonction: HRFonctionInterface | null = null
  /**
   * Liste des indispo courrante
   */
  @Input() indisponibilities: RHActivityInterface[] = []
  /**
   * Force to show sub contentieux
   */
  @Input() forceToShowContentieuxDetail: boolean = false
  /**
   * Event lors du choix d'éditer une ventilation
   */
  @Output() editVentilation = new EventEmitter()
  /**
   * Event lors du choix d'ajouter une indispo
   */
  @Output() addIndispiniblity = new EventEmitter()
  /**
   * Event lors du choix de supprimer une indispo
   */
  @Output() onRemove = new EventEmitter()
  /**
   * ETP des indispo
   */
  indisponibility: number = 0
  /**
   * Temps de travail en text
   */
  timeWorked: string = ''
  /**
   * Commentaire de la fiche
   */
  comment: string = ''
  /**
   * Date de mise à jours du commentaire
   */
  commentUpdatedAt: Date | null = null
  /**
   * instance créé lors de la modification d'une fiche
   */
  timeoutUpdateComment: any = null
  /**
   * Liste des activités de la situation
   */
  activities: RHActivityInterface[] = []

  /**
   * Constructeur
   * @param hRCommentService
   * @param humanResourceService 
   */
  constructor(
    private hRCommentService: HRCommentService,
    private humanResourceService: HumanResourceService
  ) {
    super()
  }

  /**
   * Detection lors du changement d'une des entrées pour le changement complet du rendu
   */
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

  /**
   * Chargement du commentaire d'une fiche
   */
  onLoadComment() {
    if (this.currentHR) {
      this.hRCommentService.getHRComment(this.currentHR.id).then((result) => {
        this.comment = (result && result.comment) || ''
        this.commentUpdatedAt =
          result && result.updatedAt ? new Date(result.updatedAt) : null
      })
    }
  }

  /**
   * Mise à jour du commentaire de la fiche
   * @param comment 
   */
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
}
