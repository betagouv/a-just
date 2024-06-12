import { ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core'
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
  comment: string | undefined = ''
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
   * Reset editor status
   */
  resetEditor = false
  /**
   * focus
   */
  isEditing: boolean = false
  /**
   * Show all comments
   */
  showAll = false
  /**
   * Constructeur
   * @param hRCommentService
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
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
        userId: data.id,
        commentId: data.commentId
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
        this.comments = result.sort((a: any, b: any) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        this.comment = ''
        this.currentComment = this.comment
        this.commentUpdatedAt = null
        if (!this.comments.length)
          this.showAll = true
        this.changeDetectorRef.detectChanges()
      })
    }
  }

  /**
   * Mise à jour du commentaire de la fiche
   * @param comment 
   */
  updateComment(comment: string) {
    this.currentComment = comment
    this.changeDetectorRef.detectChanges()
  }

  /**
   * Sauvegarde un nouveau commentaire
   */
  save() {
    this.timeoutUpdateComment = setTimeout(() => {
      if (this.currentHR) {
        this.hRCommentService
          .updateHRComment(this.currentHR.id, this.currentComment, this.currentUser.userId, this.currentUser.commentId)
          .then(() => {
            this.comment = ''
            this.currentComment = ''
            this.commentUpdatedAt = null
            this.resetEditor = true
            this.isEditing = false
            this.changeDetectorRef.detectChanges()
            this.onLoadComment()
          })
      }
    }, 100)
  }

  /**
   * Recharge l'ensemble des commentaires d'une fiche
   * @param event 
   */
  reloadCheck(event: any) {
    if (event === true) this.onLoadComment()
  }

  /**
   * Prend le focus sur le champs de saisi d'un nouveau commentaire
   * @param event 
   */
  getFocusOn(event: any) {
    if (event === true)
      this.isEditing = event
    setTimeout(() => {
      this.changeDetectorRef.detectChanges()
    }, 50)
  }

  /**
  * Scroll to top
  */
  scrollToTop() {
    window.scrollTo(0, 0)
  }
}