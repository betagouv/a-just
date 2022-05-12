import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { dataInterface } from 'src/app/components/select/select.component';
import { CalculatorInterface } from 'src/app/interfaces/calculator';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { SimulatorInterface } from 'src/app/interfaces/simulator';
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
  referentielId: number | null = null;
  subReferentielIds: number[] = [];
  formReferentiel: dataInterface[] = [];
  datas: SimulatorInterface | null = null;
  referentiel: ContentieuReferentielInterface[] = [];
  dateStart: Date = new Date();
  dateStop: Date | null = new Date();
  today: Date = new Date();
  todaySituation: Object | null = null;

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
      this.simulatorService.situationActuelle.subscribe((d) => {
        this.formatDatas(this.simulatorService.situationActuelle.getValue());
      })
    );

    this.simulatorService.syncDatas(this.referentielId);
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

  formatDatas(list: SimulatorInterface | null) {
    this.datas = list;
  }

  updateReferentielSelected(type: string = '', event: any = null) {
    if (type === 'referentiel') {
      this.subReferentielIds = [];
      const fnd = this.referentiel.find((o) => o.id === event[0]);
      fnd?.childrens?.map((value) => this.subReferentielIds.push(value.id));
      this.referentielId = event[0];
      this.simulatorService.referentielOrSubReferentielId.next(
        this.referentielId as number
      );
    } else if (type === 'subReferentiel') {
      this.subReferentielIds = event;
      const tmpRefLength = this.referentiel.find(
        (v) => v.id === this.referentielId
      );
      if (event.length === tmpRefLength?.childrens?.length)
        this.simulatorService.referentielOrSubReferentielId.next(
          this.referentielId as number
        );
      else
        this.simulatorService.referentielOrSubReferentielId.next(
          this.subReferentielIds[0] as number
        );
    } else if (type === 'dateStart') {
      this.dateStart = new Date(event);
      if (this.dateStart.getDate() !== this.today.getDate())
        this.mooveClass = 'future';
      else this.mooveClass = '';
    } else if (type === 'dateStop') {
      this.dateStop = new Date(event);
    }
  }

  getFieldValue(param: string) {
    if (
      (this.simulatorService.situationActuelle.getValue() !== null &&
        this.subReferentielIds.length) ||
      this.referentielId === 485
    ) {
      switch (param) {
        case 'etpMag':
          return this.datas?.etpMag || '0';
        case 'totalOut':
          return this.datas?.totalOut || '0';
        case 'totalIn':
          return this.datas?.totalIn || '0';
        case 'lastStock':
          return this.datas?.lastStock || '0';
        case 'etpMag':
          return this.datas?.etpMag || '0';
        case 'etpFon':
          return this.datas?.etpFon || '0';
        case 'realCoverage':
          return this.datas?.realCoverage || '0';
        case 'realDTESInMonths':
          return this.datas?.realDTESInMonths || '0';
        case 'realTimePerCase':
          return this.decimalToStringDate(this.datas?.realTimePerCase) || '0';
        case 'ETPTGreffe':
          return '';
      }
    }
    return;
  }
  decimalToStringDate(decimal: number | null | undefined) {
    if (decimal != null) {
      const n = new Date(0, 0);
      n.setMinutes(+decimal * 60);
      return n.toTimeString().slice(0, 5);
    }
    return;
  }
}
