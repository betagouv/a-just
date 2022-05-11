import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { dataInterface } from 'src/app/components/select/select.component';
import { CalculatorInterface } from 'src/app/interfaces/calculator';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { MainClass } from 'src/app/libs/main-class';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';
import { SimulatorService } from 'src/app/services/simulator/simulator.service';
@Component({
  templateUrl: './simulator.page.html',
  styleUrls: ['./simulator.page.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 })),
      ]),
      transition(':leave', [animate(500, style({ opacity: 0 }))]),
    ]),
  ],
})
export class SimulatorPage extends MainClass implements OnDestroy, OnInit {
  mooveClass: string = '';
  referentielIds: number[] = [];
  subReferentielIds: number[] = [];
  formReferentiel: dataInterface[] = [];
  datas: CalculatorInterface[] = [];
  referentiel: ContentieuReferentielInterface[] = [];
  dateStart: Date = this.simulatorService.dateStart.getValue();
  dateStop: Date | null = this.simulatorService.dateStop.getValue();
  today: Date = new Date();
  todaySituation: Object | null = null;
  datasFilted: CalculatorInterface[] = [];

  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private simulatorService: SimulatorService
  ) {
    super();
  }

  ngOnInit(): void {
    this.dateStop = null;
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.id) === -1
        );
        this.formatReferenteil();
      })
    );

    this.watch(
      this.simulatorService.simulatorDatas.subscribe((d) => {
        this.formatDatas(d);
      })
    );

    this.simulatorService.syncDatas();
  }

  ngOnDestroy() {}

  formatReferenteil() {
    this.formReferentiel = this.referentiel.map((r) => ({
      id: r.id,
      value: this.referentielMappingName(r.label),
      childrens: r.childrens?.map((s) => ({
        id: s.id,
        value: s.label,
        parentId: r.id,
      })),
    }));
  }

  formatDatas(list: CalculatorInterface[]) {
    this.datas = list;
    this.filtredDatas();
  }

  filtredDatas() {
    let list = this.datas.filter(
      (d) => this.referentielIds.indexOf(d.contentieux.id) !== -1
    );
    this.datasFilted = list;
  }

  updateReferentielSelected(type: string = '', event: any = null) {
    if (type === 'referentiel') {
      this.subReferentielIds = [];
      const fnd = this.referentiel.find((o) => o.id === event[0]);
      fnd?.childrens?.map((value) => this.subReferentielIds.push(value.id));
      this.referentielIds = event;
      this.simulatorService.referentielIds = this.referentielIds;
      this.simulatorService.subReferentielIds.next(this.subReferentielIds);
    } else if (type === 'subReferentiel') {
      this.subReferentielIds = event;
      this.simulatorService.subReferentielIds.next(this.subReferentielIds);
    } else if (type === 'dateStart') {
      this.dateStart = new Date(event);
      if (this.dateStart.getDate() !== this.today.getDate())
        this.mooveClass = 'future';
      else this.mooveClass = '';
      this.simulatorService.dateStart.next(this.dateStart);
    } else if (type === 'dateStop') {
      this.dateStop = new Date(event);
      this.simulatorService.dateStop.next(this.dateStop);
    }
    this.filtredDatas();
  }

  getFieldValue(param: string) {
    if (this.datasFilted[0] && this.subReferentielIds.length) {
      switch (param) {
        case 'etpMag':
          return this.datasFilted[0].etpMag;
        case 'totalOut':
          return this.datasFilted[0].totalOut;
        case 'totalIn':
          return this.datasFilted[0].totalIn;
        case 'lastStock':
          return this.datasFilted[0].lastStock;
        case 'etpMag':
          return this.datasFilted[0].etpMag;
        case 'etpFon':
          return this.datasFilted[0].etpFon;
        case 'realCoverage':
          return this.datasFilted[0].realCoverage;
        case 'realDTESInMonths':
          return this.datasFilted[0].realDTESInMonths;
        case 'realTimePerCase':
          return this.decimalToStringDate(this.datasFilted[0].realTimePerCase);
        case 'ETPTGreffe':
          return '';
      }
    }
    return;
  }
  decimalToStringDate(decimal: number | null) {
    if (decimal != null) {
      const n = new Date(0, 0);
      n.setMinutes(+decimal * 60);
      return n.toTimeString().slice(0, 5);
    }
    return;
  }
}
