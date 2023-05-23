import { Component, Input, OnChanges, OnInit } from '@angular/core'

/**
 * Composant barres de chargement simulateur
 */
@Component({
  selector: 'aj-loaders-widget',
  templateUrl: './loaders-widget.component.html',
  styleUrls: ['./loaders-widget.component.scss'],
})
export class LoadersWidgetComponent implements OnChanges {
      /**
   * Date de début de simulation
   */
      @Input() print: boolean = false
  /**
   * Date de début de simulation
   */
  @Input() dateStart: string = ''
  /**
   * Date de fin de simulation
   */
  @Input() dateStop: string = ''
  /**
   * Valeur à aujourd'hui
   */
  @Input() valueAt: string = ''
  /**
   * Valeur projetée
   */
  @Input() valueProjected: string = ''
  /**
   * Valeur simulée
   */
  @Input() valueSimulated: string = ''
  /** Valeur par défaut bar 1 */
  valueBar1 = 100
  /** Valeur par défaut bar 2 */
  valueBar2 = 100

  /**
   * Constructeur
   */
  constructor() {}

  /**
   * Ecoute la valeur de la simulation afin d'augmenter/diminuer la jauge
   */
  ngOnChanges(): void {
    if (this.valueAt !== '') {
      const delta =
        ((parseFloat(this.valueAt.split(' ')[0]) -
          parseFloat(this.valueProjected.split(' ')[0])) /
          parseFloat(this.valueAt.split(' ')[0])) *
        100
      this.valueBar1 = delta <= 100 && delta >= 0 ? delta : 0
    }
    if (this.valueSimulated !== '') {
      const delta =
        ((parseFloat(this.valueAt.split(' ')[0]) -
          parseFloat(this.valueSimulated.split(' ')[0])) /
          parseFloat(this.valueAt.split(' ')[0])) *
        100
      this.valueBar2 = delta <= 100 && delta >= 0 ? delta : 0
    }
  }
}
