import { Component, Input, OnDestroy, OnInit } from '@angular/core'
import { HumanResourceSelectedInterface } from '../workforce.page'
import { FilterPanelInterface } from '../filter-panel/filter-panel.component'
import { RouterLink } from '@angular/router'
import { CommonModule } from '@angular/common'
import { EtpPreviewComponent } from '../../../components/etp-preview/etp-preview.component'
import { PanelActivitiesComponent } from '../../../components/panel-activities/panel-activities.component'
import { MainClass } from '../../../libs/main-class'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { UserService } from '../../../services/user/user.service'
import { MatIconModule } from '@angular/material/icon'
import { TextEditorComponent } from '../../../components/text-editor/text-editor.component'

/**
 * Paneau d'une fiche magistrat / fonctionnaire / contractuel
 */
@Component({
  selector: 'person-preview',
  standalone: true,
  imports: [RouterLink, CommonModule, EtpPreviewComponent, PanelActivitiesComponent, MatIconModule, TextEditorComponent],
  templateUrl: './person-preview.component.html',
  styleUrls: ['./person-preview.component.scss'],
})
export class PersonPreviewComponent extends MainClass implements OnInit, OnDestroy {
  /**
   * Fiche
   */
  @Input() hr: HumanResourceSelectedInterface = {
    /**
     * Trouvé dans la recherche ou non
     */
    opacity: 1,
    /**
     * Temps de travail en string
     */
    etpLabel: '',
    /**
     * Total des indispo
     */
    hasIndisponibility: 0,
    /**
     * Activités de la date sélectionnée
     */
    currentActivities: [],
    /**
     * ETP a la date sélectionnée
     */
    etp: 1,
    /**
     * Categorie à la date sélectionnée
     */
    category: null,
    /**
     * Fonction à la date sélectionnée
     */
    fonction: null,
    /**
     * Situation à la date sélectionnée
     */
    currentSituation: null,
    /**
     * Id de la fiche
     */
    id: 0,
    /**
     * Situations
     */
    situations: [],
    /**
     * Indisponibilités
     */
    indisponibilities: [],
    /**
     * Date de mise à jour
     */
    updatedAt: new Date(),
  }
  /**
   * Filtre utilisateur
   */
  @Input() filterParams: FilterPanelInterface | null = null
  /**
   * Categorie text color
   */
  @Input() textColor: string = ''
  /**
   * Show component is visible
   */
  @Input() showComponent: boolean = false
  /**
   * Show empty activities
   */
  @Input() hideActivities: boolean = true

  /**
   * Constructeur
   */
  constructor(
    private humanResourceService: HumanResourceService,
    public userService: UserService,
  ) {
    super()
  }

  /**
   * After DOM is create fetch event
   */
  ngOnInit() {
    this.watch(
      this.humanResourceService.componentIdsCanBeView.subscribe((s) => {
        this.showComponent = s.includes(this.hr?.id || 0)

        if (this.showComponent) {
          this.watcherDestroy()
        }
      }),
    )

    this.humanResourceService.needIdToLoad(this.hr?.id || 0)
  }

  /**
   * Remove listenner
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }
}
