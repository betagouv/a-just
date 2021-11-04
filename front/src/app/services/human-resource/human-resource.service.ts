import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BackupInterface } from 'src/app/interfaces/backup';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class HumanResourceService {
  hr: BehaviorSubject<HumanResourceInterface[]> = new BehaviorSubject<
    HumanResourceInterface[]
  >([]);
  contentieuxReferentiel: BehaviorSubject<ContentieuReferentielInterface[]> =
    new BehaviorSubject<ContentieuReferentielInterface[]>([]);
  backups: BehaviorSubject<BackupInterface[]> = new BehaviorSubject<
    BackupInterface[]
  >([]);
  backupId: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(
    null
  );
  autoReloadData: boolean = true;

  constructor(private serverService: ServerService) {}

  initDatas() {
    this.backupId.subscribe((id) => {
      if (this.autoReloadData) {
        this.getCurrentHR(id).then((result) => {
          this.contentieuxReferentiel.next(result.contentieuxReferentiel);
          this.hr.next(result.hr);
          this.backups.next(result.backups);
          this.autoReloadData = false;
          this.backupId.next(result.backupId);
        });
      } else {
        this.autoReloadData = true;
      }
    });
  }

  getCurrentHR(id: number | null) {
    return this.serverService
      .post('human-resources/get-current-hr', {
        backupId: id,
      })
      .then((r) => r.data);
  }

  createHumanResource() {
    const hr = this.hr.getValue();
    const activities: RHActivityInterface[] = [];

    // control and create empty activity
    this.contentieuxReferentiel
      .getValue()
      .map((r: ContentieuReferentielInterface) => {
        if (activities.findIndex((a) => r.label === a.label) === -1) {
          activities.push({
            label: r.label,
            percent: 0,
          });
        }
      });

    hr.push({
      id: hr.length * -1,
      firstName: 'Personne',
      lastName: 'XXX',
      activities,
    });
  }

  deleteHRById(HRId: number) {
    const hr = this.hr.getValue();
    const index = hr.findIndex((h) => h.id === HRId);

    if (index !== -1) {
      hr.splice(index, 1);
      this.hr.next(hr);
    }
  }

  filterActivityNow() {
    const now = new Date();
    return (a: any) => {
      const dateStop = a.dateStop ? new Date(a.dateStop) : null;
      const dateStart = a.dateStart ? new Date(a.dateStart) : null;

      return (
        dateStop === null ||
        (dateStop.getTime() >= now.getTime() &&
          (dateStart === null || dateStart.getTime() <= now.getTime()))
      );
    };
  }

  updateHR(list: HumanResourceInterface[]) {
    const newList: HumanResourceInterface[] = [];

    list.map((l) => {
      newList.push({
        ...l,
        activities: (l.activities || []).filter((a) => a.percent),
      });
    });

    this.hr.next(newList);
  }

  removeBackup() {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde?')) {
      return this.serverService.delete(
        `human-resources/remove-backup/${this.backupId.getValue()}`
      ).then(() => {
        this.backupId.next(null);
      });
    }

    return Promise.resolve();
  }
}
