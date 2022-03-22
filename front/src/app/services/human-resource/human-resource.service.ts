import { Injectable } from '@angular/core';
import { orderBy, uniqBy } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { ActivityInterface } from 'src/app/interfaces/activity';
import { BackupInterface } from 'src/app/interfaces/backup';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction';
import { HRSituationInterface } from 'src/app/interfaces/hr-situation';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
import { today } from 'src/app/utils/dates';
import { ActivitiesService } from '../activities/activities.service';
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
  allContentieuxReferentiel: ContentieuReferentielInterface[] = [];
  allIndisponibilityReferentiel: ContentieuReferentielInterface[] = [];
  copyOfIdsIndispo: number[] = [];

  constructor(
    private serverService: ServerService,
    private activitiesService: ActivitiesService
  ) {
    if (localStorage.getItem('backupId')) {
      const backupId = localStorage.getItem('backupId') || 0;
      this.backupId.next(+backupId);
    }

    this.contentieuxReferentiel.subscribe((c) => {
      let list: ContentieuReferentielInterface[] = [];
      c.map((cont) => {
        list.push(cont);
        list = list.concat(cont.childrens || []);
      });

      this.allContentieuxReferentiel = list;
    });
  }

  initDatas() {
    this.backupId.subscribe((id) => {
      if (this.autoReloadData) {
        this.getCurrentHR(id).then((result) => {
          this.hr.next(result.hr.map(this.formatHR));
          this.backups.next(
            result.backups.map((b: BackupInterface) => ({
              ...b,
              date: new Date(b.date),
            }))
          );
          this.autoReloadData = false;
          this.backupId.next(result.backupId);
          localStorage.setItem('backupId', '' + result.backupId);
          this.categories.next(result.categories);
          this.fonctions.next(result.fonctions);
          this.activitiesService.activities.next(
            result.activities.map((a: ActivityInterface) => ({
              ...a,
              periode: new Date(a.periode),
            }))
          );
          this.activitiesService.hrBackupId = result.backupId;
          this.hrIsModify.next(false);
        });
      } else {
        this.autoReloadData = true;
      }
    });
  }

  formatHR(h: HumanResourceInterface) {
    return {
      ...h,
      dateStart: h.dateStart ? new Date(h.dateStart) : undefined,
      dateEnd: h.dateEnd ? new Date(h.dateEnd) : undefined,
      updatedAt: new Date(h.updatedAt),
      activities: (h.activities || []).map((a) => ({
        ...a,
        dateStart: a.dateStart ? new Date(a.dateStart) : undefined,
        dateStop: a.dateStop ? new Date(a.dateStop) : undefined,
      })),
    };
  }

  getCurrentHR(id: number | null) {
    return this.serverService
      .post('human-resources/get-current-hr', {
        backupId: id,
      })
      .then((r) => r.data);
  }

  async createHumanResource(date: Date) {
    const activities: RHActivityInterface[] = [];
    const categories = this.categories.getValue();

    const hr = {
      id: this.hr.getValue().length * -1,
      firstName: 'Personne',
      lastName: 'XXX',
      activities,
      situations: [
        {
          id: -1,
          etp: 1,
          category: categories[0],
          fonction: null,
          dateStart: new Date(date.getFullYear(), 0, 1),
        },
      ],
      indisponibilities: [],
      updatedAt: new Date(),
    };

    const newHR = await this.updateRemoteHR(hr);
    return newHR.id;
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
        this.hrIsModify.next(false);

        if (!silentSave) {
          alert('Enregistrement OK !');
          this.backupId.next(r.data);
        }
      });
  }

  async removeHrById(id: number) {
    if (confirm('Supprimer cette personne ?')) {
      return this.serverService
        .delete(`human-resources/remove-hr/${id}`)
        .then(() => {
          const list = this.hr.getValue();
          const findIndex = list.findIndex((r) => r.id === id);
          if (findIndex !== -1) {
            list.splice(findIndex, 1);
            this.hr.next(list);

            // update date of backup after remove
            const hrBackups = this.backups.getValue();
            const backupIndex = hrBackups.findIndex(
              (b) => b.id === this.backupId.getValue()
            );
            if (backupIndex !== -1) {
              hrBackups[backupIndex].date = new Date();
              this.backups.next(hrBackups);
            }
            return true;
          } else {
            return false;
          }
        });
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

  filterActivitiesByDate(
    list: RHActivityInterface[],
    date: Date
  ): RHActivityInterface[] {
    list = orderBy(list || [], ['dateStart'], ['desc']);
    list = list.filter((a: any) => {
      const dateStop = a.dateStop ? today(a.dateStop) : null;
      const dateStart = a.dateStart ? today(a.dateStart) : null;

      return (
        (dateStart === null && dateStop === null) ||
        (dateStart &&
          dateStart.getTime() <= date.getTime() &&
          dateStop === null) ||
        (dateStart === null &&
          dateStop &&
          dateStop.getTime() >= date.getTime()) ||
        (dateStart &&
          dateStart.getTime() <= date.getTime() &&
          dateStop &&
          dateStop.getTime() >= date.getTime())
      );
    });

    return uniqBy(list, 'referentielId');
  }

  distinctSituations(situations: HRSituationInterface[]) {
    const listTimeTamps: number[] = [];

    return situations.reduce(
      (
        previousValue: HRSituationInterface[],
        currentValue: HRSituationInterface
      ) => {
        const d = today(currentValue.dateStart);
        const getTime = d.getTime();
        if (listTimeTamps.indexOf(getTime) === -1) {
          listTimeTamps.push(getTime);
          previousValue.push(currentValue);
        }

        return previousValue;
      },
      []
    );
  }

  findSituation(hr: HumanResourceInterface | null, date?: Date) {
    let situations = this.findAllSituations(hr, date);

    return situations.length ? situations[0] : null;
  }

  findAllSituations(hr: HumanResourceInterface | null, date?: Date) {
    let situations = orderBy(
      (hr && hr.situations) || [],
      [
        (o) => {
          const d = today(o.dateStart);
          return d.getTime();
        },
      ],
      ['desc']
    );

    if (date) {
      situations = situations.filter((hra) => {
        const dateStart = today(hra.dateStart);
        return dateStart.getTime() <= date.getTime();
      });
    }

    return situations;
  }

  findAllIndisponibilities(hr: HumanResourceInterface | null, date?: Date) {
    let indisponibilities = orderBy(
      (hr && hr.indisponibilities) || [],
      [
        (o) => {
          const d = today(o.dateStart);
          return d.getTime();
        },
      ],
      ['desc']
    );

    if (date) {
      indisponibilities = indisponibilities.filter((hra) => {
        const dateStart = today(hra.dateStart);
        return dateStart.getTime() <= date.getTime();
      });
    }

    return indisponibilities;
  }

  async pushHRUpdate(
    humanId: number,
    profil: any,
    newReferentiel: ContentieuReferentielInterface[],
    indisponibilities: RHActivityInterface[]
  ) {
    const list = this.hr.getValue();
    const index = list.findIndex((h) => h.id === humanId);
    const categories = this.categories.getValue();
    const fonctions = this.fonctions.getValue();

    if (index !== -1) {
      const activitiesStartDate = today(profil.activitiesStartDate);

      // update situation
      let situations = list[index].situations || [];
      const cat = categories.find((c) => c.id == profil.categoryId);
      const fonct = fonctions.find((c) => c.id == profil.fonctionId);
      if (!fonct) {
        alert('Vous devez saisir une fonction !');
        return;
      }

      if (!cat) {
        alert('Vous devez saisir une catégorie !');
        return;
      }

      const activities: any[] = [];
      newReferentiel
        .filter((r) => r.percent && r.percent > 0)
        .map((r) => {
          activities.push({
            percent: r.percent || 0,
            contentieux: r,
          });

          (r.childrens || [])
            .filter((r) => r.percent && r.percent > 0)
            .map((child) => {
              activities.push({
                percent: child.percent || 0,
                contentieux: child,
              });
            });
        });

      situations.splice(0, 0, {
        id: -1,
        etp: profil.etp / 100,
        category: cat,
        fonction: fonct,
        dateStart: activitiesStartDate,
        activities,
      });

      list[index] = {
        ...list[index],
        firstName: profil.firstName,
        lastName: profil.lastName,
        dateStart: profil.dateStart ? new Date(profil.dateStart) : undefined,
        dateEnd: profil.dateEnd ? new Date(profil.dateEnd) : undefined,
        situations: this.distinctSituations(situations),
        indisponibilities,
      };

      await this.updateRemoteHR(list[index]);
      return true;
    }

    return false;
  }

  updateRemoteHR(hr: any) {
    return this.serverService
      .post(`human-resources/update-hr`, {
        hr,
        backupId: this.backupId.getValue(),
      })
      .then((response) => {
        const newHR = this.formatHR(response.data);
        const list = this.hr.getValue();
        const index = list.findIndex((l) => l.id === newHR.id);

        if (index === -1) {
          list.push(newHR);
        } else {
          list[index] = newHR;
        }

        this.hr.next(list);

        const hrBackups = this.backups.getValue();
        const backupIndex = hrBackups.findIndex(
          (b) => b.id === this.backupId.getValue()
        );
        if (backupIndex !== -1) {
          hrBackups[backupIndex].date = newHR.updatedAt;
          this.backups.next(hrBackups);
        }

        return newHR;
      });
  }

  removeSituation(situationId: number) {
    if (confirm('Supprimer cette situation ?')) {
      return this.serverService
        .delete(`human-resources/remove-situation/${situationId}`)
        .then((data) => {
          const hr = data.data;
          const list = this.hr.getValue();
          const findIndex = list.findIndex((r) => r.id === hr.id);
          if (findIndex !== -1) {
            list[findIndex] = hr;
            this.hr.next(list);

            // update date of backup after remove
            const hrBackups = this.backups.getValue();
            const backupIndex = hrBackups.findIndex(
              (b) => b.id === this.backupId.getValue()
            );
            if (backupIndex !== -1) {
              hrBackups[backupIndex].date = new Date();
              this.backups.next(hrBackups);
            }
            return true;
          } else {
            return false;
          }
        });
    }

    return false;
  }
}
