import { inject, Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';
import { JuridictionInterface } from '../../interfaces/juridiction';

@Injectable({
  providedIn: 'root',
})
export class JuridictionsService {
  serverService = inject(ServerService);

  getAllVisible(): Promise<JuridictionInterface[]> {
    return this.serverService
      .get('juridictions/get-all-visibles')
      .then((data) => data.data || []);
  }
}
