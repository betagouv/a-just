import { Component, Input, OnInit } from '@angular/core'
/**
 * Composant d'affichage du TMD (Widget)
 */
@Component({
  selector: 'aj-figures-widget',
  templateUrl: './figures-widget.component.html',
  styleUrls: ['./figures-widget.component.scss'],
})
export class FiguresWidgetComponent {
  /**
   * Date de début de simulation
   */
  @Input() dateStart: string = ''
  /**
   * Date de fin de simulation
   */
  @Input() dateStop: string = ''
  /**
   * TMD aujourd'hui
   */
  @Input() valueAt: string = ''
  /**
   * TMD projeté
   */
  @Input() valueProjected: string = ''
  /**
   * TMD simulé
   */
  @Input() valueSimulated: string = ''

  /**
   * Constructeur
   */
  constructor() {}
}
