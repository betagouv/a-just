import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class JuridictionsService {
  constructor(private serverService: ServerService) {}

  getBackupList() {
    return this.serverService
      .get('juridictions/get-backup-list')
      .then((r) => r.data || []);
  }
}
