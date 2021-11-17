import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BackupInterface } from 'src/app/interfaces/backup';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction';
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
  hrIsModify: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  autoReloadData: boolean = true;
  categories: BehaviorSubject<HRCategoryInterface[]> = new BehaviorSubject<HRCategoryInterface[]>([]);
  fonctions: BehaviorSubject<HRFonctionInterface[]> = new BehaviorSubject<HRFonctionInterface[]>([]);

  constructor(private serverService: ServerService) {}

  initDatas() {
    this.backupId.subscribe((id) => {
      if (this.autoReloadData) {
        this.getCurrentHR(id).then((result) => {
          this.hr.next(result.hr);
          this.backups.next(result.backups);
          this.autoReloadData = false;
          this.backupId.next(result.backupId);
          this.categories.next(result.categories);
          this.fonctions.next(result.fonctions);
          this.hrIsModify.next(false);
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

    hr.splice(0, 0, {
      id: hr.length * -1,
      firstName: 'Personne',
      lastName: 'XXX',
      activities,
      etp: 1,
      fonction: this.fonctions.getValue()[0],
      category: this.categories.getValue()[0],
    });

    this.hr.next(hr);
    this.hrIsModify.next(true);
  }

  deleteHRById(HRId: number) {
    const hr = this.hr.getValue();
    const index = hr.findIndex((h) => h.id === HRId);

    if (index !== -1) {
      hr.splice(index, 1);
      this.hr.next(hr);
    }
  }

  updateHR(list: HumanResourceInterface[]) {
    this.hr.next(list);
    this.hrIsModify.next(true);
  }

  removeBackup() {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde?')) {
      return this.serverService
        .delete(`human-resources/remove-backup/${this.backupId.getValue()}`)
        .then(() => {
          this.backupId.next(null);
        });
    }

    return Promise.resolve();
  }

  duplicateBackup() {
    if (confirm('Êtes-vous sûr de vouloir dupliquer cette sauvegarde?')) {
      return this.serverService
        .post(`human-resources/duplicate-backup`, {
          backupId: this.backupId.getValue(),
        })
        .then((r) => {
          this.backupId.next(r.data);
        });
    }

    return Promise.resolve();
  }

  onSaveHRDatas(isCopy: boolean) {
    let backupName = null;
    if (isCopy) {
      backupName = prompt('Sous quel nom ?');
    }
    return this.serverService
      .post(`human-resources/save-backup`, {
        hrList: this.hr.getValue(),
        backupId: this.backupId.getValue(),
        backupName: backupName ? backupName : null,
      })
      .then((r) => {
        alert('Enregistrement OK !')
        this.backupId.next(r.data);
      });
  }

  removeHrById(id: number) {
    if (confirm('Supprimer cette personne ?')) {
      const list = this.hr.getValue();
      const findIndex = list.findIndex((r) => r.id === id);
      if (findIndex !== -1) {
        list.splice(findIndex, 1);
        this.hr.next(list);
        this.hrIsModify.next(true);
        return true;
      }
    }

    return false;
  }

  createEmpyHR() {
    let backupName = prompt('Sous quel nom ?');

    if (backupName) {
      return this.serverService
        .post(`human-resources/save-backup`, {
          hrList: [],
          backupName: backupName,
        })
        .then((r) => {
          this.backupId.next(r.data);
        });
    }

    return Promise.resolve();
  }
}
