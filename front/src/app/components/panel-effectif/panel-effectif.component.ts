import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
} from '@angular/core'
import { sumBy } from 'lodash'
import { REFERENTIELS_CANT_UPDATED } from 'src/app/constants/referentiel'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { copyArray } from 'src/app/utils/array'
import { fixDecimal } from 'src/app/utils/numbers'

/**
 * Composant d'affichage de la liste des ventilations en grilles
 */

@Component({
  selector: 'panel-effectif',
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
    new EventEmitter()
  /**
   * Constructeur
   * @param humanResourceService 
   */
  constructor(
    private humanResourceService: HumanResourceService
  ) {
    super()
  }

  /**
   * Détection d'un changement et génération des données du rendu
   */
  ngOnChanges() {
  }

  /**
   * Destruction des watcher
   */
  ngOnDestroy() {
  }
}
