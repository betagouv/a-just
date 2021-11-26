import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActivitiesService } from './services/activities/activities.service';
import { ContentieuxOptionsService } from './services/contentieux-options/contentieux-options.service';
import { HumanResourceService } from './services/human-resource/human-resource.service';
import { IndicatorService } from './services/indicator/indicator.service';
import { ReferentielService } from './services/referentiel/referentiel.service';
import { UserService } from './services/user/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  dbReady: boolean = false;

  constructor(
    router: Router,
    private humanResourceService: HumanResourceService,
    private indicatorService: IndicatorService,
    private userService: UserService,
    private referentielService: ReferentielService,
    private activitiesService: ActivitiesService,
    private contentieuxOptionsService: ContentieuxOptionsService
  ) {
    router.events.subscribe((val) => {
      if (this.userService.user.getValue() && this.dbReady === false) {
        this.dbReady = true;

        this.humanResourceService.initDatas();
        this.indicatorService.initDatas();
        this.referentielService.initDatas();
        this.activitiesService.initDatas();
        this.contentieuxOptionsService.initDatas();
      }
    });
  }
}
