import { Component, Input, OnChanges } from '@angular/core'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { MainClass } from 'src/app/libs/main-class'
import { HRCommentService } from 'src/app/services/hr-comment/hr-comment.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'

/**
 * Panneau de présentation d'une fiche
 */

@Component({
  selector: 'comment-profil',
  templateUrl: './comment-profil.component.html',
  styleUrls: ['./comment-profil.component.scss'],
})
export class CommentProfilComponent extends MainClass implements OnChanges {
  /**
   * Fiche courante
   */
  @Input() currentHR: HumanResourceInterface | null = null
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
   * Constructeur
   * @param hRCommentService
   */
  constructor(
    private hRCommentService: HRCommentService) {
    super()
  }

  /**
   * Detection lors du changement d'une des entrées pour le changement complet du rendu
   */
  ngOnChanges() {
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
