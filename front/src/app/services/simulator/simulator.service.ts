import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActivitiesService } from '../activities/activities.service';
import { HumanResourceService } from '../human-resource/human-resource.service';

const start = new Date();
const end = new Date();

@Injectable({
  providedIn: 'root',
})
export class SimulatorService {
  dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(start);
  dateStop: BehaviorSubject<Date> = new BehaviorSubject<Date>(end);
  referentielIds: number[] = [];
  subReferentielIds: number[] = [];

  constructor(
    private humanResourceService: HumanResourceService,
    private activitiesService: ActivitiesService
  ) {}
}
