
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MainClass } from '../../../../libs/main-class';
import { CommentInterface } from '../../../../interfaces/comment';
import { TextEditorComponent } from '../../../../components/text-editor/text-editor.component';
import { CommentService } from '../../../../services/comment/comment.service';

/**
 * Composant de prévisualisation des ETP
 */
@Component({
  selector: 'one-comment',
  standalone: true,
  imports: [TextEditorComponent],
  templateUrl: './one-comment.component.html',
  styleUrls: ['./one-comment.component.scss'],
})
export class OneCommentComponent extends MainClass {
  // service de gestion des commentaires
  commentService = inject(CommentService);
  /**
   * Object commentaire contenant l'ensemble des informations
   */
  @Input() comment: CommentInterface | null = null;
  /**
   * Event to informe to remove comment
   */
  @Output() deletedComment: EventEmitter<any> = new EventEmitter();
  /**
   * Is editing
   */
  isEditing: boolean = false;

  /**
   * Constructeur
   */
  constructor() {
    super();
  }

  /**
   * Sauvegarder commentaire passé
   */
  async onSave(commentMsg: string) {
    if (commentMsg && this.comment) {
      await this.commentService.updateComment(
        this.comment.type,
        commentMsg,
        this.comment.id
      );
      this.comment.comment = commentMsg;
      this.comment.updatedAt = new Date();
    }
  }

  /**
   * Suppression d'un commentaire
   */
  async removeComment() {
    if (this.comment) {
      await this.commentService.deleteComment(this.comment.id);
      this.deletedComment.emit(true);
    }
  }

  /**
   * Compare la date de création à la date de derniere mise à jour
   * @returns
   */
  compareCommentsDates() {
    if (this.comment && this.comment.createdAt && this.comment.updatedAt) {
      if (
        this.formatDate(this.comment.createdAt) ==
        this.formatDate(this.comment.updatedAt)
      )
        return false;
    }
    return true;
  }

  /**
   * Mets la premiere lettre d'un mot en majuscule
   * @param s
   * @returns
   */
  capitalize(s: string) {
    return s && s[0].toUpperCase() + s.slice(1);
  }
}
