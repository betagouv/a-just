import { Component, HostBinding, Input, OnChanges } from '@angular/core';
import { mean, sortBy, sumBy } from 'lodash';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { MainClass } from 'src/app/libs/main-class';
import { ActivitiesService } from 'src/app/services/activities/activities.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';
import { workingDay } from 'src/app/utils/dates';
import { fixDecimal } from 'src/app/utils/numbers';

@Component({
  selector: 'aj-referentiel-calculator',
  templateUrl: './referentiel-calculator.component.html',
  styleUrls: ['./referentiel-calculator.component.scss'],
})
export class ReferentielCalculatorComponent
  extends MainClass
  implements OnChanges
{
  @Input() referentielId: number | null = null;
  @Input() dateStart: Date = new Date();
  @Input() dateStop: Date = new Date();
  @HostBinding('class.show-children') showChildren: boolean = false;
  referentiel: ContentieuReferentielInterface | null = null;
  totalIn: number | null = null;
  totalOut: number | null = null;
  totalStock: number | null = null;
  realCoverage: number | null = null;
  realDTESInMonths: number | null = null;
  realTimePerCase: number | null = null;
  calculateTimePerCase: number | null = null;
  calculateOut: number | null = null;
  calculateCoverage: number | null = null;
  calculateDTESInMonths: number | null = null;
  nbMonth: number = 0;
  etpAffected: any[] = [];

  constructor(
    private humanResourceService: HumanResourceService,
    private activitiesService: ActivitiesService,
    private referentielService: ReferentielService,
  ) {
    super();
  }

  ngOnChanges() {
    this.watcherDestroy();
    this.referentiel = this.getReferentiel();
    this.watch(
      this.activitiesService.activities.subscribe(() =>
        this.getActivityValues()
      )
    );
    this.watch(
      this.humanResourceService.categories.subscribe(() =>
        this.getActivityValues()
      )
    );
    this.watch(
      this.humanResourceService.hr.subscribe(() => this.getActivityValues())
    );
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  getReferentiel() {
    const list = this.humanResourceService.contentieuxReferentiel.getValue();
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === this.referentielId) {
        return list[i];
      } else {
        // search in childrens
        const childrens = list[i].childrens || [];
        const subRef = childrens.find((r) => r.id === this.referentielId);
        if (subRef) {
          return {
            ...subRef,
            parent: list[i],
          };
        }
      }
    }

    return null;
  }

  getActivityValues() {
    if (this.humanResourceService.categories.getValue().length === 0) {
      return;
    }

    const activities = sortBy(
      this.activitiesService.activities
        .getValue()
        .filter(
          (a) =>
            a.contentieux.id === this.referentielId &&
            a.periode.getTime() >= this.dateStart.getTime() &&
            a.periode.getTime() < this.dateStop.getTime()
        ),
      'periode'
    );
    this.nbMonth = this.getNbMonth();
    this.totalIn = Math.floor(sumBy(activities, 'entrees') / this.nbMonth);
    this.totalOut = Math.floor(sumBy(activities, 'sorties') / this.nbMonth);
    this.totalStock = activities.length
      ? activities[activities.length - 1].stock
      : 0;

    this.realCoverage = fixDecimal(this.totalOut / this.totalIn);
    this.realDTESInMonths = fixDecimal(this.totalStock / this.totalOut);

    this.getHRPositions();

    // Temps moyens par dossier observé = (nb heures travaillées par mois) / (sorties moyennes par mois / etpt sur la periode)
    this.realTimePerCase = fixDecimal(
      ((this.environment.nbDaysByMagistrat / 12) *
        this.environment.nbHoursPerDay) /
        (this.totalOut / sumBy(this.etpAffected, 'totalEtp'))
    );

    // calculate activities
    this.calculateActivities();
  }

  getHRPositions() {
    const hr = this.humanResourceService.hr.getValue();
    const hrCategories: any = {};

    this.humanResourceService.categories.getValue().map((c) => {
      hrCategories[c.label] = hrCategories[c.label] || {
        totalEtp: 0,
        list: [],
        rank: c.rank,
      };
      
      for (let i = 0; i < hr.length; i++) {
        const etpt = this.getHRVentilation(hr[i], c.id);
        if(etpt) {
          hrCategories[c.label].list.push(hr[i]);
          hrCategories[c.label].totalEtp += etpt;
        }
      }
    });

    const list = [];
    for (const [key, value] of Object.entries(hrCategories)) {
      list.push({
        name: key,
        // @ts-ignore
        totalEtp: fixDecimal(value.totalEtp || 0),
        // @ts-ignore
        rank: value.rank,
      });
    }

    this.etpAffected = sortBy(list, 'rank');
  }

  getHRVentilation(hr: HumanResourceInterface, categoryId: number): number {
    const activities = (hr.activities || []).filter(
      (a) => a.referentielId === this.referentielId
    );
    const indisponibilities = (hr.activities || []).filter(
      (a) => this.referentielService.idsIndispo.indexOf(a.referentielId) !== -1
    );
    const list = [];

    if (activities.length) {
      const now = new Date(this.dateStart);
      do {
        // only working day
        if (workingDay(now)) {
          let etp = 0;
          const situation = this.humanResourceService.findSituation(hr, now);

          if (situation && situation.category.id === categoryId) {
            const activitiesFiltred =
              this.humanResourceService.filterActivitiesByDate(activities, now);
              const indispoFiltred =
                this.humanResourceService.filterActivitiesByDate(indisponibilities, now);
            etp = situation.etp * (100 - sumBy(indispoFiltred, 'percent')) / 100
            etp *= (sumBy(activitiesFiltred, 'percent') / 100);
          }

          list.push(etp);
        }
        now.setDate(now.getDate() + 1);
      } while (now.getTime() <= this.dateStop.getTime());
    }

    return mean(list);
  }

  getNbMonth() {
    let totalMonth = 0;

    const now = new Date(this.dateStart);
    do {
      totalMonth++;
      now.setMonth(now.getMonth() + 1);
    } while (now.getTime() <= this.dateStop.getTime());

    return totalMonth;
  }

  calculateActivities() {
    this.calculateTimePerCase = null;
    if (this.referentiel && this.referentiel.averageProcessingTime) {
      this.calculateTimePerCase = this.referentiel.averageProcessingTime;
    } else if (
      this.referentiel &&
      this.referentiel.parent &&
      this.referentiel.parent.averageProcessingTime
    ) {
      this.calculateTimePerCase = this.referentiel.parent.averageProcessingTime;
    }

    if (this.calculateTimePerCase) {
      this.calculateOut = Math.floor(
        (((this.getTotalEtp() * this.environment.nbHoursPerDay) /
          this.calculateTimePerCase) *
          this.environment.nbDaysByMagistrat) /
          12
      );
      this.calculateCoverage = fixDecimal(
        this.calculateOut / (this.totalIn || 0)
      );
      this.calculateDTESInMonths = fixDecimal(
        (this.totalStock || 0) / this.calculateOut
      );
    } else {
      this.calculateOut = null;
      this.calculateCoverage = null;
      this.calculateDTESInMonths = null;
    }
  }

  getTotalEtp() {
    return sumBy(this.etpAffected, 'totalEtp');
  }
}
