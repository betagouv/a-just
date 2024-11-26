import {
  Component,
  EventEmitter,
  OnChanges,
  OnDestroy,
  Output,
} from '@angular/core';
import { MainClass } from '../../libs/main-class';
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel';

/**
 * Composant d'affichage de la liste des ventilations en grilles
 */

@Component({
  selector: 'panel-effectif',
  standalone: true,
  imports: [],
  templateUrl: './panel-effectif.component.html',
  styleUrls: ['./panel-effectif.component.scss'],
})
export class PanelActivitiesComponent
  extends MainClass
  implements OnChanges, OnDestroy
{
  /**
   * Informe le parent d'une modification
   */
  @Output() referentielChange: EventEmitter<ContentieuReferentielInterface[]> =
    new EventEmitter();
  /**
   * Constructeur
   * @param humanResourceService
   */
  constructor() {
    super();
  }

  /**
   * Détection d'un changement et génération des données du rendu
   */
  ngOnChanges() {}

  /**
   * Destruction des watcher
   */
  ngOnDestroy() {}
}
