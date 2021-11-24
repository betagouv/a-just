import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActivityInterface } from 'src/app/interfaces/activity';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class ActivitiesService {
  activities: BehaviorSubject<ActivityInterface[]> = new BehaviorSubject<ActivityInterface[]>([]);
  activityMonth: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());

  constructor(private serverService: ServerService) {}

  initDatas() {
    this.getAllActivities().then((result) => {
      this.activities.next(result.activities);
      this.activityMonth.next(result.activityMonth);
    });
  }

  getAllActivities() {
    return this.serverService
      .get('activities/get-all')
      .then((r) => r.data);
  }
}
