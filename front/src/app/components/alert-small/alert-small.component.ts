import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActionsInterface } from '../popup/popup.component';
import { SanitizeHtmlPipe } from '../../pipes/sanitize-html/sanitize-html.pipe';
import { MatIconModule } from '@angular/material/icon';

/**
 * Composant alert qui affiche une alerte bloquante
 */

@Component({
  selector: 'aj-alert-small',
  standalone: true,
  imports: [SanitizeHtmlPipe, MatIconModule],
  templateUrl: './alert-small.component.html',
  styleUrls: ['./alert-small.component.scss'],
})
export class AlertSmallComponent {
  /**
   * Message text dans l'alerte
   */
  @Input() alertMessage: string = '';
  /**
   * Id de l'alerte
   */
  @Input() alertId: number = 0;
  /**
   * Event, clique sur le bouton pour fermer l'alert
   */
  @Output() onClose: EventEmitter<null> = new EventEmitter();

  /**
   * Close fonction
   */
  close() {
    this.onClose.emit();
  }
}
