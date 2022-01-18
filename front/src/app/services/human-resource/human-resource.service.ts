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
  categories: BehaviorSubject<HRCategoryInterface[]> = new BehaviorSubject<
    HRCategoryInterface[]
  >([]);
  fonctions: BehaviorSubject<HRFonctionInterface[]> = new BehaviorSubject<
    HRFonctionInterface[]
  >([]);

  constructor(private serverService: ServerService) {}

  initDatas() {
    this.backupId.subscribe((id) => {
      if (this.autoReloadData) {
        this.getCurrentHR(id).then((result) => {
          this.hr.next(
            result.hr.map((h: HumanResourceInterface) => ({
              ...h,
              activities: (h.activities || []).map((a) => ({
                ...a,
                dateStart: a.dateStart ? new Date(a.dateStart) : undefined,
                dateStop: a.dateStop ? new Date(a.dateStop) : undefined,
              })),
            }))
          );
          this.backups.next(
            result.backups.map((b: BackupInterface) => ({
              ...b,
              date: new Date(b.date),
            }))
          );
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

  updateHR(list: HumanResourceInterface[], silentSave: boolean = false) {
    this.hr.next(list);
    this.hrIsModify.next(true);

    if (silentSave) {
      this.onSaveHRDatas(false, true);
    }
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
    const backup = this.backups
      .getValue()
      .find((b) => b.id === this.backupId.getValue());

    const backupName = prompt('Sous quel nom ?', `${backup?.label} - copie`);
    if (backupName) {
      return this.serverService
        .post(`human-resources/duplicate-backup`, {
          backupId: this.backupId.getValue(),
          backupName,
        })
        .then((r) => {
          this.backupId.next(r.data);
        });
    }

    return Promise.resolve();
  }

  onSaveHRDatas(isCopy: boolean, silentSave: boolean = false) {
    let backupName = null;
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
      .post(`human-resources/save-backup`, {
        hrList: this.hr.getValue(),
        backupId: this.backupId.getValue(),
        backupName: backupName ? backupName : null,
        juridictionId,
      })
      .then((r) => {
        if(!silentSave) {
          alert('Enregistrement OK !');
          this.backupId.next(r.data);
        }
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
      let juridictionId = null;
      const list = this.backups.getValue();
      if (list.length) {
        juridictionId = list[list.length - 1].juridiction.id;
      }

      return this.serverService
        .post(`human-resources/save-backup`, {
          hrList: [],
          backupName: backupName,
          juridictionId,
        })
        .then((r) => {
          this.backupId.next(r.data);
        });
    }

    return Promise.resolve();
  }

  duplicateHR(rhId: number) {
    if (confirm('Dupliquer cette personne ?')) {
      const list = this.hr.getValue();
      const findIndex = list.findIndex((r) => r.id === rhId);
      if (findIndex !== -1) {
        const person = JSON.parse(JSON.stringify(list[findIndex]));
        person.id = list.length * -1;
        list.push(person);
        this.hr.next(list);
        this.hrIsModify.next(true);
        return true;
      }
    }

    return false;
  }
}
