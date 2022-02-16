import { Injectable } from '@angular/core';
import { mean, sortBy, sumBy } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { CalculatorInterface, etpAffectedInterface } from 'src/app/interfaces/calculator';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { workingDay } from 'src/app/utils/dates';
import { fixDecimal } from 'src/app/utils/numbers';
import { environment } from 'src/environments/environment';
import { ActivitiesService } from '../activities/activities.service';
import { HumanResourceService } from '../human-resource/human-resource.service';
import { ReferentielService } from '../referentiel/referentiel.service';

const now = new Date(2021, 0);
const end = new Date(2021, 11, 31);

@Injectable({
  providedIn: 'root',
})
export class CalculatorService {
  calculatorDatas: BehaviorSubject<CalculatorInterface[]> = new BehaviorSubject<
    CalculatorInterface[]
  >([]);
  dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(now);
  dateStop: BehaviorSubject<Date> = new BehaviorSubject<Date>(end);
  referentielIds: number[] = [];

  constructor(
    private humanResourceService: HumanResourceService,
    private activitiesService: ActivitiesService,
    private referentielService: ReferentielService,
  ) {
    this.activitiesService.activities.subscribe(() => this.syncDatas());
    this.humanResourceService.categories.subscribe(() => this.syncDatas());
    this.humanResourceService.hr.subscribe(() => this.syncDatas());
    this.dateStart.subscribe(() => this.syncDatas());
    this.dateStop.subscribe(() => this.syncDatas());
  }

  syncDatas() {
    if (this.humanResourceService.categories.getValue().length === 0) {
      return;
    }

    const list: CalculatorInterface[] = [];
    const nbMonth = this.getNbMonth();
    const referentiels =
      this.humanResourceService.contentieuxReferentiel.getValue();
    for (let i = 0; i < referentiels.length; i++) {
      const childrens = (referentiels[i].childrens || []).map((c) => {
        const cont = {...c, parent: referentiels[i]};
        
        return {
          ...this.getActivityValues(cont, nbMonth),
          childrens: [],
          contentieux: cont,
          nbMonth,
        }
      });

      list.push({
        ...this.getActivityValues(referentiels[i], nbMonth),
        childrens,
        contentieux: referentiels[i],
        nbMonth,
      });
    }

    this.calculatorDatas.next(list);
  }

  getActivityValues(referentiel: ContentieuReferentielInterface, nbMonth: number) {
    const activities = sortBy(
      this.activitiesService.activities
        .getValue()
        .filter(
          (a) =>
            a.contentieux.id === referentiel.id &&
            a.periode.getTime() >= this.dateStart.getValue().getTime() &&
            a.periode.getTime() < this.dateStop.getValue().getTime()
        ),
      'periode'
    );
    const totalIn = Math.floor(sumBy(activities, 'entrees') / nbMonth);
    const totalOut = Math.floor(sumBy(activities, 'sorties') / nbMonth);
    const totalStock = activities.length
      ? activities[activities.length - 1].stock
      : 0;

    const realCoverage = fixDecimal(totalOut / totalIn);
    const realDTESInMonths = fixDecimal(totalStock / totalOut);

   
    const etpAffected = this.getHRPositions(referentiel);
    const etpMag = etpAffected.length >= 0 ? etpAffected[0].totalEtp : 0;
    const etpFon = etpAffected.length >= 1 ? etpAffected[1].totalEtp : 0;
    const etpCont = etpAffected.length >= 2 ? etpAffected[2].totalEtp : 0;

    // Temps moyens par dossier observé = (nb heures travaillées par mois) / (sorties moyennes par mois / etpt sur la periode)
    const realTimePerCase = fixDecimal(
      ((environment.nbDaysByMagistrat / 12) *
        environment.nbHoursPerDay) /
        (totalOut / sumBy(etpAffected, 'totalEtp'))
    );

    return {
      ...this.calculateActivities(referentiel, totalIn, totalStock, etpAffected),
      totalIn,
      totalOut,
      totalStock,
      realCoverage,
      realDTESInMonths,
      realTimePerCase,
      etpMag,
      etpFon,
      etpCont,
      etpAffected,
    };
  }

  getNbMonth() {
    let totalMonth = 0;

    const now = new Date(this.dateStart.getValue());
    do {
      totalMonth++;
      now.setMonth(now.getMonth() + 1);
    } while (now.getTime() <= this.dateStop.getValue().getTime());

    return totalMonth;
  }


  calculateActivities(referentiel: ContentieuReferentielInterface, totalIn: number, totalStock: number, etpAffected: etpAffectedInterface[]) {
    let calculateTimePerCase = null;
    let calculateOut = null;
    let calculateCoverage = null;
    let calculateDTESInMonths = null;

    if (referentiel && referentiel.averageProcessingTime) {
      calculateTimePerCase = referentiel.averageProcessingTime;
    } else if (
      referentiel &&
      referentiel.parent &&
      referentiel.parent.averageProcessingTime
    ) {
      calculateTimePerCase = referentiel.parent.averageProcessingTime;
    }

    if (calculateTimePerCase) {
      calculateOut = Math.floor(
        (((sumBy(etpAffected, 'totalEtp') * environment.nbHoursPerDay) /
          calculateTimePerCase) *
          environment.nbDaysByMagistrat) /
          12
      );
      calculateCoverage = fixDecimal(
        calculateOut / (totalIn || 0)
      );
      calculateDTESInMonths = fixDecimal(
        (totalStock || 0) / calculateOut
      );
    } else {
      calculateOut = null;
      calculateCoverage = null;
      calculateDTESInMonths = null;
    }

    return { 
      calculateTimePerCase,
      calculateOut,
      calculateCoverage,
      calculateDTESInMonths,
    }
  }

  getHRPositions(referentiel: ContentieuReferentielInterface) {
    const hr = this.humanResourceService.hr.getValue();
    const hrCategories: any = {};

    this.humanResourceService.categories.getValue().map((c) => {
      hrCategories[c.label] = hrCategories[c.label] || {
        totalEtp: 0,
        list: [],
        rank: c.rank,
      };
      
      for (let i = 0; i < hr.length; i++) {
        const etpt = this.getHRVentilation(hr[i], c.id, referentiel);
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

    return sortBy(list, 'rank');
  }

  getHRVentilation(hr: HumanResourceInterface, categoryId: number, referentiel: ContentieuReferentielInterface): number {
    const activities = (hr.activities || []).filter(
      (a) => a.referentielId === referentiel.id
    );
    const indisponibilities = (hr.activities || []).filter(
      (a) => this.referentielService.idsIndispo.indexOf(a.referentielId) !== -1
    );
    const list = [];

    if (activities.length) {
      const now = new Date(this.dateStart.getValue());
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
      } while (now.getTime() <= this.dateStop.getValue().getTime());
    }

    return mean(list);
  }
}
