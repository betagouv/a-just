import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core'

/**
 * Composant alert qui affiche une alerte non bloquante
 */

@Component({
  selector: 'aj-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnChanges {
  /**
   * Titre text dans l'alerte
   */
  @Input() alertTitle: string | undefined = ''
  /**
   * Message text dans l'alerte
   */
  @Input() alertMessage: string = ''
  /**
   * En option, mettre un delay de fermeture automatique de l'alerte
   */
  @Input() delay: number | undefined
  /**
   * Event, clique sur le bouton pour fermer l'alert
   */
  @Output() onClose: EventEmitter<boolean> = new EventEmitter()
  /**
   * Instance du timeout en cas de delay
   */
  timeout: any

  /**
   * Génération du timeaout en cas de changement de message ou du delay
   */
  ngOnChanges() {
    if (this.delay) {
      if (this.timeout) {
        clearTimeout(this.timeout)
        this.timeout = undefined
      }

      this.timeout = setTimeout(() => {
        this.onClose.emit(false)
        this.timeout = undefined
      }, this.delay * 1000)
    }
  }
}
