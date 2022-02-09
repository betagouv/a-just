import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { maxBy, minBy, orderBy, sumBy } from 'lodash';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
import { MainClass } from 'src/app/libs/main-class';
import { HRCategoryService } from 'src/app/services/hr-category/hr-category.service';
import { HRFonctionService } from 'src/app/services/hr-fonction/hr-function.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';
import { today } from 'src/app/utils/dates';

interface HistoryInterface {
  category: string; // 1 VP
  etp: number; // 1 ou 0.8
  indisponibilities: RHActivityInterface[];
  activities: RHActivityInterface[];
  dateStart: Date;
  dateStop: Date;
}

@Component({
  templateUrl: './human-resource.page.html',
  styleUrls: ['./human-resource.page.scss'],
})
export class HumanResourcePage extends MainClass implements OnInit, OnDestroy {
  categories: HRCategoryInterface[] = [];
  fonctions: HRFonctionInterface[] = [];
  contentieuxReferentiel: ContentieuReferentielInterface[] = [];
  currentHR: HumanResourceInterface | null = null;
  categoryName: string = '';
  histories: HistoryInterface[] = [];
  lastActivities: RHActivityInterface[] = [];
  allIndisponibilities: RHActivityInterface[] = [];

  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private route: ActivatedRoute,
    private hrFonctionService: HRFonctionService,
    private hrCategoryService: HRCategoryService
  ) {
    super();
  }

  ngOnInit() {
    this.watch(
      this.route.params.subscribe((params) => {
        if (params.id) {
          this.onLoad();
        }
      })
    );
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(
        (list) => (this.contentieuxReferentiel = list)
      )
    );
    this.watch(this.humanResourceService.hr.subscribe(() => this.onLoad()));
    this.hrFonctionService.getAll().then((list) => {
      this.fonctions = list;
      this.onLoad();
    });
    this.hrCategoryService.getAll().then((list) => (this.categories = list));
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onLoad() {
    const id = +this.route.snapshot.params.id;
    const allHuman = this.humanResourceService.hr.getValue();

    const findUser = allHuman.find((h) => h.id === id);
    if (findUser) {
      this.currentHR = findUser;

      const currentSituation = this.humanResourceService.findSituation(
        this.currentHR
      );
      if (currentSituation) {
        const findCategory = this.categories.find(
          (c) => c.id === currentSituation.category.id
        );
        this.categoryName = findCategory
          ? findCategory.label.toLowerCase()
          : '';
      } else {
        this.categoryName = '';
      }
    } else {
      this.currentHR = null;
      this.categoryName = '';
    }

    this.formatHRHistory();
  }

  calculTotalTmpActivity(activities: RHActivityInterface[]) {
    activities = this.humanResourceService.filterActivitiesByDate(
      activities || [],
      new Date()
    );

    return sumBy(
      activities.filter((ca) => {
        return this.contentieuxReferentiel.find(
          (r) => r.id === ca.referentielId
        )
          ? true
          : false;
      }),
      'percent'
    );
  }

  formatHRHistory() {
    if (this.fonctions.length === 0 || !this.currentHR) {
      return;
    }

    const getToday = today();

    this.histories = [];
    const activities = (
      (this.currentHR && this.currentHR.activities) ||
      []
    ).filter((a) => a.percent);

    const max = maxBy(
      activities.filter((a) => a.dateStop),
      function (o) {
        return o.dateStop?.getTime();
      }
    );
    let maxDate =
      max && max.dateStop && max.dateStop.getTime() > getToday.getTime()
        ? today(new Date(max.dateStop))
        : new Date(today());
    if (this.currentHR && this.currentHR.dateEnd) {
      const currentDateEnd = new Date(this.currentHR.dateEnd);
      if (currentDateEnd.getTime() > maxDate.getTime()) {
        maxDate = currentDateEnd;
      }
    }

    const min = minBy(
      ([...activities, ...this.currentHR.situations] as any[]).filter((a) => a.dateStart),
      function (o) {
        const date = new Date(o.dateStart);
        return date.getTime();
      }
    );
    const minDate =
      min && min.dateStart ? today(new Date(min.dateStart)) : new Date(today());

    const currentDate = new Date(maxDate);
    let idOfActivities: number[] = [];
    while (currentDate.getTime() >= minDate.getTime()) {
      let delta: number[] = [];
      const findActivities = this.humanResourceService.filterActivitiesByDate(
        activities,
        currentDate
      );
      const findSituation = this.humanResourceService.findSituation(
        this.currentHR,
        currentDate
      );

      delta = findActivities.map((f) => f.id);
      if (findSituation) {
        delta.push(findSituation.id);
      }

      if (JSON.stringify(idOfActivities) !== JSON.stringify(delta)) {
        idOfActivities = delta;
        const indisp = findActivities.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.referentielId) !== -1
        );

        // new list
        this.histories.push({
          category: (findSituation && findSituation.fonction && findSituation.fonction.code) || '',
          etp: (findSituation && findSituation.etp) || 0,
          indisponibilities: indisp,
          activities: findActivities,
          dateStart: new Date(),
          dateStop: new Date(currentDate),
        });
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    // place date start
    this.histories = this.histories.map((h, index) => {
      const dateStop =
        index + 1 < this.histories.length
          ? new Date(this.histories[index + 1].dateStop)
          : new Date(minDate);
      h.dateStart = new Date(dateStop);
      dateStop.setDate(dateStop.getDate() + 1);

      if ((index === 0 && this.histories.length > 1 || index > 0 && index < this.histories.length - 2)) {
        h.dateStart.setDate(h.dateStart.getDate() + 1);
      }

      return h;
    });

    this.lastActivities = this.histories.length
      ? this.histories[0].activities
      : [];
    this.allIndisponibilities = activities.filter(
      (r) => this.referentielService.idsIndispo.indexOf(r.referentielId) !== -1
    );
  }

  trackByDate(index: number, item: any) {
    return item.dateStart;
  }

  onNewVentilation() {
    // on reload values
    this.onLoad();
  }
}
