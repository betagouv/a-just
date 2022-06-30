import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FilterPanelInterface } from 'src/app/routes/workforce/filter-panel/filter-panel.component';

@Injectable({
  providedIn: 'root',
})
export class WorkforceService {
  dateSelected: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());
  filterParams: FilterPanelInterface | null = null

  constructor() {}
}
