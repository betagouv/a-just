import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';

/**
 * Composant barres de chargement simulateur
 */
@Component({
  selector: 'aj-loaders-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loaders-widget.component.html',
  styleUrls: ['./loaders-widget.component.scss'],
})
export class LoadersWidgetComponent implements OnChanges {
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
   * Valeur à aujourd'hui
   */
  @Input() valueAt: string = '';
  /**
   * Valeur projetée
   */
  @Input() valueProjected: string = '';
  /**
   * Valeur simulée
   */
  @Input() valueSimulated: string = '';
  /** Valeur par défaut bar 1 */
  valueBar0 = 100;
  /** Valeur par défaut bar 1 */
  valueBar1 = 100;
  /** Valeur par défaut bar 2 */
  valueBar2 = 100;

  /**
   * Constructeur
   */
  constructor() {}

  /**
   * Ecoute la valeur de la simulation afin d'augmenter/diminuer la jauge
   */
  ngOnChanges(): void {
    const at = parseFloat(this.valueAt.split(' ')[0]);
    const projected = parseFloat(this.valueProjected.split(' ')[0]);
    const simulated = parseFloat(this.valueSimulated.split(' ')[0]);

    const values = [at, projected, simulated];
    const max = Math.max(...values);

    if (max > 0) {
      this.valueBar0 = 100 - (at / max) * 100;
      this.valueBar1 = 100 - (projected / max) * 100;
      this.valueBar2 = 100 - (simulated / max) * 100;
    } else {
      this.valueBar0 = 0;
      this.valueBar1 = 0;
      this.valueBar2 = 0;
    }
  }
}
