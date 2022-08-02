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
  hrBackupId: number | null = null;

  constructor(private serverService: ServerService) {}

  updateActivity(
    referentiel: ContentieuReferentielInterface,
    activities: ActivityInterface[] = this.activities.getValue(),
    firstRow: boolean = true
  ) {
    const activityMonth = this.activityMonth.getValue();
    const findIndexActivity = activities.findIndex(
      (a) =>
        a.contentieux.id === referentiel.id &&
        a.periode.getFullYear() === activityMonth.getFullYear() &&
        a.periode.getMonth() === activityMonth.getMonth()
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

    this.updateDatasAt(referentiel.id, activityMonth, {
      entrees: referentiel.in || 0,
      sorties: referentiel.out || 0,
      stock: referentiel.stock || 0,
    });

    return activities;
  }

  changeMonth(deltaMonth: number) {
    const cm = new Date(this.activityMonth.getValue());
    cm.setMonth(cm.getMonth() + deltaMonth);
    this.activityMonth.next(cm);
  }

  onSaveDatas() {
    return this.serverService.post(`activities/save-backup`, {
      list: this.activities.getValue(),
      hrBackupId: this.hrBackupId,
    });
  }

  updateDatasAt(contentieuxId: number, date: Date, values: any) {
    return this.serverService.postWithoutError(`activities/update-by`, {
      contentieuxId,
      date,
      values,
      hrBackupId: this.hrBackupId,
    });
  }

  getActivitiesByDate(date: Date) {
    let activities = this.activities.getValue()
    activities = activities.filter(a => a.periode.getMonth() === date.getMonth() && a.periode.getFullYear() === date.getFullYear())
    
    return activities
  }
}
