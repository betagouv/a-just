import { Component, OnDestroy, OnInit } from '@angular/core';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { MainClass } from 'src/app/libs/main-class';
import { CalculatorService } from 'src/app/services/calculator/calculator.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';
import {
  MAT_DATE_FORMATS,
} from '@angular/material/core';

// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.
import * as _moment from 'moment';
// @ts-ignore
import { default as _rollupMoment, Moment } from 'moment';
import { MatDatepicker } from '@angular/material/datepicker';

const moment = _rollupMoment || _moment;

// See the Moment.js docs for the meaning of these formats:
// https://momentjs.com/docs/#/displaying/format/
export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
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

  chosenYearHandler(normalizedYear: Moment, date: string) {
    if (date === 'dateStart') {
      this.dateStart.setFullYear(normalizedYear.year());
      this.dateStart = new Date(this.dateStart);
    } else {
      this.dateStop.setFullYear(normalizedYear.year());
      this.dateStop = new Date(this.dateStop);
    }
  }

  chosenMonthHandler(
    normalizedMonth: Moment,
    datepicker: MatDatepicker<Moment>,
    date: string
  ) {
    if (date === 'dateStart') {
      this.dateStart.setMonth(normalizedMonth.month());
      this.dateStart = new Date(this.dateStart);
    } else {
      this.dateStop.setMonth(normalizedMonth.month());
      this.dateStop = new Date(this.dateStop);
    }
    datepicker.close();
  }
}
