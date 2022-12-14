import {
  Component,
  Input,
} from '@angular/core'

/**
 * Composant de mise en page en mode non connecté
 */

@Component({
  selector: 'aj-wrapper-no-connected',
  templateUrl: './wrapper-no-connected.component.html',
  styleUrls: ['./wrapper-no-connected.component.scss'],
})
export class WrapperNoConnectedComponent {
  /**
   * Titre de la page du paneau gauche
   */
  @Input() title: string = ''
}
