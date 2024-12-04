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

  updateJuridiction(node: string, value: any, juridictionId: number) {
    return this.serverService.put('juridictions/update-juridiction', {
      node,
      value,
      juridictionId,
    });
  }
}
