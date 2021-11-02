import { Injectable } from '@angular/core';
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class HRFonctionService {
  fonctions: HRFonctionInterface[] = [];

  constructor(private serverService: ServerService) {}

  getAll(): Promise<HRFonctionInterface[]> {
    if(this.fonctions.length) {
      return new Promise((resolve) => {
        resolve(this.fonctions);
      });
    }

    return this.serverService
      .get('hr-fonctions/get-all')
      .then((r) => r.data || [])
      .then(list => {
        this.fonctions = list;
        return list;
      })
  }
}
