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
      console.log(result);
    })
    /*this.getActivitiesGrouped().then((result) => {
      this.allActivities = result;

      this.mainCategories.next(Object.keys(groupBy(result, function(n) {
        return n.mainCategory
      })));

      console.log(result)
    });*/
  }

  loadReferentiels() {
    return this.serverService
      .get('referentiels/get-referentiels')
      .then((r) => r.data);
  }
}
