import { Component, OnDestroy, OnInit } from '@angular/core';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { sortBy, sumBy } from 'lodash';
import { MainClass } from 'src/app/libs/main-class';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';

@Component({
  templateUrl: './workforce.page.html',
  styleUrls: ['./workforce.page.scss'],
})
export class WorkforcePage extends MainClass implements OnInit, OnDestroy {
  humanResources: HumanResourceInterface[] = [];
  referentiel: ContentieuReferentielInterface[] = [];

  constructor(private humanResourceService: HumanResourceService) {
    super();
  }

  ngOnInit() {
    this.watch(
      this.humanResourceService.hr.subscribe((hr) => {
        this.humanResources = [];

        const now = new Date();
        hr.map((h) => {
          const activities = (h.activities || []).filter((a: any) => {
            const dateStop = a.dateStop ? new Date(a.dateStop) : null;
            const dateStart = a.dateStart ? new Date(a.dateStart) : null;

            return (
              (dateStart === null && dateStop === null) ||
              (dateStart &&
                dateStart.getTime() <= now.getTime() &&
                dateStop === null) ||
              (dateStart === null &&
                dateStop &&
                dateStop.getTime() >= now.getTime()) ||
              (dateStart &&
                dateStart.getTime() <= now.getTime() &&
                dateStop &&
                dateStop.getTime() >= now.getTime())
            );
          });

          this.humanResourceService.contentieuxReferentiel
            .getValue()
            .map((r: ContentieuReferentielInterface) => {
              if (activities.findIndex((a) => r.label === a.label) === -1) {
                activities.push({
                  label: r.label,
                  percent: 0,
                  dateStart: new Date(),
                });
              }
            });

          this.humanResources.push({
            ...h,
            activities: sortBy(activities, 'label'),
          });
        });
      })
    );
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(
        (ref) => (this.referentiel = sortBy(ref, 'label'))
      )
    );
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  totalActity(hr: HumanResourceInterface) {
    return sumBy(hr.activities || [], 'percent');
  }

  totalAvailable() {
    return sumBy(this.humanResources, 'etp').toFixed(2);
  }

  totalRealyAffected() {
    let total = 0;

    this.humanResources.map((hr) => {
      total += (this.totalActity(hr) / 100) * (hr.etp || 0);
    });

    return total.toFixed(2);
  }

  totalByActivity(codeNac: string) {
    let total = 0;

    this.humanResources.map((hr) => {
      const activities = hr.activities || [];
      const find = activities.find((a) => a.label === codeNac);
      if (find) {
        total += ((find.percent || 0) / 100) * (hr.etp || 0);
      }
    });

    return total.toFixed(2);
  }

  addHR() {
    this.humanResourceService.createHumanResource();
  }

  onUpdateActivity(
    activity: RHActivityInterface,
    percent: number,
    hr: HumanResourceInterface
  ) {
    const now = new Date();
    const activitiesIndex = (hr.activities || []).findIndex((a: any) => {
      const dateStop = a.dateStop ? new Date(a.dateStop) : null;
      const dateStart = a.dateStart ? new Date(a.dateStart) : null;

      return (
        a.label === activity.label &&
        ((dateStart === null && dateStop === null) ||
          (dateStart &&
            dateStart.getTime() <= now.getTime() &&
            dateStop === null) ||
          (dateStart === null &&
            dateStop &&
            dateStop.getTime() >= now.getTime()) ||
          (dateStart &&
            dateStart.getTime() <= now.getTime() &&
            dateStop &&
            dateStop.getTime() >= now.getTime()))
      );
    });

    if (activitiesIndex !== -1 && hr.activities) {
      hr.activities[activitiesIndex].percent = percent;
      this.humanResourceService.updateHR(this.humanResources);
      this.humanResourceService.hrIsModify.next(true);
    }
  }
}
