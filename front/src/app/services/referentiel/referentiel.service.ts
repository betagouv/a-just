import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class ReferentielService {
  referentiels: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  constructor(private serverService: ServerService) {}

  initDatas() {
    this.loadReferentiels().then(result => {
      // console.log(result);
    })
  }

  loadReferentiels() {
    return this.serverService
      .get('referentiels/get-referentiels')
      .then((r) => r.data);
  }
}
