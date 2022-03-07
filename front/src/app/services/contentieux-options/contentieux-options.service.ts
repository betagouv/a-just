import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BackupInterface } from 'src/app/interfaces/backup';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { ContentieuxOptionsInterface } from 'src/app/interfaces/contentieux-options';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class ContentieuxOptionsService {
  contentieuxOptions: BehaviorSubject<ContentieuxOptionsInterface[]> =
    new BehaviorSubject<ContentieuxOptionsInterface[]>([]);
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
        this.getAllContentieuxOptions(id).then((result) => {
          this.contentieuxOptions.next(result.list);
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

  getAllContentieuxOptions(id: number | null) {
    return this.serverService
      .post('contentieux-options/get-all', {
        backupId: id,
      })
      .then((r) => r.data);
  }

  updateOptions(referentiel: ContentieuReferentielInterface) {
    const options = this.contentieuxOptions.getValue();
    const findIndexOptions = options.findIndex(
      (a) => a.contentieux.id === referentiel.id
    );

    if (referentiel.averageProcessingTime) {
      if (findIndexOptions === -1) {
        // add
        options.push({
          averageProcessingTime: referentiel.averageProcessingTime || null,
          contentieux: referentiel,
        });
      } else {
        // update
        options[findIndexOptions] = {
          ...options[findIndexOptions],
          averageProcessingTime: referentiel.averageProcessingTime || null,
        };
      }
    } else if (findIndexOptions !== -1) {
      // remove activity
      options.splice(findIndexOptions, 1);
    }

    this.contentieuxOptions.next(options);
    this.optionsIsModify.next(true);
  }

  removeBackup() {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde?')) {
      return this.serverService
        .delete(`contentieux-options/remove-backup/${this.backupId.getValue()}`)
        .then(() => {
          this.backupId.next(null);
        });
    }

    return Promise.resolve();
  }

  duplicateBackup() {
    const backup = this.backups.getValue().find(b => b.id === this.backupId.getValue());

    const backupName = prompt('Sous quel nom ?', `${backup?.label} - copie`);
    if (backupName) {
      return this.serverService
        .post(`contentieux-options/duplicate-backup`, {
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
      .post(`contentieux-options/save-backup`, {
        list: this.contentieuxOptions.getValue(),
        backupId: this.backupId.getValue(),
        backupName: backupName ? backupName : null,
      })
      .then((r) => {
        alert('Enregistrement OK !')
        this.backupId.next(r.data);
      });
  }

  createEmpy() {
    let backupName = prompt('Sous quel nom ?');

    if (backupName) {
      return this.serverService
        .post(`contentieux-options/save-backup`, {
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
