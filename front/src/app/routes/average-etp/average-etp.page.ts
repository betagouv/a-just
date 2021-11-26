import { Component, OnDestroy } from '@angular/core';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { MainClass } from 'src/app/libs/main-class';
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';

@Component({
  templateUrl: './average-etp.page.html',
  styleUrls: ['./average-etp.page.scss'],
})
export class AverageEtpPage extends MainClass implements OnDestroy {
  referentiel: ContentieuReferentielInterface[] = [];
  perUnity: string = 'hour';

  constructor(
    private contentieuxOptionsService: ContentieuxOptionsService,
    private humanResourceService: HumanResourceService
  ) {
    super();

    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(
        (ref) => (this.referentiel = ref)
      )
    );
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onUpdateOptions(referentiel: ContentieuReferentielInterface, value: number) {
    this.contentieuxOptionsService.updateOptions({
      ...referentiel,
      averageProcessingTime: !value ? null : (this.perUnity === 'hour' ? value : 8 / value)
    });
  }

  changeUnity(unit: string) {
    this.perUnity = unit;
  }
}
