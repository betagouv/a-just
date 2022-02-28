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
  optionsIsModify: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  autoReloadData: boolean = true;

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

    this.optionsIsModify.next(true);

    return activities;
  }

  changeMonth(deltaMonth: number) {
    const cm = new Date(this.activityMonth.getValue());
    cm.setMonth(cm.getMonth() + deltaMonth);
    this.activityMonth.next(cm);
  }

  onSaveDatas(isCopy: boolean) {
    /*let backupName = null;
    let juridictionId = null;
    if (isCopy) {
      backupName = prompt('Sous quel nom ?');
    }

    const actualBackup = this.backups
      .getValue()
      .find((b) => b.id === this.backupId.getValue());
    if (actualBackup) {
      juridictionId = actualBackup.juridiction.id;
    }

    return this.serverService
      .post(`activities/save-backup`, {
        list: this.activities.getValue(),
        backupId: this.backupId.getValue(),
        backupName: backupName ? backupName : null,
        juridictionId,
      })
      .then((r) => {
        alert('Enregistrement OK !');
        this.backupId.next(r.data);
      });*/
  }
}
