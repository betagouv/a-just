import { Component, OnDestroy, OnInit } from '@angular/core';
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
  referentielIds: number[] = this.calculatorService.referentielIds;
  dateStart: Date = this.calculatorService.dateStart;
  dateStop: Date = this.calculatorService.dateStop;

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
        this.onCalculate();
      })
    );
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  updateReferentielSelected() {
    this.calculatorService.referentielIds = this.referentielIds;
    this.calculatorService.dateStart = this.dateStart;
    this.calculatorService.dateStop = this.dateStop;
  }

  onCalculate() {
    if (this.referentiel.length && this.referentielIds.length === 0) {
      this.referentielIds = this.referentiel.map((r) => r.id);
    }
  }

  trackBy(index: number, item: any) {
    return item;
  }
}
