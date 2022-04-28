import { Component, OnDestroy, OnInit } from '@angular/core';
import { dataInterface } from 'src/app/components/select/select.component';
import { CalculatorInterface } from 'src/app/interfaces/calculator';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { MainClass } from 'src/app/libs/main-class';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';
import { isLabeledStatement } from 'typescript';

@Component({
  templateUrl: './simulator.page.html',
  styleUrls: ['./simulator.page.scss'],
})
export class SimulatorPage extends MainClass implements OnDestroy, OnInit {
  referentielIds: number[] = [];
  subReferentielIds: number[] = [];
  formReferentiel: dataInterface[] = [];
  datas: CalculatorInterface[] = [];
  referentiel: ContentieuReferentielInterface[] = [];
  dateStart: Date = new Date();
  dateStop: Date | null = null;
  tomorrow: Date | null = null;

  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService
  ) {
    super();
  }

  ngOnInit(): void {
    this.tomorrow = new Date(this.dateStart);
    this.tomorrow.setDate(this.tomorrow.getDate() + 1);
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

  ngOnDestroy() {}

  onCalculate() {
    if (this.referentiel.length && this.referentielIds.length === 0) {
      this.referentielIds = [this.referentiel[0].id];
      this.referentiel[0].childrens !== undefined
        ? (this.subReferentielIds = this.referentiel[0].childrens?.map(
            (line) => line.id
          ))
        : null;
    }
  }

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

  updateReferentielSelected(type: string = '', event: any = null) {
    if (type === 'referentiel') {
      this.subReferentielIds = [];
      const fnd = this.referentiel.find((o) => o.id === event[0]);
      fnd?.childrens?.map((value) => this.subReferentielIds.push(value.id));
      this.referentielIds = event;
    } else if (type === 'subReferentiel') {
      this.subReferentielIds = event;
    } else if (type === 'dateStart') {
      //this.dateStart = new Date(event);
    } else if (type === 'dateStop') {
      //this.dateStop = new Date(event);
    }
  }
}
