import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { UserService } from '../../../services/user/user.service'
import { CommonModule } from '@angular/common'
import { TextEditorComponent } from '../../../components/text-editor/text-editor.component'
import { CommentService } from '../../../services/comment/comment.service'
import { CommentInterface } from '../../../interfaces/comment'
import { OneCommentComponent } from './one-comment/one-comment.component'
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel'

/**
 * Composant des commentaires de la page d'activités
 */
@Component({
  selector: 'aj-comment-activities',
  standalone: true,
  imports: [MatIconModule, CommonModule, TextEditorComponent, OneCommentComponent],
  templateUrl: './comment-activities.component.html',
  styleUrls: ['./comment-activities.component.scss'],
})
export class CommentActivitiesComponent implements OnChanges {
  /**
   * Service utilisateur
   */
  userService = inject(UserService)
  /**
   * Service de gestion des commentaires
   */
  commentService = inject(CommentService)
  /**
   * Type of comment to categories
   */
  @Input() type: string = ''
  /**
   * Referentiel
   */
  @Input() referentiel: ContentieuReferentielInterface | null = null
  /**
   * On close popin
   */
  @Output() close: EventEmitter<any> = new EventEmitter()
  /**
   * List des commentaires
   */
  comments: CommentInterface[] = []
  /**
   * Commentaire principal
   */
  commentContent: string = ''

  /**
   * Load comment by type
   */
  ngOnChanges(change: SimpleChanges) {
    if (change['type'].previousValue !== change['type'].currentValue) {
      this.onLoad()
    }
  }

  /**
   * Load datas
   */
  async onLoad() {
    if (this.type) {
      const list = await this.commentService.getComments(this.type)
      this.comments = list
      if (this.referentiel) {
        this.referentiel.nbComments = this.comments.length
      }
    }
  }

  /**
   * sent new comment
   */
  async onSentComment(comment: string, id: number | null = null, editor: TextEditorComponent) {
    if (comment && this.type) {
      await this.commentService.updateComment(this.type, comment, id)
      editor.setValue('')
      await this.onLoad()
    }
  }

  /**
   * Remove comment
   * @param index
   */
  removeComment(index: number) {
    this.comments.splice(index, 1)
    if (this.referentiel) {
      this.referentiel.nbComments = this.comments.length
    }
  }
}
