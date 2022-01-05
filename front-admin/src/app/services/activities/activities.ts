import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class ActivitiesService {
  constructor(private serverService: ServerService) {}

  getBackupList() {
    return this.serverService
      .get('activities/get-backup-list')
      .then((r) => r.data || []);
  }
}
