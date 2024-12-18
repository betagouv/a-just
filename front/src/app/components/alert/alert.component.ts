import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { ActionsInterface, PopupComponent } from '../popup/popup.component';
import { SanitizeHtmlPipe } from '../../pipes/sanitize-html/sanitize-html.pipe';

/**
 * Composant alert qui affiche une alerte non bloquante
 */

@Component({
  selector: 'aj-alert',
  standalone: true,
  imports: [PopupComponent, SanitizeHtmlPipe],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnChanges {
  /**
   * Titre text dans l'alerte
   */
  @Input() alertTitle: string | undefined = '';
  /**
   * Message text dans l'alerte
   */
  @Input() alertMessage: string = '';
  /**
   * En option, mettre un delay de fermeture automatique de l'alerte
   */
  @Input() delay: number | undefined;
  /**
   * Texte du bouton ok
   */
  @Input() okText: string | undefined = '';
  /**
   * Texte du bouton secondary
   */
  @Input() secondaryText: string | undefined = '';
  /**
   * Texte du bouton secondary
   */
  @Input() classPopin: string | undefined = '';
  /**
   * Event, clique sur le bouton pour fermer l'alert
   */
  @Output() onClose: EventEmitter<boolean> = new EventEmitter();
  /**
   * Event, clique sur le bouton pour fermer l'alert
   */
  @Output() onCloseSecondary: EventEmitter<boolean> = new EventEmitter();
  /**
   * Instance du timeout en cas de delay
   */
  timeout: any;

  /**
   * Génération du timeaout en cas de changement de message ou du delay
   */
  ngOnChanges() {
    if (this.delay) {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }

      this.timeout = setTimeout(() => {
        this.onClose.emit(false);
        this.timeout = undefined;
      }, this.delay * 1000);
    }
  }

  /**
   * Close fonction
   */
  close(action: ActionsInterface) {
    switch (action.id) {
      case 'secondary':
        this.onCloseSecondary.emit(true);
        return;
      default:
        this.onClose.emit(true);
        return;
    }
  }
}
