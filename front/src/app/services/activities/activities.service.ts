import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActivityInterface } from 'src/app/interfaces/activity';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class ActivitiesService {
  activities: BehaviorSubject<ActivityInterface[]> = new BehaviorSubject<
    ActivityInterface[]
  >([]);
  activityMonth: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());

  constructor(private serverService: ServerService) {}

  initDatas() {
    this.getAllActivities().then((result) => {
      this.activities.next(
        result.activities.map((a: ActivityInterface) => ({ ...a, periode: new Date(a.periode) }))
      );
      this.activityMonth.next(new Date(result.activityMonth));
    });
  }

  getAllActivities() {
    return this.serverService.get('activities/get-all').then((r) => r.data);
  }

  updateActivity(
    referentiel: ContentieuReferentielInterface,
    activities: ActivityInterface[] = this.activities.getValue(),
    firstRow: boolean = true
  ) {
    const findIndexActivity = activities.findIndex(
      (a) => a.contentieux.id === referentiel.id
    );

    if (referentiel.in || referentiel.out || referentiel.stock) {
      if (findIndexActivity === -1) {
        // add
        activities.push({
          periode: this.activityMonth.getValue(),
          entrees: referentiel.in || 0,
          sorties: referentiel.out || 0,
          stock: referentiel.stock || 0,
          contentieux: referentiel,
        });
      } else {
        // update
        activities[findIndexActivity] = {
          ...activities[findIndexActivity],
          entrees: referentiel.in || 0,
          sorties: referentiel.out || 0,
          stock: referentiel.stock || 0,
        };
      }
    } else if (findIndexActivity !== -1) {
      // remove activity
      activities.splice(findIndexActivity, 1);
    }

    (referentiel.childrens || []).map((refChildren) => {
      activities = this.updateActivity(refChildren, activities, false);
    });

    if (firstRow) {
      this.activities.next(activities);
    }

    return activities;
  }

  changeMonth(deltaMonth: number) {
    const cm = new Date(this.activityMonth.getValue());
    cm.setMonth(cm.getMonth() + deltaMonth);
    this.activityMonth.next(cm);
  }
}
