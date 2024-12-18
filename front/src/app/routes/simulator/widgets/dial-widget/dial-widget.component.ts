import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CoveragePreviewComponent } from '../coverage-preview/coverage-preview.component';

/**
 * Composant d'affichage du widget taux de couverture
 */
@Component({
  selector: 'aj-dial-widget',
  standalone: true,
  imports: [CommonModule, CoveragePreviewComponent],
  templateUrl: './dial-widget.component.html',
  styleUrls: ['./dial-widget.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 })),
      ]),
      transition(':leave', [animate(500, style({ opacity: 0 }))]),
    ]),
  ],
})
export class DialWidgetComponent {
  /**
   * Date de début de simulation
   */
  @Input() print: boolean = false;
  /**
   * Date de début de simulation
   */
  @Input() dateStart: string = '';
  /**
   * Date de fin de simulation
   */
  @Input() dateStop: string = '';
  /**
   * Valeur projeté
   */
  @Input() valueProjected: string = '';
  /**
   * Valeur simulé
   */
  @Input() valueSimulated: string = '';
  /**
   * Choix de la situation à afficher
   */
  selectedSituation = 'simulated';

  /**
   * Constructeur
   */
  constructor() {}

  /**
   * Cast d'une string en integer
   * @param str chainse de caractère d'un nombre entier
   * @returns
   */
  toNumber(str: string): number {
    return parseInt(str);
  }

  /**
   * Switch des valeurs à afficher
   */
  permuteValues() {
    const tmpVal = String(this.valueProjected);
    this.valueProjected = this.valueSimulated;
    this.valueSimulated = tmpVal;
  }
}
