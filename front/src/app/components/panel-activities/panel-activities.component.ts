import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
} from '@angular/core';
import { sumBy } from 'lodash';
import { ProgressionBarComponent } from './progression-bar/progression-bar.component';
import { MainClass } from '../../libs/main-class';
import { RHActivityInterface } from '../../interfaces/rh-activity';
import { HRCategoryInterface } from '../../interfaces/hr-category';
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel';
import {
  DDG_REFERENTIELS_EAM,
  DDG_REFERENTIELS_EAM_CA,
  DDG_REFERENTIELS_GREFFE,
  DDG_REFERENTIELS_GREFFE_CA,
  DDG_REFERENTIELS_MAG,
  DDG_REFERENTIELS_MAG_CA,
  getReferentielCADetail,
  getReferentielDetail,
  REFERENTIELS_CANT_UPDATED,
} from '../../constants/referentiel';
import { OPACITY_20 } from '../../constants/colors';
import { HumanResourceService } from '../../services/human-resource/human-resource.service';
import { UserService } from '../../services/user/user.service';
import { importedVentillation } from '../../routes/human-resource/add-ventilation/add-ventilation.component';
import { fixDecimal } from '../../utils/numbers';
import { copyArray } from '../../utils/array';
import { CommonModule } from '@angular/common';

/**
 * Composant d'affichage de la liste des ventilations en grilles
 */

