import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { orderBy, sumBy } from 'lodash';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction';
import { HRSituationInterface } from 'src/app/interfaces/hr-situation';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
import { MainClass } from 'src/app/libs/main-class';
import { HRCategoryService } from 'src/app/services/hr-category/hr-category.service';
import { HRFonctionService } from 'src/app/services/hr-fonction/hr-function.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { UserService } from 'src/app/services/user/user.service';
import { today } from 'src/app/utils/dates';

export interface HistoryInterface extends HRSituationInterface {
  indisponibilities: RHActivityInterface[];
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
  allIndisponibilities: RHActivityInterface[] = [];
  editVentilation: HistoryInterface | null = null;

  constructor(
    private humanResourceService: HumanResourceService,
    private route: ActivatedRoute,
    private router: Router,
    private hrFonctionService: HRFonctionService,
    private hrCategoryService: HRCategoryService,
    private userService: UserService
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
    this.hrCategoryService.getAll().then((list) => {
      this.categories = list;
      this.onLoad();
    });
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onLoad() {
    if (this.categories.length === 0) {
      return;
    }

    const id = +this.route.snapshot.params.id;
    const allHuman = this.humanResourceService.hr.getValue();

    const findUser = allHuman.find((h) => h.id === id);
    if (findUser) {
      this.currentHR = findUser;
      console.log(findUser);

      const currentSituation = this.humanResourceService.findSituation(
        this.currentHR
      );
      if (currentSituation && currentSituation.category) {
        const findCategory = this.categories.find(
          // @ts-ignore
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

    this.histories = [];
    const getToday = today();
    this.allIndisponibilities = this.currentHR.indisponibilities || [];
    const situations = orderBy(this.currentHR.situations || [], [
      function (o: HRSituationInterface) {
        const date = new Date(o.dateStart);
        return date.getTime();
      },
    ]);

    if(!situations.length) {
      return;
    }

    const minSituation = situations[0];
    const maxSituation = situations[situations.length - 1];
    const minDate = today(minSituation.dateStart);
    let maxDate = today(maxSituation.dateStart);
    let currentDateEnd = null;
    if (this.currentHR && this.currentHR.dateEnd) {
      currentDateEnd = new Date(this.currentHR.dateEnd);
      currentDateEnd.setDate(currentDateEnd.getDate() + 1);
    }
    if (currentDateEnd && currentDateEnd.getTime() > maxDate.getTime()) {
      maxDate = new Date(currentDateEnd);
    }
    if (getToday.getTime() > maxDate.getTime()) {
      maxDate = new Date(getToday);
    }

    const currentDate = new Date(maxDate);
    let idsDetected: number[] = [];
    while (currentDate.getTime() >= minDate.getTime()) {
      let delta: number[] = [];
      const findIndispos = this.humanResourceService.findAllIndisponibilities(
        this.currentHR,
        currentDate
      );
      const findSituation = this.humanResourceService.findSituation(
        this.currentHR,
        currentDate
      );

      delta = findIndispos.map((f) => f.id);
      if (findSituation) {
        delta.push(findSituation.id);
      }

      if (JSON.stringify(idsDetected) !== JSON.stringify(delta)) {
        idsDetected = delta;
        const dateStop = new Date(currentDate);
        let etp = (findSituation && findSituation.etp) || 0;

        if (currentDateEnd && currentDateEnd.getTime() <= dateStop.getTime()) {
          etp = 0;
        }

        // new list
        this.histories.push({
          id: (findSituation && findSituation.id) || -1,
          category: (findSituation && findSituation.category) || null,
          fonction: (findSituation && findSituation.fonction) || null,
          etp,
          indisponibilities: findIndispos,
          activities: (findSituation && findSituation.activities) || [],
          dateStart: new Date(),
          dateStop,
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

      if (
        (index === 0 && this.histories.length > 1) ||
        (index > 0 && index < this.histories.length - 1)
      ) {
        h.dateStart.setDate(h.dateStart.getDate() + 1);
      }

      return h;
    });
  }

  trackByDate(index: number, item: any) {
    return item.dateStart;
  }

  onNewVentilation() {
    // on reload values
    this.onLoad();
  }

  isAdmin() {
    return this.userService.isAdmin();
  }

  async onDelete() {
    if (this.currentHR) {
      if (await this.humanResourceService.removeHrById(this.currentHR.id)) {
        this.router.navigate(['/ventilations']);
      }
    }
  }
}
