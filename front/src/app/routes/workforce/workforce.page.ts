import { Component, OnInit } from '@angular/core';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { sumBy } from 'lodash';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  templateUrl: './workforce.page.html',
  styleUrls: ['./workforce.page.scss'],
})
export class WorkforcePage implements OnInit {
  humanResources: HumanResourceInterface[] = [];
  referentiel: ContentieuReferentielInterface[] = [];
  onEditHR: HumanResourceInterface | undefined;
  formEditHR = new FormGroup({
    etp: new FormControl(null, [Validators.required]),
  });

  constructor(private humanResourceService: HumanResourceService) {}

  ngOnInit() {
    this.humanResourceService.hr.subscribe((hr) => {
      this.humanResources = hr;
      console.log('hr', hr);
    });
    this.humanResourceService.contentieuxReferentiel.subscribe(
      (ref) => (this.referentiel = ref)
    );
  }

  totalActity(hr: HumanResourceInterface) {
    return sumBy(hr.activities || [], 'percent');
  }

  totalAvailable() {
    return sumBy(this.humanResources, 'etp');
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

  editHR(hr: HumanResourceInterface) {
    this.onEditHR = hr;
    this.formEditHR.get('etp')?.setValue((hr.etp || 0) * 100);
  }

  onEditHRAction(action: any) {
    switch (action.id) {
      case 'save':
        if (this.formEditHR.invalid) {
          alert('Attention à bien saisir toutes les informations!');
        } else {
          const hrIndex = this.humanResources.findIndex(
            (h) => h.id === (this.onEditHR && this.onEditHR.id)
          );

          if (hrIndex !== -1) {
            const { etp } = this.formEditHR.value;
            this.humanResources[hrIndex].etp = etp / 100;
            this.humanResourceService.hr.next(this.humanResources);
          }

          // on close popup
          this.onEditHR = undefined;
        }
        break;
      case 'delete':
        if (
          confirm('Supprimer la suppression de ce profil ?') &&
          this.onEditHR
        ) {
          this.humanResourceService.deleteHRById(this.onEditHR.id);

          // on close popup
          this.onEditHR = undefined;
        }
        break;
      case 'close':
        // on close popup
        this.onEditHR = undefined;
        break;
    }
  }
}
