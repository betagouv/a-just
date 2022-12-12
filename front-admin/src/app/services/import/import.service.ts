import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class ImportService {
  constructor(private serverService: ServerService) {}

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
}
