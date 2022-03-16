import { Component, Input, OnChanges } from '@angular/core';
import { sumBy } from 'lodash';
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
import { MainClass } from 'src/app/libs/main-class';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { fixDecimal } from 'src/app/utils/numbers';
import { etpLabel } from 'src/app/utils/referentiel';

@Component({
  selector: 'panel-history-ventilation',
  templateUrl: './panel-history-ventilation.component.html',
  styleUrls: ['./panel-history-ventilation.component.scss'],
})
export class PanelHistoryVentilationComponent extends MainClass implements OnChanges {
  @Input() dateStart: Date = new Date();
  @Input() dateStop: Date = new Date();
  @Input() fonction: HRFonctionInterface | null = null;
  @Input() etp: number = 1;
  @Input() indisponibilities: RHActivityInterface[] = [];
  @Input() activities: RHActivityInterface[] = [];
  indisponibility: number = 0;
  timeWorked: string = '';

  constructor(private humanResourceService: HumanResourceService) {
    super();
  }

  ngOnChanges() {
    const referentiel = this.humanResourceService.allContentieuxReferentiel;

    this.indisponibility = fixDecimal(sumBy(this.indisponibilities, 'percent') / 100);
    this.indisponibilities = this.indisponibilities.map(i => {
      if(!i.contentieux) {
        i.contentieux = referentiel.find(r => r.id === i.referentielId);
      }

      return i;
    })

    this.timeWorked = etpLabel(this.etp);
  }
}
