import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class ImportService {
  constructor(private serverService: ServerService) {}

  importReferentiel(file: string) {
    return this.serverService.post('imports/import-referentiel', { file });
  }

  importHR(params: any) {
    return this.serverService.post('imports/import-hr', params);
  }

  importActivities(params: any) {
    return this.serverService.post('imports/import-activities', params);
  }
}
