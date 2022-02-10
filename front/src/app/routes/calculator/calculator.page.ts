import { Component, OnDestroy, OnInit } from '@angular/core';
import { dataInterface } from 'src/app/components/select/select.component';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { MainClass } from 'src/app/libs/main-class';
import { CalculatorService } from 'src/app/services/calculator/calculator.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';
@Component({
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
})
export class CalculatorPage extends MainClass implements OnDestroy, OnInit {
  referentiel: ContentieuReferentielInterface[] = [];
  referentielIds: number[] = [];
  dateStart: Date = this.calculatorService.dateStart;
  dateStop: Date = this.calculatorService.dateStop;
  formReferentiel: dataInterface[] = [];

  constructor(
    private humanResourceService: HumanResourceService,
    private calculatorService: CalculatorService,
    private referentielService: ReferentielService
  ) {
    super();
  }

  ngOnInit() {
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.id) === -1
        );
        this.formatReferenteil();
        this.onCalculate();
      })
    );
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  formatReferenteil() {
    this.formReferentiel = this.referentiel.map((r) => ({
      id: r.id,
      value: this.referentielMappingName(r.label),
    }));
  }

  updateReferentielSelected(type: string = '', event: any = null) {
    if(type === 'referentiel') {
      this.referentielIds = event;
      this.calculatorService.referentielIds = this.referentielIds;
    } else if (type === 'dateStart') {
      this.calculatorService.dateStart = new Date(event);
      this.dateStart = new Date(event);
    } else if (type === 'dateStop') {
      this.calculatorService.dateStop = new Date(event);
      this.dateStop = new Date(event);
    }
  }

  onCalculate() {
    if (this.referentiel.length && this.referentielIds.length === 0) {
      console.log(this.referentiel)
      this.referentielIds = this.referentiel.map((r) => r.id);
    }
  }

  trackBy(index: number, item: any) {
    return item;
  }
}
