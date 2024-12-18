import { inject, Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class ImportService {
  serverService = inject(ServerService);

  importReferentiel(file: string): Promise<string> {
    return this.serverService
      .post('imports/import-referentiel', { file })
      .then((d) => d.data);
  }

  importHR(params: any) {
    return this.serverService.post('imports/import-hr', params);
  }

  importActivities(params: any) {
    return this.serverService.post('imports/import-activities', params);
  }

  importAllActivities(params: any) {
    return this.serverService.post('imports/import-all-activities', params);
  }

  checkDataBeforeImportAll(params: any) {
    return this.serverService.post(
      'imports/check-data-before-import-all',
      params
    );
  }

  checkDataBeforeImportOne(params: any) {
    return this.serverService.post(
      'imports/check-data-before-import-one',
      params
    );
  }
}
