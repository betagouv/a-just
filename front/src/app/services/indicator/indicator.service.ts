import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActivityInterface } from 'src/app/interfaces/activity';
import { ServerService } from '../http-server/server.service';
import { groupBy } from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class IndicatorService {
  mainCategories: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  allActivities: ActivityInterface[] = [];

  constructor(private serverService: ServerService) {}

  initDatas() {
    this.getActivitiesGrouped().then((result) => {
      this.allActivities = result;

      this.mainCategories.next(Object.keys(groupBy(result, function(n) {
        return n.mainCategory
      })));
    });
  }

  getActivitiesGrouped() {
    return this.serverService
      .get('activities/get-activities-grouped')
      .then((r) => r.data);
  }

  formatGroup(categoryName: string | null) {
    let list = this.allActivities

    if(categoryName) {
      list = list.filter(l => l.mainCategory === categoryName)
    }

    return Object.keys(groupBy(list, function(n) {
      return n.group
    }));
  }

  listActivities(groupName: string | null) {
    let list = this.allActivities

    if(groupName) {
      list = list.filter(l => l.group === groupName)
    }

    return list;
  }
}
