import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActivityInterface } from 'src/app/interfaces/activity';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class ActivitiesService {
  acitivites: BehaviorSubject<ActivityInterface[]> = new BehaviorSubject<ActivityInterface[]>([]);

  constructor(private serverService: ServerService) {}

  initDatas() {
    this.getAllAcitivites().then((result) => {
      this.acitivites.next(result.activities);
    });
  }

  getAllAcitivites() {
    return this.serverService
      .get('activities/get-all')
      .then((r) => r.data);
  }
}
