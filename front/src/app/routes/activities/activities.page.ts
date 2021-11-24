import { Component, OnDestroy } from '@angular/core';
import { ActivityInterface } from 'src/app/interfaces/activity';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { MainClass } from 'src/app/libs/main-class';
import { ActivitiesService } from 'src/app/services/activities/activities.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';

interface VisualInterface extends ContentieuReferentielInterface {
  showGroup: boolean;
}

@Component({
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
})
export class ActivitiesPage extends MainClass implements OnDestroy {
  activities: ActivityInterface[] = [];
  activityMonth: Date = new Date();
  referentiel: VisualInterface[] = [];

  constructor(private activitiesService: ActivitiesService, private humanResourceService: HumanResourceService) {
    super();

    this.watch(this.activitiesService.activities.subscribe(a => {
      this.activities = a;
    }));

    this.watch(this.activitiesService.activityMonth.subscribe(a => this.activityMonth = a));

    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(ref => {
        this.referentiel = ref.map(r => ({...r, showGroup: false}));
      })
    );
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }
}
