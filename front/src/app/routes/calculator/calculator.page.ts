import { Component, OnDestroy, OnInit } from '@angular/core';
import { orderBy } from 'lodash';
import { dataInterface } from 'src/app/components/select/select.component';
import { CalculatorInterface } from 'src/app/interfaces/calculator';
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
  dateStart: Date = this.calculatorService.dateStart.getValue();
  dateStop: Date = this.calculatorService.dateStop.getValue();
  formReferentiel: dataInterface[] = [];
  sortBy: string = '';
  datas: CalculatorInterface[] = [];
  datasFilted: CalculatorInterface[] = [];

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
    this.watch(
      this.calculatorService.calculatorDatas.subscribe((d) =>
        this.formatDatas(d)
      )
    );

    this.calculatorService.syncDatas();
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  formatDatas(list: CalculatorInterface[]) {
    this.datas = list;
    this.filtredDatas();
  }

  filtredDatas() {
    let list = this.datas.filter(
      (d) => this.referentielIds.indexOf(d.contentieux.id) !== -1
    );
    if (this.sortBy) {
      // @ts-ignore
      list = orderBy(list, [(o) => { return o[this.sortBy] || 0; }], ['desc']);
    }

    this.datasFilted = list;
  }

  formatReferenteil() {
    this.formReferentiel = this.referentiel.map((r) => ({
      id: r.id,
      value: this.referentielMappingName(r.label),
    }));
  }

  updateReferentielSelected(type: string = '', event: any = null) {
    if (type === 'referentiel') {
      this.referentielIds = event;
      this.calculatorService.referentielIds = this.referentielIds;
    } else if (type === 'dateStart') {
      this.dateStart = new Date(event);
      this.calculatorService.dateStart.next(this.dateStart);
    } else if (type === 'dateStop') {
      this.dateStop = new Date(event);
      this.calculatorService.dateStop.next(this.dateStop);
    }

    this.filtredDatas();
  }

  onCalculate() {
    if (this.referentiel.length && this.referentielIds.length === 0) {
      this.referentielIds = this.referentiel.map((r) => r.id);
      this.filtredDatas();
    }
  }

  trackBy(index: number, item: CalculatorInterface) {
    return item.contentieux.id;
  }

  onSortBy(type: string) {
    if (this.sortBy === type) {
      this.sortBy = '';
    } else {
      this.sortBy = type;
    }
    
    this.filtredDatas();
  }
}
