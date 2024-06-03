import { Component, EventEmitter, Input, OnChanges, Output, SimpleChange, SimpleChanges } from '@angular/core'
import { extend, now } from 'lodash'
import { MainClass } from 'src/app/libs/main-class'

/**
 * Composant de prévisualisation des ETP
 */
@Component({
  selector: 'passed-comment',
  templateUrl: './passed-comment.component.html',
  styleUrls: ['./passed-comment.component.scss'],
})
export class PassedCommentComponent extends MainClass implements OnChanges {
  /**
   * Object commentaire contenant l'ensemble des informations
   */
  @Input() comment: any | null = null

  @Output() onFocus = EventEmitter
  /**
   * Commentaire
   */
  commentContent: string = ''
  /**
   * Date de mise à jours du commentaire
   */
  commentUpdatedAt: Date | null = null
  /**
 * Utilisateur connecté
 */
  currentUser: any = {
    firstName: null,
    lastName: null,
    initials: null
  }
  /**
   * Constructeur
   */
  constructor() { super() }

  /**
 * Detection lors du changement d'une des entrées pour le changement complet du rendu
 */
  ngOnChanges(change: any) {
    if (change['comment']) {
      this.commentContent = change['comment'].currentValue.comment
      console.log(this.commentContent)
      this.commentUpdatedAt = change['comment'].currentValue.updatedAt ? new Date(change['comment'].currentValue.updatedAt) : null
      this.currentUser =
      {
        firstName: change['comment'].currentValue.editorFirstName,
        lastName: change['comment'].currentValue.editorLastName,
        initials: change['comment'].currentValue.editorInitials,
        id: change['comment'].currentValue.id
      }
    }
  }

  override onFocus(event:any){
    this.onFocus.emit()
  }
  save() { }
  updateComment(event: Event) { }
}
