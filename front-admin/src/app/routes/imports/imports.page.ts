import { Component } from '@angular/core';
import { ImportService } from 'src/app/services/import/import.service';
import { exportFileToBlob } from 'src/app/utils/file';

@Component({
  templateUrl: './imports.page.html',
  styleUrls: ['./imports.page.scss'],
})
export class ImportsPage {
  constructor(private importService: ImportService) {}

  ngOnInit() {}

  async onSendReferentiel(refDom: any) {
    if (refDom.files.length === 0) {
      alert('Vous devez saisir une fichier !');
      return;
    }

    if (!confirm('Confirmer la modification du référentiel ?')) {
      return;
    }

    const blob = await exportFileToBlob(refDom.files[0]);
    this.importService.importReferentiel(blob).then(() => {
      alert('OK !');
    });
  }
}
