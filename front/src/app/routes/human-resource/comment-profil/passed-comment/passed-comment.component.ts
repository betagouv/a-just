import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';
import { MainClass } from '../../../../libs/main-class';
import { HumanResourceInterface } from '../../../../interfaces/human-resource-interface';
import { HRCommentService } from '../../../../services/hr-comment/hr-comment.service';
import { FormsModule } from '@angular/forms';
import { TextEditorComponent } from '../../../../components/text-editor/text-editor.component';

/**
 * Composant de prévisualisation des ETP
 */
@Component({
  selector: 'passed-comment',
  standalone: true,
  imports: [CommonModule, FormsModule, TextEditorComponent],
  templateUrl: './passed-comment.component.html',
  styleUrls: ['./passed-comment.component.scss'],
})
export class PassedCommentComponent extends MainClass implements OnChanges {
  /**
   * Editor
   */
  @ViewChild('editor') editor: TextEditorComponent | null = null;
  /**
   * Editor
   */
  /**
   * Object commentaire contenant l'ensemble des informations
   */
  @Input() comment: any | null = null;
  /**
   * Fiche courante
   */
  @Input() currentHR: HumanResourceInterface | null = null;
  /**
   * Suppression event
   */
  @Output() deletedComment = new EventEmitter();
  /**
   * Commentaire initial
   */
  commentContent: string = '';
  /**
   * Commentaire modifié
   */
  currentText: string = '';
  /**
   * Date de création du commentaire
   */
  commentUpdatedAt: Date | null = null;
  /**
   * Date de mise à jours du commentaire
   */
  commentCreatedAt: Date | null = null;
  /**
   * Utilisateur connecté
   */
  currentUser: any = {
    firstName: null,
    lastName: null,
    initials: null,
  };
  /**
   * focus commentaire
   */
  isEditing: boolean = false;

  valueToReset: string | null = null;
  /**
   * Constructeur
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private hRCommentService: HRCommentService
  ) {
    super();
  }

  /**
   * Detection lors du changement d'une des entrées pour le changement complet du rendu
   */
  ngOnChanges(change: any) {
    if (change['comment']) {
      this.currentUser = {
        firstName: change['comment'].currentValue.editorFirstName,
        lastName: change['comment'].currentValue.editorLastName,
        initials: change['comment'].currentValue.editorInitials,
        id: change['comment'].currentValue['user_id'],
        commentId: change['comment'].currentValue.commentId,
      };
    }
    this.onLoadComment();
  }

  /**
   * Chargement du commentaire d'une fiche
   */
  onLoadComment() {
    if (this.comment !== null && this.currentHR) {
      this.hRCommentService
        .getHRCommentByCommentId(this.comment.commentId, this.currentHR.id)
        .then((result) => {
          if (result) {
            this.commentContent = (result && result.comment) || '';
            this.currentText = this.commentContent;
            this.commentUpdatedAt =
              result && result.updatedAt ? new Date(result.updatedAt) : null;
            this.commentCreatedAt =
              result && result.createdAt ? new Date(result.createdAt) : null;
          } else {
            this.comment = '';
            this.commentUpdatedAt = null;
          }
          this.changeDetectorRef.detectChanges();
        });
    }
  }

  /**
   * Mise à jour du commentaire de la fiche
   * @param comment
   */
  updateComment(comment: string) {
    this.currentText = comment;
  }

  /**
   * Sauvegarder commentaire passé
   */
  save() {
    if (this.currentHR) {
      this.hRCommentService
        .updateHRComment(
          this.currentHR.id,
          this.currentText,
          this.currentUser.id,
          this.currentUser.commentId
        )
        .then((result) => {
          this.editor?.initValue(this.currentText);
          this.commentUpdatedAt = result ? new Date(result) : null;
          this.isEditing = false;
          this.hRCommentService.mainEditing.next(false);
        });
    }
  }

  /**
   * Suppression d'un commentaire
   */
  removeComment() {
    if (
      this.currentHR &&
      this.hRCommentService.mainEditing.getValue() === false
    ) {
      this.hRCommentService
        .deleteHRComment(this.currentUser.commentId, this.currentHR.id)
        .then(() => {
          this.hRCommentService.mainEditing.next(false);
          this.deletedComment.emit(true);
        });
    }
  }

  /**
   * Compare la date de création à la date de derniere mise à jour
   * @returns
   */
  compareCommentsDates() {
    if (this.commentCreatedAt && this.commentUpdatedAt) {
      if (
        this.formatDate(this.commentCreatedAt) ==
        this.formatDate(this.commentUpdatedAt)
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

  /**
   * Reset la valeur du commentaire non sauvegardé
   */
  setOldValue() {
    this.currentText = this.commentContent;
    this.valueToReset = this.commentContent;
    this.isEditing = false;
    this.hRCommentService.mainEditing.next(false);
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Confirmation de la réinitialisation de l'éditeur
   */
  reset() {
    setTimeout(() => {
      this.valueToReset = null;
      this.isEditing = false;
      this.changeDetectorRef.detectChanges();
    }, 100);
  }

  /**
   * Récupere le focus sur l'ensemble des commentaires
   * @param event
   */
  getFocusOn(event: any) {
    if (event === true && !this.hRCommentService.mainEditing.getValue()) {
      this.isEditing = event;
      this.hRCommentService.mainEditing.next(true);
    }
    setTimeout(() => {
      this.changeDetectorRef.detectChanges();
    }, 50);
  }
}
