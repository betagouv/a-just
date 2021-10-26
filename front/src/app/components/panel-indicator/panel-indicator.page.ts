import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { sumBy } from 'lodash';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { IndicatorService } from 'src/app/services/indicator/indicator.service';

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
    },
    before: {
      in: 0,
      out: 0,
      stock: 0,
    },
    etpAffected: 0,
    evolution: {
      in: 0,
      out: 0,
      stock: 0,
    },
  };

  constructor(
    private indicatorService: IndicatorService,
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
    const diffTime = Math.abs(
      this.rangeStart.getTime() - this.rangeEnd.getTime()
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const date = new Date(this.rangeStart);
    date.setDate(date.getDate() - diffDays);
    this.rangeBeforeStart = new Date(date);
  }

  calculDatas() {
    const list = this.indicatorService.listActivities(this.groupName);

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

    this.datasFormated.etpAffected = this.calculateETP();

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
    };
  }

  quantifyDatas(list: any[]) {
    return {
      in: sumBy(list, 'entrees'),
      out: sumBy(list, 'sorties'),
      stock: sumBy(list, 'stock'),
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
    const hr = this.humanResourceService.hr.getValue();
    let totalEtp = 0;

    hr.map((human: HumanResourceInterface) => {
      totalEtp +=
        ((human.etp || 0) *
          sumBy(
            (human.activities || []).filter(
              (a) => (a.label || '') === this.groupName
            ),
            'percent'
          )) /
        100;
    });

    return totalEtp;
  }
}
