import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { MainClass } from '../../../libs/main-class';
import { CommonModule } from '@angular/common';
import { PanelActivitiesComponent } from '../../../components/panel-activities/panel-activities.component';
import { HumanResourceInterface } from '../../../interfaces/human-resource-interface';
import { RHActivityInterface } from '../../../interfaces/rh-activity';
import { HRCategoryInterface } from '../../../interfaces/hr-category';
import { HumanResourceService } from '../../../services/human-resource/human-resource.service';
import { today } from '../../../utils/dates';
import { MatIconModule } from '@angular/material/icon';

/**
 * Panneau de la situation actuelle
 */

@Component({
  selector: 'actual-panel-situation',
  standalone: true,
  imports: [CommonModule, PanelActivitiesComponent, MatIconModule],
  templateUrl: './actual-panel-situation.component.html',
  styleUrls: ['./actual-panel-situation.component.scss'],
})
export class ActualPanelSituationComponent
  extends MainClass
  implements OnChanges
{
  humanResourceService = inject(HumanResourceService);
  /**
   * Fiche courante
   */
  @Input() currentHR: HumanResourceInterface | null = null;
  /**
   * Date de début de la situation actuelle
   */
  @Input() dateStart: Date | null = null;
  /**
   * Date de fin de la situation actuelle
   */
  @Input() dateStop: Date | null = null;
  /**
   * Affiche ou non un bouton "modifier la situation"
   */
  @Input() canEdit: boolean = false;
  /**
   * Affiche ou non un bouton "Supprimer la situation"
   */
  @Input() canRemoveSituation: boolean = false;
  /**
   * Affiche l'ETP calculé
   */
  @Input() etp: number = 0;
  /**
   * Liste des indispo courrante
   */
  @Input() indisponibilities: RHActivityInterface[] = [];
  /**
   * Force to show sub contentieux
   */
  @Input() forceToShowContentieuxDetail: boolean = false;
  /**
   * Categorie courante
   */
  @Input() category: HRCategoryInterface | null = null;
  /**
   * Event lors du choix d'éditer une ventilation
   */
  @Output() editVentilation = new EventEmitter();
  /**
   * Event lors du choix de supprimer une indispo
   */
  @Output() onRemove = new EventEmitter();
  /**
   * ETP des indispo
   */
  indisponibility: number = 0;
  /**
   * Temps de travail en text
   */
  timeWorked: string = '';
  /**
   * Liste des activités de la situation
   */
  activities: RHActivityInterface[] = [];

  /**
   * Constructeur
   */
  constructor() {
    super();
  }

  /**
   * Detection lors du changement d'une des entrées pour le changement complet du rendu
   */
  ngOnChanges() {
    const findSituation = this.humanResourceService.findSituation(
      this.currentHR,
      today()
    );
    // @ts-ignore
    this.activities = (findSituation && findSituation.activities) || [];
  }
}
