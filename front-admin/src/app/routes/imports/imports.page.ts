import { Component } from '@angular/core';
import { BackupInterface } from 'src/app/interfaces/backup';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ImportService } from 'src/app/services/import/import.service';
import { exportFileToString } from 'src/app/utils/file';

@Component({
  templateUrl: './imports.page.html',
  styleUrls: ['./imports.page.scss'],
})
export class ImportsPage {
  HRBackupList: BackupInterface[] = [];

  constructor(
    private importService: ImportService,
    private humanResourceService: HumanResourceService
  ) {}

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {    
    this.humanResourceService
      .getBackupList()
      .then((r) => (this.HRBackupList = r));
  }

  async onSendReferentiel(refDom: any) {
    if (refDom.files.length === 0) {
      alert('Vous devez saisir une fichier !');
      return;
    }

    if (
      !confirm(
        'Confirmer la modification du référentiel ? Cette action entrainera une modification ultérieure de toutes les ventilations.'
      )
    ) {
      return;
    }

    this.importService
      .importReferentiel(await exportFileToString(refDom.files[0]))
      .then(() => {
        alert('OK !');
        refDom.value = '';
      });
  }

  async onSendHR(form: any) {
    const backupId = form.backupId.value;
    const backupName = form.backupName.value;
    const file = form.file.files[0];

    if (backupName && !confirm('Créer une ventilation ?')) {
      return;
    }

    if (!backupName && !confirm('Modifier la ventilation ?')) {
      return;
    }

    if (!file) {
      alert('Vous devez saisir une fichier !');
      return;
    }

    console.log(backupId, backupName, file);
    this.importService
      .importHR({ file: await exportFileToString(file), backupName, backupId })
      .then(() => {
        alert('OK !');
        form.reset();
        this.onLoad();
      });
  }
}
