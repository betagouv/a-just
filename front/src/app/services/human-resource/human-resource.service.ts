import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ActivityInterface } from 'src/app/interfaces/activity';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class HumanResourceService {
  hr: BehaviorSubject<HumanResourceInterface[]> = new BehaviorSubject<
    HumanResourceInterface[]
  >([]);
  contentieuxReferentiel: BehaviorSubject<ContentieuReferentielInterface[]> =
    new BehaviorSubject<ContentieuReferentielInterface[]>([]);

  constructor(private serverService: ServerService) {}

  initDatas() {
    this.getCurrentHR().then((result) => {
      this.contentieuxReferentiel.next(result.contentieuxReferentiel);

      this.hr.next(
        result.hr.map((hr: HumanResourceInterface) => {
          const activities = hr.activities || [];

          // control and create empty activity
          result.contentieuxReferentiel.map(
            (r: ContentieuReferentielInterface) => {
              if (activities.findIndex((a) => r.label === a.label) === -1) {
                activities.push({
                  label: r.label,
                  percent: 0,
                });
              }
            }
          );

          hr.activities = activities;
          return hr;
        })
      );
    });
  }

  getCurrentHR() {
    return this.serverService
      .get('human-resources/get-current-hr')
      .then((r) => r.data);
  }

  createHumanResource() {
    const hr = this.hr.getValue();
    const activities: ActivityInterface[] = [];

    // control and create empty activity
    this.contentieuxReferentiel
      .getValue()
      .map((r: ContentieuReferentielInterface) => {
        if (activities.findIndex((a) => r.label === a.label) === -1) {
          activities.push({
            label: r.label,
            percent: 0,
          });
        }
      });

    hr.push({
      firstName: 'Personne',
      lastName: 'XXX',
      activities,
    });
  }
}
