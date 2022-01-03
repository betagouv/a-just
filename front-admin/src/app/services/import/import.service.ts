import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';
import * as FormData from 'form-data';
const n = new FormData();
console.log(n.getBoundary());

@Injectable({
  providedIn: 'root',
})
export class ImportService {
  constructor(private serverService: ServerService) {}

  importReferentiel(file: any) {
    const formData = new FormData();
    formData.append('file', file, { filename: 'file.csv' });
    console.log(formData.getBoundary());

    return this.serverService.post(
      'imports/import-referentiel',
      formData,
      {},
      { 'Content-Type': 'multipart/form-data' }
    );
  }
}
