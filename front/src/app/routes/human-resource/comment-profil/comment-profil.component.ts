import { Component, Input, OnChanges } from '@angular/core'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { MainClass } from 'src/app/libs/main-class'
import { HRCommentService } from 'src/app/services/hr-comment/hr-comment.service'
import { UserService } from 'src/app/services/user/user.service'

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
   * Liste de commentaire d'une fiche
   */
  comments: string[] = []
  /**
   * Date de mise à jours du commentaire
   */
  commentUpdatedAt: Date | null = null
  /**
   * instance créé lors de la modification d'une fiche
   */
  timeoutUpdateComment: any = null
  /**
   * Utilisateur connecté
   */
  currentUser: any = {
    firstName: null,
    lastName: null,
    initials: null
  }
  /**
   * Dernier commentaire en date
   */
  currentComment = ''
  /**
   * Constructeur
   * @param hRCommentService
   */
  constructor(
    private hRCommentService: HRCommentService,
    private userService: UserService) {
    super()

    this.userService.me().then((data) => {
      console.log(data)
      this.currentUser =
      {
        firstName: data.firstName,
        lastName: data.lastName,
        initials: data.firstName.charAt(0) + data.lastName.charAt(0),
        userId: data.id
      }
    })
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
        if (result.length > 0) {
          /**
          this.comment = (result && result.comment) || ''
          this.currentComment = this.comment
          this.commentUpdatedAt =
            result && result.updatedAt ? new Date(result.updatedAt) : null
             */
          this.comments = result
          console.log(this.comments)
        }
        else {
          this.comment = ''
          this.currentComment = this.comment
          this.commentUpdatedAt = null
        }
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
    this.currentComment = comment
  }

  save() {
    this.timeoutUpdateComment = setTimeout(() => {
      if (this.currentHR) {

        this.hRCommentService
          .updateHRComment(this.currentHR.id, this.currentComment, this.currentUser.userId)
          .then((result) => {
            this.commentUpdatedAt = result ? new Date(result) : null
          })
      }
    }, 100)
  }
}