import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkforceService {
  dateSelected: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());

  constructor() {}
}
