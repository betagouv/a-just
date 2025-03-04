import { inject, Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class JuridictionsService {
  serverService = inject(ServerService);

  getAll() {
    return this.serverService
      .get('juridictions/get-all')
      .then((data) => data.data || []);
  }

  async getAllBackup() {
    return this.serverService
      .get('juridictions/get-all-backup')
      .then((data) => data.data || []);
  }

  updateJuridiction(node: string, value: any, juridictionId: number) {
    return this.serverService.put('juridictions/update-juridiction', {
      node,
      value,
      juridictionId,
    });
  }

  duplicateJuridiction(
    juridictionName: string,
    backupId: number,
    label: string
  ) {
    return this.serverService
      .post('juridictions/duplicate-juridiction', {
        juridictionName,
        backupId,
      })
      .then((r) => {
        alert(
          'La juridiction que vous venez de créer reprend les agents, les ventillations et les indisponibilités de ' +
            label +
            ' avec des données anonymisées.'
        );
        window.location.reload();
      });
  }
}