@Component({
  selector: 'panel-activities',
  standalone: true,
  imports: [ProgressionBarComponent, CommonModule],
  templateUrl: './panel-activities.component.html',
  styleUrls: ['./panel-activities.component.scss'],
})
export class PanelActivitiesComponent
  extends MainClass
  implements OnChanges, OnDestroy
{
  /**
   * Valeure de l'ETP
   */
  @Input() etp: number = 1;
  /**
   * Liste des activités à trier
   */
  @Input() activities: RHActivityInterface[] = [];
  /**
   * Affichage du panneau des sous contentieux ou non
   */
  @Input() selected: boolean = false;
  /**
   * Affichage du header ou non
   */
  @Input() header: boolean = true;
  /**
   * Autorise ou non la mise à jour du parent dès le premir chagement
   */
  @Input() updateRefentielOnLoad: boolean = true;
  /**
   * Authorise la modification des % sélectionné
   */
  @Input() canSelectedTopReferentiel: boolean = false;
  /**
   * Force pour afficher les sous contentieux
   */
  @Input() forceToShowContentieuxDetail: boolean = false;
  /**
   * Show to place holder whihout information
   */
  @Input() showPlaceHolder: boolean = false;
  /**
   * Show to place holder whihout information
   */
  @Input() indexSituation: number | null = null;
  /**
   * Categorie courante
   */
  @Input() category: HRCategoryInterface | null = null;
  /**
   * Permet de savoir si le panel est en cours d'édition
   */
  @Input() isEdited: boolean = false;
  /**
   * Informe le parent d'une modification
   */
  @Output() referentielChange: EventEmitter<ContentieuReferentielInterface[]> =
    new EventEmitter();
  /**
   * Liste du référentiel
   */
  referentiel: ContentieuReferentielInterface[] = [];
  /**
   * Total pourcent affecté
   */
  percentAffected: number = 0;
  /**
   * Contientieux sélectionné
   */
  refIndexSelected: number = -1;
  /**
   * Réfentiels que l'on ne peut pas modifier
   */
  REFERENTIELS_CANT_UPDATED = REFERENTIELS_CANT_UPDATED;
  /**
   * État de la souris si elle hover un sous-référentiel du contentieux 'Autres Activités'
   */
  mouseHovering: boolean = false;
  /**
   * Nom du sous-rérérentiel du contentieux 'Autres Activités' survolé
   */
  hoveredReferentielLabel: string | null = null;
  /**
   * Detail du référentiel survolé
   */
  hoveredReferentielDetail: string | null = null;
  /**
   * Opacité du background des contentieux
   */
  OPACITY = OPACITY_20;

  /**
   * Constructeur
   * @param humanResourceService
   */
  constructor(
    private humanResourceService: HumanResourceService,
    public userService: UserService
  ) {
    super();

    this.watch(
      this.humanResourceService.importedSituation.subscribe((referentiel) => {
        this.activities = [];
        if (
          referentiel?.index === this.indexSituation &&
          referentiel?.index !== null
        ) {
          referentiel?.ventillation.map((elem: importedVentillation) => {
            this.onChangePercentWithoutTotalComputation(
              elem.referentiel,
              elem.percent || 0,
              elem.parentReferentiel
            );
          });
        }
      })
    );
  }

  /**
   * Détection d'un changement et génération des données du rendu
   */
  ngOnChanges() {
    if (this.etp < 0) {
      this.etp = 0;
    }

    // copy list of activities
    this.activities = JSON.parse(
      JSON.stringify(this.activities)
    ) as RHActivityInterface[];

    this.onLoadReferentiel();
  }

  /**
   * Destruction des watcher
   */
  ngOnDestroy() {
    this.watcherDestroy();
  }

  /**
   * Total de la ventilation affectée
   * @param ref
   * @returns
   */
  getPercentAffected(ref: ContentieuReferentielInterface) {
    const activity = this.activities.find((a) =>
      a.contentieux ? a.contentieux.id === ref.id : a.referentielId === ref.id
    );
    const percent = fixDecimal(
      activity && activity.percent ? activity.percent : 0
    );

    return {
      percent,
      totalAffected: (this.etp * (percent || 0)) / 100,
    };
  }

  /**
   * Chargement du référentiel et calcul des pourcents
   */
  onLoadReferentiel() {
    this.referentiel = copyArray(
      this.humanResourceService.contentieuxReferentielOnly.getValue()
    );

    /*const backupLabel = localStorage.getItem('backupLabel')
    backupLabel && filterReferentiels(this.referentiel, backupLabel)*/

    this.referentiel = this.referentiel.map((ref) => {
      const { percent, totalAffected } = this.getPercentAffected(ref);
      ref.percent = percent;
      ref.totalAffected = totalAffected;

      ref.childrens = (ref.childrens || []).map((c) => {
        const { percent, totalAffected } = this.getPercentAffected(c);
        c.percent = percent;
        c.totalAffected = totalAffected;
        return c;
      });
      return ref;
    });

    if (this.updateRefentielOnLoad) {
      this.referentielChange.emit(this.referentiel);
    }
    this.onTotalAffected();
  }

  /**
   * Conversion de la somme des réferentiel en pourcent
   */
  onTotalAffected() {
    this.percentAffected = fixDecimal(sumBy(this.referentiel, 'percent'), 1000);
  }

  /**
   * Ouverture et fermeture du paneau des sous contentieux
   * @param index
   */
  onTogglePanel(index: number) {
    if (index !== this.refIndexSelected) {
      this.refIndexSelected = index;
    } else {
      this.refIndexSelected = -1;
    }
  }

  /**
   * Changement du pourcentage d'une activitié
   * @param referentiel
   * @param percent
   * @param parentReferentiel
   */
  onChangePercent(
    referentiel: ContentieuReferentielInterface,
    percent: number,
    parentReferentiel: ContentieuReferentielInterface | null = null
  ) {
    console.log('REF', referentiel.id);
    // memorise list
    const activity = this.activities.find(
      (a) => a.contentieux.id === referentiel.id
    );
    if (activity) {
      activity.percent = percent;
    } else {
      this.activities.push({
        id: -1,
        contentieux: {
          id: referentiel.id,
          label: '',
          averageProcessingTime: 0,
        },
        referentielId: referentiel.id,
        percent,
      });
    }

    // clean parent réferentiel
    if (parentReferentiel) {
      const mainActivity = this.activities.find(
        (a) => a.contentieux.id === parentReferentiel.id
      );
      const childId = (parentReferentiel.childrens || []).map((r) => r.id);
      const childActivities = this.activities.filter(
        (a) => childId.indexOf(a.contentieux.id) !== -1
      );
      const mainPercent = sumBy(childActivities, 'percent');
      if (mainActivity) {
        mainActivity.percent = mainPercent;
      } else {
        this.activities.push({
          id: -1,
          contentieux: {
            id: parentReferentiel.id,
            label: '',
            averageProcessingTime: 0,
          },
          referentielId: parentReferentiel.id,
          percent,
        });
      }
    } else {
      // remove activities of childs
      const childId = (referentiel.childrens || []).map((r) => r.id);
      this.activities = this.activities.filter(
        (a) => childId.indexOf(a.contentieux.id) === -1
      );
    }

    this.onLoadReferentiel();
    this.referentielChange.emit(this.referentiel);
    this.onTotalAffected();
  }

  /**
   * Changement du pourcentage d'une activitié sans recalcul du total
   * @param referentiel
   * @param percent
   * @param parentReferentiel
   */
  onChangePercentWithoutTotalComputation(
    referentiel: ContentieuReferentielInterface,
    percent: number,
    parentReferentiel: ContentieuReferentielInterface | null = null
  ) {
    // memorise list
    const activity = this.activities.find(
      (a) => a.contentieux.id === referentiel.id
    );
    if (activity) {
      activity.percent = percent;
    } else {
      this.activities.push({
        id: -1,
        contentieux: {
          id: referentiel.id,
          label: '',
          averageProcessingTime: 0,
        },
        referentielId: referentiel.id,
        percent,
      });
    }

    this.onLoadReferentiel();
    this.referentielChange.emit(this.referentiel);
    this.onTotalAffected();
  }
  /**
   * Accélaration du rendu de la liste
   * @param index
   * @param item
   * @returns
   */
  trackById(index: number, item: any) {
    return item.id;
  }

  /**
   * Compte le nombre de sous contentieux avec une valeure
   * @param referentiel
   * @returns
   */
  countNbSubItem(referentiel: ContentieuReferentielInterface) {
    return (referentiel.childrens || []).filter((r) => r.percent).length;
  }
  /**
   * Change l'état de mouseHovering lorsque la souris hover un sous référentiel du contentieux 'Autres Activités'
   */
  setMouseHovering(label?: string) {
    if (label) {
      this.hoveredReferentielDetail = this.userService.isCa()
        ? getReferentielCADetail(label)
        : getReferentielDetail(label);
      if (this.hoveredReferentielDetail) this.hoveredReferentielLabel = label;
      else this.hoveredReferentielLabel = null;
    }
    this.mouseHovering = !this.mouseHovering;
  }

  /**
   * Indique si le contentieux est un contentieux à saisir pour les DDG ou non
   */
  isDdgContentieux(label: string) {
    if (this.category?.label === 'Magistrat')
      if (this.userService.isCa())
        return DDG_REFERENTIELS_MAG_CA.includes(label.toUpperCase());
      else return DDG_REFERENTIELS_MAG.includes(label.toUpperCase());
    if (this.category?.label === 'Greffe')
      if (this.userService.isCa())
        return DDG_REFERENTIELS_GREFFE_CA.includes(label.toUpperCase());
      else return DDG_REFERENTIELS_GREFFE.includes(label.toUpperCase());
    if (this.category?.label === 'Autour du magistrat')
      if (this.userService.isCa())
        return DDG_REFERENTIELS_EAM_CA.includes(label.toUpperCase());
      else return DDG_REFERENTIELS_EAM.includes(label.toUpperCase());
    return false;
  }

  /**
   * Récuperer le type de l'app
   */
  getInterfaceType() {
    return this.userService.interfaceType === 1;
  }

  /**
   * Check quel contentieux est survolé
   * @param label
   * @returns
   */
  checkHoveredRef(label: string) {
    const labelMapping =
      this.getInterfaceType() === true
        ? this.referentielCAMappingName(label)
        : this.referentielMappingName(label);
    return this.hoveredReferentielLabel === labelMapping;
  }
}
