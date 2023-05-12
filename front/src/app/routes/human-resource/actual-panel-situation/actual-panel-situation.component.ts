import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { today } from 'src/app/utils/dates'

/**
 * Panneau de la situation actuelle
 */

@Component({
  selector: 'actual-panel-situation',
  templateUrl: './actual-panel-situation.component.html',
  styleUrls: ['./actual-panel-situation.component.scss'],
})
export class ActualPanelSituationComponent
  extends MainClass
  implements OnChanges
{
  /**
   * Fiche courante
   */
  @Input() currentHR: HumanResourceInterface | null = null
  /** 
   * Date de début de la situation actuelle
   */
  @Input() dateStart: Date | null = null
  /**
   * Date de fin de la situation actuelle
   */
  @Input() dateStop: Date | null = null
  /**
   * Affiche ou non un bouton "modifier la situation"
   */
  @Input() canEdit: boolean = false
  /**
   * Affiche ou non un bouton "Supprimer la situation"
   */
  @Input() canRemoveSituation: boolean = false
  /**
   * Affiche l'ETP calculé
   */
  @Input() etp: number = 0
  /**
   * Liste des indispo courrante
   */
  @Input() indisponibilities: RHActivityInterface[] = []
  /**
   * Force to show sub contentieux
   */
  @Input() forceToShowContentieuxDetail: boolean = false
  /**
   * Event lors du choix d'éditer une ventilation
   */
  @Output() editVentilation = new EventEmitter()
  /**
   * Event lors du choix de supprimer une indispo
   */
  @Output() onRemove = new EventEmitter()
  /**
   * ETP des indispo
   */
  indisponibility: number = 0
  /**
   * Temps de travail en text
   */
  timeWorked: string = ''
  /**
   * Liste des activités de la situation
   */
  activities: RHActivityInterface[] = []

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
   * Detection lors du changement d'une des entrées pour le changement complet du rendu
   */
  ngOnChanges() {
    const findSituation = this.humanResourceService.findSituation(
      this.currentHR,
      today()
    )
    this.activities = (findSituation && findSituation.activities) || []
  }
}
