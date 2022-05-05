import { Injectable } from '@angular/core';
import { sortBy, sumBy } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import {
  CalculatorInterface,
  etpAffectedInterface,
} from 'src/app/interfaces/calculator';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { MainClass } from 'src/app/libs/main-class';
import { month, workingDay } from 'src/app/utils/dates';
import { fixDecimal } from 'src/app/utils/numbers';
import { ActivitiesService } from '../activities/activities.service';
import { HumanResourceService } from '../human-resource/human-resource.service';
import { environment } from 'src/environments/environment';

const start = new Date();
const end = new Date();

@Injectable({
  providedIn: 'root',
})
export class SimulatorService extends MainClass {
  simulatorDatas: BehaviorSubject<CalculatorInterface[]> = new BehaviorSubject<
    CalculatorInterface[]
  >([]);
  dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(start);
  dateStop: BehaviorSubject<Date> = new BehaviorSubject<Date>(end);
  referentielIds: number[] = [];
  subReferentielIds: BehaviorSubject<number[]> = new BehaviorSubject<number[]>(
    []
  );
  startCurrentSituation = month(new Date(), -15);
  endCurrentSituation = month(new Date(), -3, 'lastday');

  constructor(
    private humanResourceService: HumanResourceService,
    private activitiesService: ActivitiesService
  ) {
    super();
    this.watch(
      this.dateStart.subscribe(() => {
        if (this.simulatorDatas.getValue().length) {
          //this.cleanDatas();
        }
      })
    );

    this.watch(
      this.subReferentielIds.subscribe(() => {
        if (this.subReferentielIds.getValue().length) {
          this.cleanDatas();
        }
      })
    );

    this.watch(
      this.dateStop.subscribe(() => {
        if (this.simulatorDatas.getValue().length) {
          //this.cleanDatas();
        }
      })
    );

    this.watch(
      this.humanResourceService.hr.subscribe(() => {
        this.prepareDatas();
      })
    );
  }

