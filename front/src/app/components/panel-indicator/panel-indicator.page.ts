import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { sumBy } from 'lodash';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { monthDiff } from 'src/app/utils/dates';

const now = new Date();

@Component({
  selector: 'aj-panel-indicator',
  templateUrl: './panel-indicator.page.html',
  styleUrls: ['./panel-indicator.page.scss'],
})
export class PanelIndicatorComponent implements OnInit, OnChanges {
  @Input() groupName: string | null = null;
  @Input() rangeStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  @Input() rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  rangeBeforeStart = new Date();
  datasFormated = {
    now: {
      in: 0,
      out: 0,
      stock: 0,
      coverageRate: 0,      
    },
    before: {
      in: 0,
      out: 0,
      stock: 0,
      coverageRate: 0,
    },
    etpAffected: 0,
    averageDelay: {
      day: 0,
      month: 0,
      coverageRateEstimate: 0,
    },
    evolution: {
      in: 0,
      out: 0,
      stock: 0,
    },
  };

  constructor(
    private humanResourceService: HumanResourceService
  ) {
    // default value
    this.rangeStart.setMonth(this.rangeStart.getMonth() - 1);
    this.humanResourceService.hr.subscribe(() => this.calculateETP());
  }

  ngOnInit() {
    this.calculDatas();
  }

  ngOnChanges() {
    const date = new Date(this.rangeStart);
    date.setMonth(date.getMonth() - monthDiff(this.rangeStart, this.rangeEnd));
    this.rangeBeforeStart = new Date(date.getFullYear(), date.getMonth(), 1);

    console.log('rangeBeforeStart', this.rangeBeforeStart)
    console.log('rangeStart', this.rangeStart)
    console.log('rangeEnd', this.rangeEnd)
  }

  calculDatas() {
    /*const list = this.indicatorService.listActivities(this.groupName);

    this.datasFormated.now = this.quantifyDatas(
      list.filter((l) => {
        const date = new Date(l.periode);
        return (
          this.rangeStart.getTime() <= date.getTime() &&
          date.getTime() <= this.rangeEnd.getTime()
        );
      })
    );
    this.datasFormated.before = this.quantifyDatas(
      list.filter((l) => {
        const date = new Date(l.periode);
        return (
          this.rangeBeforeStart.getTime() <= date.getTime() &&
          date.getTime() <= this.rangeStart.getTime()
        );
      })
    );

    this.calculateETP();

    this.datasFormated.evolution = {
      in: this.calculateEvolution(
        this.datasFormated.before.in,
        this.datasFormated.now.in
      ),
      out: this.calculateEvolution(
        this.datasFormated.before.out,
        this.datasFormated.now.out
      ),
      stock: this.calculateEvolution(
        this.datasFormated.before.stock,
        this.datasFormated.now.stock
      ),
    };*/
  }

  quantifyDatas(list: any[]) {
    const inTotal = sumBy(list, 'entrees');
    const out = sumBy(list, 'sorties');
    return {
      in: inTotal,
      out,
      stock: sumBy(list, 'stock'),
      coverageRate: out / inTotal,
    };
  }

  calculateEvolution(from: number, to: number) {
    if (from === 0 && to === 0) {
      return 0;
    } else if (from === 0) {
      return 1;
    } else if (to === 0) {
      return -1;
    } else {
      return Math.floor((to / from - 1) * 100) / 100;
    }
  }

  calculateETP() {
    if(!this.datasFormated.now.in) {
      return;
    }

    const hr = this.humanResourceService.hr.getValue();
    let totalEtp = 0;

    hr.map((human: HumanResourceInterface) => {
      totalEtp += 1
        /* TODO ((human.etp || 0) *
          sumBy(
            (human.activities || []).filter(
              (a) => (a.label || '') === this.groupName
            ),
            'percent'
          )) /
        100; */
    });

    console.log('this.datasFormated.now.stock = STOCK', this.datasFormated.now.stock)
    console.log('this.datasFormated.now.in = ', this.datasFormated.now.in)

    this.datasFormated.etpAffected = totalEtp;

    const timeRequired = 0.5 // TODO faire venir de la base - ici 0.5 = 4h
    const workTimePerYear = 210
    const outgoingFlowForEach = workTimePerYear / timeRequired

    // calculate estimate delay for resolution contentieux's
    const diffTime = Math.abs(
      this.rangeStart.getTime() - this.rangeEnd.getTime()
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // in "diffDays" we have this.datasFormated.now.in folders
    // in 365 days we have this.datasFormated.now.in * 365 / diffDays
    const totalNewFolderForAYear = this.datasFormated.now.in * 365 / diffDays

    // outgoing flow
    //const outgoingFlow = this.datasFormated.now.stock + totalNewFolderForAYear - (outgoingFlowForEach * totalEtp)
    const outgoingFlow = this.datasFormated.now.stock / (outgoingFlowForEach * totalEtp)
    
    // estimate delay
    const delayInDay = outgoingFlow * timeRequired / totalEtp

    this.datasFormated.averageDelay = {
      day: Math.floor(delayInDay),
      month: Math.floor(delayInDay * 12 / workTimePerYear),
      coverageRateEstimate: Math.floor((outgoingFlowForEach * totalEtp / totalNewFolderForAYear) * 100) / 100
    }
  }
}
