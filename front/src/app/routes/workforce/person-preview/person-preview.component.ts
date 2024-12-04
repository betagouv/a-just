import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { HumanResourceSelectedInterface } from '../workforce.page';
import { FilterPanelInterface } from '../filter-panel/filter-panel.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EtpPreviewComponent } from '../../../components/etp-preview/etp-preview.component';
import { PanelActivitiesComponent } from '../../../components/panel-activities/panel-activities.component';
import { MainClass } from '../../../libs/main-class';
import { HumanResourceService } from '../../../services/human-resource/human-resource.service';
import { UserService } from '../../../services/user/user.service';
import { MatIconModule } from '@angular/material/icon';
import { SanitizeHtmlPipe } from '../../../pipes/sanitize-html/sanitize-html.pipe';

/**
 * Paneau d'une fiche magistrat / fonctionnaire / contractuel
 */
@Component({
  selector: 'person-preview',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    EtpPreviewComponent,
    PanelActivitiesComponent,
    MatIconModule,
    SanitizeHtmlPipe,
  ],
  templateUrl: './person-preview.component.html',
  styleUrls: ['./person-preview.component.scss'],
})
export class PersonPreviewComponent
  extends MainClass
  implements OnInit, OnDestroy
{
  /**
   * Fiche
   */
  @Input() hr: HumanResourceSelectedInterface = {
    opacity: 1,
    etpLabel: '',
    hasIndisponibility: 0,
    currentActivities: [],
    etp: 1,
    category: null,
    fonction: null,
    currentSituation: null,
    id: 0,
    situations: [],
    indisponibilities: [],
    updatedAt: new Date(),
  };
  /**
   * Filtre utilisateur
   */
  @Input() filterParams: FilterPanelInterface | null = null;
  /**
   * Categorie text color
   */
  @Input() textColor: string = '';
  /**
   * Show component is visible
   */
  @Input() showComponent: boolean = false;
  /**
   * Show empty activities
   */
  @Input() hideActivities: boolean = true;

  /**
   * Constructeur
   */
  constructor(
    private humanResourceService: HumanResourceService,
    public userService: UserService
  ) {
    super();
  }

  /**
   * After DOM is create fetch event
   */
  ngOnInit() {
    this.watch(
      this.humanResourceService.componentIdsCanBeView.subscribe((s) => {
        this.showComponent = s.includes(this.hr?.id || 0);

        if (this.showComponent) {
          this.watcherDestroy();
        }
      })
    );

    this.humanResourceService.needIdToLoad(this.hr?.id || 0);
  }

  /**
   * Remove listenner
   */
  ngOnDestroy() {
    this.watcherDestroy();
  }
}
