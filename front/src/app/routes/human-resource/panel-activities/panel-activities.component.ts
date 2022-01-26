import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { sumBy } from 'lodash';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
import { MainClass } from 'src/app/libs/main-class';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';

@Component({
  selector: 'panel-activities',
  templateUrl: './panel-activities.component.html',
  styleUrls: ['./panel-activities.component.scss'],
})
export class PanelActivitiesComponent
  extends MainClass
  implements OnChanges, OnDestroy
{
  @Input() etp: number = 1;
  @Input() activities: RHActivityInterface[] = [];
  referentiel: ContentieuReferentielInterface[] = [];
  percentAffected: number = 0;

  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService
  ) {
    super();

    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(() =>
        this.onLoadReferentiel()
      )
    );
  }

  ngOnChanges() {
    this.onLoadReferentiel();
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onLoadReferentiel() {
    this.referentiel = (
      JSON.parse(
        JSON.stringify(
          this.humanResourceService.contentieuxReferentiel.getValue()
        )
      ) as ContentieuReferentielInterface[]
    )
      .filter((r) => this.referentielService.idsIndispo.indexOf(r.id) === -1)
      .map((ref) => {
        const activity = this.activities.find(
          (a) => a.referentielId === ref.id
        );

        ref.percent = activity && activity.percent ? activity.percent : 0;
        ref.totalAffected = (ref.percent * (this.etp || 0)) / 100;
        return ref;
      });

    this.percentAffected = sumBy(
      this.activities.filter(
        (r) =>
          this.referentielService.idsIndispo.indexOf(r.referentielId) === -1 &&
          this.referentielService.mainActivitiesId.indexOf(r.referentielId) !==
            -1
      ),
      'percent'
    );
  }
}
