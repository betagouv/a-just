import { Component, OnInit } from '@angular/core';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { sumBy } from 'lodash';

@Component({
  templateUrl: './workforce.page.html',
  styleUrls: ['./workforce.page.scss'],
})
export class WorkforcePage implements OnInit {
  humanResources: HumanResourceInterface[] = [];
  referentiel: ContentieuReferentielInterface[] = [];

  constructor(private humanResourceService: HumanResourceService) {}

  ngOnInit() {
    this.humanResourceService.getCurrentHR().then((result) => {
      this.referentiel = result.contentieuxReferentiel;

      this.humanResources = result.hr.map((hr: HumanResourceInterface) => {
        const activities = hr.activities || [];

        // control and create empty activity
        this.referentiel.map((r: ContentieuReferentielInterface) => {
          if (activities.findIndex((a) => r.codeNac === a.codeNac) === -1) {
            activities.push({
              codeNac: r.codeNac,
              percent: 0,
            });
          }
        });

        hr.activities = activities;
        return hr;
      });
    });
  }

  totalActity(hr: HumanResourceInterface) {
    return Math.floor(sumBy(hr.activities || [], 'percent') * 100) / 100;
  }

  totalAvailable() {
    return sumBy(this.humanResources, 'etp');
  }

  totalRealyAffected() {
    let total = 0;

    this.humanResources.map((hr) => {
      total += this.totalActity(hr) * (hr.etp || 0);
    });

    return total.toFixed(2);
  }

  totalByActivity(codeNac: string) {
    let total = 0;

    this.humanResources.map((hr) => {
      const activities = hr.activities || []
      const find = activities.find(a => a.codeNac === codeNac)
      if(find) {
        total += (find.percent || 0) * (hr.etp || 0);
      }
    });

    return total.toFixed(2);
  }
}
