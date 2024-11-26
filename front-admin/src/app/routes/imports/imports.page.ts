import { Component } from '@angular/core';
import * as _ from 'lodash';
import { BackupInterface } from '../../interfaces/backup';
import { ImportService } from '../../services/import/import.service';
import { HumanResourceService } from '../../services/human-resource/human-resource.service';
import { exportFileToString } from '../../utils/file';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';

@Component({
  standalone: true,
  imports: [WrapperComponent],
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

    if (!confirm('Confirmer la modification du référentiel ?')) {
      return;
    }

    this.importService
      .importReferentiel(await exportFileToString(refDom.files[0]))
      .then((url) => {
        refDom.value = '';
        // @ts-ignore
        window.open(url, '_blank').focus();
      });
  }

  async onSendHR(form: any) {
    const file = form.file.files[0];

    if (!file) {
      alert('Vous devez saisir une fichier !');
      return;
    }

    const options = {
      file: await exportFileToString(file),
    };

    this.importService.importHR(options).then(() => {
      alert('OK !');
      form.reset();
      this.onLoad();
    });
  }
}
