import { Component, OnDestroy } from '@angular/core';
import { sumBy } from 'lodash';
import { ActivityInterface } from 'src/app/interfaces/activity';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { MainClass } from 'src/app/libs/main-class';
import { ActivitiesService } from 'src/app/services/activities/activities.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';

@Component({
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
})
export class ActivitiesPage extends MainClass implements OnDestroy {
  activities: ActivityInterface[] = [];
  activityMonth: Date = new Date();
  referentiel: ContentieuReferentielInterface[] = [];

  constructor(
    private activitiesService: ActivitiesService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService
  ) {
    super();

    this.watch(
      this.activitiesService.activities.subscribe((a) => {
        this.activities = a;
      })
    );

    this.watch(
      this.activitiesService.activityMonth.subscribe(
        (a) => (this.activityMonth = a)
      )
    );

    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((ref) => {
        this.referentiel = ref.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.id) === -1
        );
      })
    );
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onUpdateActivity(
    referentiel: ContentieuReferentielInterface,
    subRef: ContentieuReferentielInterface
  ) {
    referentiel.childrens = (referentiel.childrens || []).map((ref: ContentieuReferentielInterface) => {
      if (ref.id === subRef.id) {
        ref.in = subRef.in;
        ref.out = subRef.out;
        ref.stock = subRef.stock;
      }

      return ref;
    });

    referentiel.in = sumBy(referentiel.childrens, 'in');
    referentiel.out = sumBy(referentiel.childrens, 'out');
    referentiel.stock = sumBy(referentiel.childrens, 'stock');

    this.activitiesService.updateActivity(referentiel);
  }

  onUpdateMainActivity(referentiel: ContentieuReferentielInterface) {
    this.activitiesService.updateActivity(referentiel);
  }

  changeMonth(deltaMonth: number) {
    this.activitiesService.changeMonth(deltaMonth);
  }
}
