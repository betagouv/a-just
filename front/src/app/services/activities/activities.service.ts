import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActivityInterface } from 'src/app/interfaces/activity';
import { BackupInterface } from 'src/app/interfaces/backup';
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
  backups: BehaviorSubject<BackupInterface[]> = new BehaviorSubject<
    BackupInterface[]
  >([]);
  backupId: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(
    null
  );
  optionsIsModify: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  autoReloadData: boolean = true;

  constructor(private serverService: ServerService) {}

  initDatas() {
    this.backupId.subscribe((id) => {
      if (this.autoReloadData) {
        this.getAllActivities(id).then((result) => {
          this.activities.next(
            result.activities.map((a: ActivityInterface) => ({
              ...a,
              periode: new Date(a.periode),
            }))
          );
          this.backups.next(result.backups);
          this.autoReloadData = false;
          this.backupId.next(result.backupId);
          this.optionsIsModify.next(false);
        });
      } else {
        this.autoReloadData = true;
      }
    });
  }

  getAllActivities(id: number | null) {
    return this.serverService
      .post('activities/get-all', {
        backupId: id,
      })
      .then((r) => r.data);
  }

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

  removeBackup() {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde?')) {
      return this.serverService
        .delete(`activities/remove-backup/${this.backupId.getValue()}`)
        .then(() => {
          this.backupId.next(null);
        });
    }

    return Promise.resolve();
  }

  duplicateBackup() {
    const backup = this.backups
      .getValue()
      .find((b) => b.id === this.backupId.getValue());

    const backupName = prompt('Sous quel nom ?', `${backup?.label} - copie`);
    if (backupName) {
      return this.serverService
        .post(`activities/duplicate-backup`, {
          backupId: this.backupId.getValue(),
          backupName,
        })
        .then((r) => {
          this.backupId.next(r.data);
        });
    }

    return Promise.resolve();
  }

  onSaveDatas(isCopy: boolean) {
    let backupName = null;
    if (isCopy) {
      backupName = prompt('Sous quel nom ?');
    }
    return this.serverService
      .post(`activities/save-backup`, {
        list: this.activities.getValue(),
        backupId: this.backupId.getValue(),
        backupName: backupName ? backupName : null,
      })
      .then((r) => {
        alert('Enregistrement OK !');
        this.backupId.next(r.data);
      });
  }

  createEmpy() {
    let backupName = prompt('Sous quel nom ?');

    if (backupName) {
      return this.serverService
        .post(`activities/save-backup`, {
          list: [],
          backupName: backupName,
        })
        .then((r) => {
          this.backupId.next(r.data);
        });
    }

    return Promise.resolve();
  }
}
