import { Component, Input, OnInit } from '@angular/core';
import { sortBy, sumBy } from 'lodash';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { MainClass } from 'src/app/libs/main-class';
import { ActivitiesService } from 'src/app/services/activities/activities.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { fixDecimal } from 'src/app/utils/numbers';

@Component({
  selector: 'aj-referentiel-calculator',
  templateUrl: './referentiel-calculator.component.html',
  styleUrls: ['./referentiel-calculator.component.scss'],
})
export class ReferentielCalculatorComponent
  extends MainClass
  implements OnInit
{
  @Input() referentielId: number | null = null;
  @Input() dateStart: Date = new Date();
  @Input() dateStop: Date = new Date();
  referentiel: ContentieuReferentielInterface | null = null;
  totalIn: number | null = null;
  totalOut: number | null = null;
  totalStock: number | null = null;
  realCover: number | null = null;
  realDTES: number | null = null;
  realDelay: number | null = null;
  calculateDelay: number | null = null;
  calculateOut: number | null = null;
  calculateCover: number | null = null;
  calculateDTES: number | null = null;
  nbMonth: number = 0;
  etpAffected: any[] = [];

  constructor(
    private humanResourceService: HumanResourceService,
    private activitiesService: ActivitiesService
  ) {
    super();
  }

  ngOnInit() {
    this.referentiel = this.getReferentiel();
    this.watch(
      this.activitiesService.activities.subscribe(() =>
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
    const activities = this.activitiesService.activities
      .getValue()
      .filter(
        (a) =>
          a.contentieux.id === this.referentielId &&
          a.periode.getTime() >= this.dateStart.getTime() &&
          a.periode.getTime() < this.dateStop.getTime()
      );
    this.totalIn = sumBy(activities, 'entrees');
    this.totalOut = sumBy(activities, 'sorties');
    this.totalStock = sumBy(activities, 'stock');

    this.realCover = this.totalOut / this.totalIn;
    this.nbMonth = this.getNbMonth();
    this.realDTES = this.totalStock / this.totalOut / this.nbMonth;

    this.getHRPositions();

    // Temps moyens par dossier observé = sorties sur la période / etp / heure
    this.realDelay = fixDecimal(
      ((this.environment.nbDaysByMagistrat / 12) *
        this.environment.nbHoursPerDay *
        this.nbMonth) /
        (this.totalOut / sumBy(this.etpAffected, 'totalEtp'))
    );

    // calculate activities
    this.calculateActivities();
  }

  getHRPositions() {
    const hr = this.humanResourceService.hr.getValue();
    const hrCategories: any = {};
    const list = [];

    for (let i = 0; i < hr.length; i++) {
      const category = hr[i].category;
      if (category) {
        const categoryLabel = category.label || 'default';
        hrCategories[categoryLabel] = hrCategories[categoryLabel] || {
          totalEtp: 0,
          list: [],
          rank: category.rank,
        };
        hrCategories[categoryLabel].list.push(hr[i]);
        hrCategories[categoryLabel].totalEtp += this.getHRVentilation(hr[i]);
      }
    }

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

  getHRVentilation(hr: HumanResourceInterface) {
    const activities = (hr.activities || []).filter(
      (a) => a.referentielId === this.referentielId
    );
    let totalEtp = 0;
    let totalMonth = 0;

    if (activities.length) {
      const now = new Date(this.dateStart);
      do {
        for (let i = 0; i < activities.length; i++) {
          let isBiggerThanStart = !activities[i].dateStart ? true : false;
          let isLowerThanEnd = !activities[i].dateStop ? true : false;

          if (activities[i].dateStart) {
            let dateStart = new Date(
              activities[i].dateStart!.getFullYear(),
              activities[i].dateStart!.getMonth()
            );
            if (dateStart.getTime() <= now.getTime()) {
              isBiggerThanStart = true;
            }
          }

          if (activities[i].dateStop) {
            let dateStop = new Date(
              activities[i].dateStop!.getFullYear(),
              activities[i].dateStop!.getMonth()
            );
            if (dateStop.getTime() >= now.getTime()) {
              isLowerThanEnd = true;
            }
          }

          if (isBiggerThanStart && isLowerThanEnd) {
            totalEtp += activities[i].percent || 100;
            break;
          }
        }
        totalMonth++;
        now.setMonth(now.getMonth() + 1);
      } while (now.getTime() <= this.dateStop.getTime());
    }

    if (totalEtp) {
      return fixDecimal(totalEtp / totalMonth) / 100;
    }

    return 0;
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
    if (this.referentiel && this.referentiel.averageProcessingTime) {
      this.calculateDelay = this.referentiel.averageProcessingTime;
      this.calculateOut = Math.floor(
        ((((this.getTotalEtp() * this.environment.nbHoursPerDay) /
          this.calculateDelay) *
          this.environment.nbDaysByMagistrat) /
          12) *
          this.getNbMonth()
      );
      this.calculateCover = this.calculateOut / (this.totalIn || 0);
      this.calculateDTES = fixDecimal(
        (this.totalStock || 0) / this.calculateOut / this.nbMonth
      );
    } else {
      this.calculateDelay = null;
      this.calculateOut = null;
      this.calculateCover = null;
      this.calculateDTES = null;
    }
  }

  getTotalEtp() {
    return sumBy(this.etpAffected, 'totalEtp');
  }
}
