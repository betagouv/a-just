import { Injectable } from '@angular/core';
import { orderBy, uniqBy } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { BackupInterface } from 'src/app/interfaces/backup';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
import { today } from 'src/app/utils/dates';
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

  constructor(private serverService: ServerService) {
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
          this.hr.next(
            result.hr.map((h: HumanResourceInterface) => ({
              ...h,
              dateStart: h.dateStart ? new Date(h.dateStart) : undefined,
              dateEnd: h.dateEnd ? new Date(h.dateEnd) : undefined,
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
          localStorage.setItem('backupId', '' + result.backupId);
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

  createHumanResource(date: Date) {
    const hr = this.hr.getValue();
    const activities: RHActivityInterface[] = [];
    const categories = this.categories.getValue();
    const fonctions = this.fonctions.getValue();

    hr.splice(0, 0, {
      id: hr.length * -1,
      firstName: 'Personne',
      lastName: 'XXX',
      activities,
      situations: [
        {
          id: -1,
          etp: 0,
          category: categories[0],
          fonction: fonctions[0],
          dateStart: new Date(date.getFullYear()),
        },
      ],
    });

    this.updateHR(hr, true);
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
        this.hrIsModify.next(false);

        if (!silentSave) {
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

  filterActivitiesByDate(
    list: RHActivityInterface[],
    date: Date
  ): RHActivityInterface[] {
    list = orderBy(
      JSON.parse(JSON.stringify(list || [])),
      ['dateStart'],
      ['desc']
    );
    list = list.filter((a: any) => {
      const dateStop = a.dateStop ? today(new Date(a.dateStop)) : null;
      const dateStart = a.dateStart ? today(new Date(a.dateStart)) : null;

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

  findSituation(hr: HumanResourceInterface | null, date?: Date) {
    let situations = this.findAllSituations(hr, date);

    return situations.length ? situations[0] : null;
  }

  findAllSituations(hr: HumanResourceInterface | null, date?: Date) {
    let situations = orderBy(
      (hr && hr.situations) || [],
      [
        (o) => {
          const d = today(new Date(o.dateStart));
          return d.getTime();
        },
      ],
      ['desc']
    );

    if (date) {
      situations = situations.filter((hra) => {
        const dateStart = today(new Date(hra.dateStart));
        return dateStart.getTime() <= date.getTime();
      });
    }

    return situations;
  }

  pushHRUpdate(
    humanId: number,
    profil: any,
    newReferentiel: ContentieuReferentielInterface[],
    indisponibilities: RHActivityInterface[]
  ): boolean {
    const list = this.hr.getValue();
    const index = list.findIndex((h) => h.id === humanId);
    const categories = this.categories.getValue();
    const fonctions = this.fonctions.getValue();

    if (index !== -1) {
      let activities = list[index].activities || [];
      const activitiesStartDate = new Date(profil.activitiesStartDate);
      const getTimeActivitiesStarted = activitiesStartDate.getTime();
      const yesterdayActivitiesStartDate = new Date(activitiesStartDate);
      yesterdayActivitiesStartDate.setDate(
        yesterdayActivitiesStartDate.getDate() - 1
      );

      // find and update or remove from activities list
      indisponibilities.map((i) => {
        const index = activities.findIndex((a) => a.id === i.id);
        if (i.isDeleted && i.id > 0) {
          // delete
          if (index !== -1) {
            activities.splice(index, 1);
          }
        } else if (!i.isDeleted && i.id < 0) {
          // create
          activities.push(i);
        } else if (!i.isDeleted && i.id > 0) {
          // update
          if (index !== -1) {
            activities[index] = i;
          }
        }
      });

      if (newReferentiel.length) {
        for (let i = activities.length - 1; i >= 0; i--) {
          if (
            this.copyOfIdsIndispo.indexOf(activities[i].referentielId) === -1
          ) {
            // stop all current activities and start with this
            if (
              !activities[i].dateStop ||
              // @ts-ignore
              activities[i].dateStop.getTime() > getTimeActivitiesStarted
            ) {
              activities[i].dateStop = yesterdayActivitiesStartDate;
            }

            // remove activities started after activity start date
            const dateStart = activities[i].dateStart
              ? activities[i].dateStart
              : null;
            if (dateStart && dateStart.getTime() >= getTimeActivitiesStarted) {
              activities.splice(i, 1);
            }
          }
        }

        newReferentiel
          .filter((r) => r.percent)
          .map((ref) => {
            activities.push({
              id: -1,
              percent: ref.percent,
              referentielId: ref.id,
              dateStart: new Date(profil.activitiesStartDate),
            });

            (ref.childrens || [])
              .filter((r) => r.percent)
              .map((ref) => {
                activities.push({
                  id: -1,
                  percent: ref.percent,
                  referentielId: ref.id,
                  dateStart: new Date(profil.activitiesStartDate),
                });
              });
          });
      }

      // update situation
      let situations = this.findAllSituations(list[index], activitiesStartDate);
      const cat = categories.find((c) => c.id == profil.categoryId);
      const fonct = fonctions.find((c) => c.id == profil.fonctionId);
      if (cat && fonct) {
        situations.splice(0, 0, {
          id: -1,
          etp: profil.etp / 100,
          category: cat,
          fonction: fonct,
          dateStart: activitiesStartDate,
        });
      }

      list[index] = {
        ...list[index],
        firstName: profil.firstName,
        lastName: profil.lastName,
        dateStart: profil.dateStart ? new Date(profil.dateStart) : undefined,
        dateEnd: profil.dateEnd ? new Date(profil.dateEnd) : undefined,
        situations,
        activities,
      };
      console.log(list[index]);

      this.updateHR(list, true);
    }

    return true;
  }
}