  getHRPositions(referentiel: ContentieuReferentielInterface) {
    const hr = this.humanResourceService.hr.getValue();
    const categories = this.humanResourceService.categories.getValue();
    const hrCategories: any = {};

    categories.map((c) => {
      hrCategories[c.label] = hrCategories[c.label] || {
        totalEtp: 0,
        list: [],
        rank: c.rank,
      };
    });

    for (let i = 0; i < hr.length; i++) {
      const etptAll = this.getHRVentilation(hr[i], referentiel, categories);
      Object.values(etptAll).map((c) => {
        if (c.etpt) {
          hrCategories[c.label].list.push(hr[i]);
          hrCategories[c.label].totalEtp += c.etpt;
        }
      });
    }

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

  getHRVentilation(
    hr: HumanResourceInterface,
    referentiel: ContentieuReferentielInterface,
    categories: HRCategoryInterface[]
  ): number {
    const list: any = {};
    categories.map((c) => {
      list[c.id] = {
        etpt: 0,
        ...c,
      };
    });

    const now = new Date(this.startCurrentSituation);
    let nbDay = 0;
    do {
      // only working day
      if (workingDay(now)) {
        nbDay++;
        const situation = this.humanResourceService.findSituation(hr, now);
        //console.log('findSituation', situation);
        //console.log('referentiel', referentiel);
        if (situation && situation.category && situation.category.id) {
          const activitiesFiltred = (situation.activities || []).filter(
            (a) =>
              a.contentieux &&
              this.subReferentielIds.getValue().includes(a.contentieux.id) //a.contentieux.id === referentiel.id //
          );
          //console.log('activitiesFiltred', activitiesFiltred);
          const indispoFiltred =
            this.humanResourceService.findAllIndisponibilities(hr, now);
          let etp =
            (situation.etp * (100 - sumBy(indispoFiltred, 'percent'))) / 100;
          etp *= sumBy(activitiesFiltred, 'percent') / 100;

          list[situation.category.id].etpt += etp;
        }
      }
      now.setDate(now.getDate() + 1);
    } while (now.getTime() <= this.endCurrentSituation.getTime());

    // format render
    for (const property in list) {
      list[property].etpt = list[property].etpt / nbDay;
    }

    return list;
  }

  getActivityValues(
    referentiel: ContentieuReferentielInterface,
    nbMonth: number
  ) {
    const activities = sortBy(
      this.activitiesService.activities.getValue().filter((a) => {
        return (
          this.subReferentielIds.getValue().includes(a.contentieux.id) &&
          month(a.periode).getTime() >=
            month(this.startCurrentSituation).getTime() &&
          month(a.periode).getTime() <=
            month(this.endCurrentSituation).getTime()
        );
      }),
      'periode'
    );

    const totalIn = Math.floor(sumBy(activities, 'entrees') / nbMonth);
    const totalOut = Math.floor(sumBy(activities, 'sorties') / nbMonth);
    let lastStock = null;

    if (activities.length) {
      const lastActivities: any = activities.filter((a) =>
        this.isSameMonthAndYear(a.periode, this.endCurrentSituation)
      );
      lastStock = sumBy(lastActivities, 'stock');
    }

    const realCoverage = fixDecimal(totalOut / totalIn);
    const realDTESInMonths =
      lastStock !== null ? fixDecimal(lastStock / totalOut) : null;
    const etpAffected = this.getHRPositions(referentiel);
    const etpMag = etpAffected.length >= 0 ? etpAffected[0].totalEtp : 0;

    // Temps moyens par dossier observé = (nb heures travaillées par mois) / (sorties moyennes par mois / etpt sur la periode)
    const realTimePerCase = fixDecimal(
      ((environment.nbDaysByMagistrat / 12) * environment.nbHoursPerDay) /
        (totalOut / sumBy(etpAffected, 'totalEtp'))
    );

    return {
      totalIn,
      totalOut,
      lastStock,
      realCoverage,
      realDTESInMonths,
      realTimePerCase,
      etpMag,
    };
  }

  prepareDatas() {
    if (this.humanResourceService.categories.getValue().length === 0) {
      return;
    }

    const list: CalculatorInterface[] = [];
    const referentiels =
      this.humanResourceService.contentieuxReferentiel.getValue();
    for (let i = 0; i < referentiels.length; i++) {
      const childrens = (referentiels[i].childrens || []).map((c) => {
        const cont = { ...c, parent: referentiels[i] };
        return {
          totalIn: null,
          totalOut: null,
          lastStock: null,
          etpMag: null,
          etpFon: null,
          etpCont: null,
          realCoverage: null,
          realDTESInMonths: null,
          realTimePerCase: null,
          calculateCoverage: null,
          calculateDTESInMonths: null,
          calculateTimePerCase: null,
          calculateOut: null,
          etpAffected: [],
          childrens: [],
          contentieux: cont,
          nbMonth: 0,
          needToCalculate: false,
          childIsVisible: false,
        };
      });

      list.push({
        totalIn: null,
        totalOut: null,
        lastStock: null,
        etpMag: null,
        etpFon: null,
        etpCont: null,
        realCoverage: null,
        realDTESInMonths: null,
        realTimePerCase: null,
        calculateCoverage: null,
        calculateDTESInMonths: null,
        calculateTimePerCase: null,
        calculateOut: null,
        etpAffected: [],
        childrens,
        contentieux: referentiels[i],
        nbMonth: 0,
        needToCalculate: true,
        childIsVisible: false,
      });
    }
    this.simulatorDatas.next(list);
    this.syncDatas();
  }

  syncDatas() {
    if (this.simulatorDatas.getValue().length === 0) {
      this.prepareDatas();
      return;
    }

    const list: CalculatorInterface[] = this.simulatorDatas.getValue();
    const nbMonth = 12;
    for (let i = 0; i < list.length; i++) {
      const childrens: any = (list[i].childrens || []).map((c) => {
        if (
          c !== undefined &&
          this.subReferentielIds.getValue().includes(c.contentieux?.id) &&
          list[i].childIsVisible &&
          c.needToCalculate === true
        ) {
          return {
            ...c,
            nbMonth,
            needToCalculate: false,
            ...this.getActivityValues(c.contentieux, nbMonth),
          };
        }
        return;
      });

      list[i] = {
        ...list[i],
        ...this.getActivityValues(list[i].contentieux, nbMonth),
        childrens,
        nbMonth,
        needToCalculate: false,
      };
    }
    this.simulatorDatas.next(list);
  }

  cleanDatas() {
    const list: CalculatorInterface[] = this.simulatorDatas.getValue();
    for (let i = 0; i < list.length; i++) {
      const childrens = (list[i].childrens || []).map((c) => {
        return {
          ...c,
          totalIn: null,
          totalOut: null,
          lastStock: null,
          etpMag: null,
          etpFon: null,
          etpCont: null,
          realCoverage: null,
          realDTESInMonths: null,
          realTimePerCase: null,
          calculateCoverage: null,
          calculateDTESInMonths: null,
          calculateTimePerCase: null,
          calculateOut: null,
          etpAffected: [],
          childrens: [],
          nbMonth: 0,
          needToCalculate: true,
        };
      });

      list[i] = {
        ...list[i],
        totalIn: null,
        totalOut: null,
        lastStock: null,
        etpMag: null,
        etpFon: null,
        etpCont: null,
        realCoverage: null,
        realDTESInMonths: null,
        realTimePerCase: null,
        calculateCoverage: null,
        calculateDTESInMonths: null,
        calculateTimePerCase: null,
        calculateOut: null,
        etpAffected: [],
        childrens,
        nbMonth: 0,
        needToCalculate: true,
      };
    }
    this.simulatorDatas.next(list);
    this.syncDatas();
  }
}
