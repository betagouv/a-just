import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class HumanResourceService {
  constructor(private serverService: ServerService) {}

  getBackupList() {
    return this.serverService
      .get('human-resources/get-backup-list')
      .then((r) => r.data || []);
  }
}
