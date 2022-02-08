import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
} from '@angular/core';
import { sumBy } from 'lodash';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
import { MainClass } from 'src/app/libs/main-class';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';
import { fixDecimal } from 'src/app/utils/numbers';

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
  @Input() selected: boolean = false;
  @Input() header: boolean = true;
  @Output() referentielChange: EventEmitter<ContentieuReferentielInterface[]> =
    new EventEmitter();
  referentiel: ContentieuReferentielInterface[] = [];
  percentAffected: number = 0;
  refIndexSelected: number = -1;
  emptyArray: number[] = [];

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

  getPercentAffected(ref: ContentieuReferentielInterface) {
    const activity = this.activities.find((a) => a.referentielId === ref.id);
    const percent = fixDecimal(activity && activity.percent ? activity.percent : 0, 10);

    return {
      percent,
      totalAffected: ((percent || 0) * (this.etp || 0)) / 100,
    };
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
        const { percent, totalAffected } = this.getPercentAffected(ref);
        ref.percent = percent;
        ref.totalAffected = totalAffected;

        ref.childrens = (ref.childrens || []).map((c) => {
          const { percent, totalAffected } = this.getPercentAffected(c);
          c.percent = percent;
          c.totalAffected = totalAffected;
          return c;
        });
        return ref;
      });

    this.onTotalAffected();
  }

  onTotalAffected() {
    this.percentAffected = Math.floor(sumBy(this.referentiel, 'percent'));
  }

  onTogglePanel(index: number) {
    if (index !== this.refIndexSelected) {
      this.refIndexSelected = index;
      this.emptyArray = [];
      for (
        let i = (this.referentiel[index].childrens || []).length;
        i < this.referentiel.length - 2;
        i++
      ) {
        this.emptyArray.push(i);
      }
    } else {
      this.refIndexSelected = -1;
    }
  }

  onChangePercent(
    referentiel: ContentieuReferentielInterface,
    percent: number,
    parentReferentiel: ContentieuReferentielInterface | null = null
  ) {
    referentiel.percent = percent;
    if (referentiel.childrens && referentiel.childrens.length) {
      // is main
      referentiel.childrens = (referentiel.childrens || []).map((r) => ({
        ...r,
        percent: 0,
      }));
    } else if (parentReferentiel) {
      // is child
      parentReferentiel.percent = sumBy(
        parentReferentiel.childrens || [],
        'percent'
      );
    }

    this.referentielChange.emit(this.referentiel);
    this.onTotalAffected();
  }
}
