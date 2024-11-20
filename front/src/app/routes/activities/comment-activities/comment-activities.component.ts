import { Component, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../services/user/user.service';
import { CommonModule } from '@angular/common';
import { TextEditorComponent } from '../../../components/text-editor/text-editor.component';
import { CommentService } from '../../../services/comment/comment.service';

/**
 * Composant des commentaires de la page d'activités
 */
@Component({
  selector: 'aj-comment-activities',
  standalone: true,
  imports: [MatIconModule, CommonModule, TextEditorComponent],
  templateUrl: './comment-activities.component.html',
  styleUrls: ['./comment-activities.component.scss'],
})
export class CommentActivitiesComponent {
  // service utilisateur
  userService = inject(UserService);
  // service de gestion des commentaires
  commentService = inject(CommentService);
  /**
   * Type of comment to categories
   */
  @Input() type: string = '';
  /**
   * List des commentaires
   */
  comments: [] = [];
}
