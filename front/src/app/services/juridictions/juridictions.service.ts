import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';
import { JuridictionInterface } from 'src/app/interfaces/juridiction';

@Injectable({
  providedIn: 'root',
})
export class JuridictionsService {
  constructor(private serverService: ServerService) {}

  getAllVisible(): Promise<JuridictionInterface[]> {
    return this.serverService
      .get('juridictions/get-all-visibles')
      .then((data) => data.data || []);
  }
}
