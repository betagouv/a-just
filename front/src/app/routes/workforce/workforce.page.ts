import { Component, OnDestroy, OnInit } from '@angular/core';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { sortBy, sumBy } from 'lodash';
import { MainClass } from 'src/app/libs/main-class';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';

@Component({
  templateUrl: './workforce.page.html',
  styleUrls: ['./workforce.page.scss'],
})
export class WorkforcePage extends MainClass implements OnInit, OnDestroy {
  allHumanResources: HumanResourceInterface[] = [];
  humanResources: HumanResourceInterface[] = [];
  referentiel: ContentieuReferentielInterface[] = [];
  referentielFiltred: ContentieuReferentielInterface[] = [];
  updateActivity: any = null;
  categoriesFilterList: HRCategoryInterface[] = [];
  selectedCategoryIds: any[] = [];
  selectedReferentielIds: any[] = [];

  constructor(private humanResourceService: HumanResourceService) {
    super();
  }

  ngOnInit() {
    this.watch(
      this.humanResourceService.hr.subscribe((hr) => {
        this.allHumanResources = sortBy(hr, ['fonction.rank', 'category.rank']);
        for(let i = 0; i < this.allHumanResources.length; i++) {
          const hr = this.allHumanResources[i];
          if(hr.category && !this.categoriesFilterList.find(c => c.id === (hr.category && hr.category.id))) {
            this.categoriesFilterList.push({...hr.category, selected: true});
            this.selectedCategoryIds.push(hr.category.id);
          }
        }

        this.categoriesFilterList = sortBy(this.categoriesFilterList, ['rank'])
        this.onFilterList();
        this.calculateTotalOccupation();
      })
    );
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((ref) => {
        this.referentiel = ref.map(r => ({...r, selected: true}));
        this.selectedReferentielIds = ref.map(r => (r.id));
        this.onFilterList();
        this.calculateTotalOccupation();
      })
    );
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  calculateTotalOccupation() {
    this.referentiel.map((ref) => {
      ref.totalAffected = 0;
    });

    this.humanResources.map((hr) => {
      let totalAffected = 0;
      this.referentiel.map((ref) => {
        const timeAffected = sumBy(this.getCurrentActivity(ref, hr), 'percent');
        if (timeAffected) {
          totalAffected += timeAffected;
          ref.totalAffected =
            (ref.totalAffected || 0) + (timeAffected * (hr.etp || 0)) / 100;
        }
      });

      hr.totalAffected = totalAffected;
    });
  }

  totalAvailable() {
    return (sumBy(this.humanResources || [], 'etp') || 0).toFixed(2);
  }

  totalRealyAffected() {
    return (sumBy(this.referentiel || [], 'totalAffected') || 0).toFixed(2);
  }

  addHR() {
    this.humanResourceService.createHumanResource();
  }

  onUpdateActivity(
    ref: ContentieuReferentielInterface,
    hr: HumanResourceInterface
  ) {
    // show popup with referentiel and formated values
    const listActivities: any[] = [
      {
        id: ref.id,
        label: ref.label,
        percent: ref.percent || 0,
      },
    ];
    const currentActivities = this.getCurrentActivity(ref, hr);

    (ref.childrens || []).map((r) => {
      const percentAffected = currentActivities.find(
        (a) => a.referentielId === r.id
      );
      listActivities.push({
        id: r.id,
        label: r.label,
        percent: (percentAffected && percentAffected.percent) || 0,
      });
    });    

    this.updateActivity = {
      referentiel: ref,
      hrActivities: listActivities,
      hr,
    };
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  onRemoveRH(id: number) {
    this.humanResourceService.removeHrById(id);
  }

  getPercentOfActivity(
    ref: ContentieuReferentielInterface,
    human: HumanResourceInterface
  ) {
    const activities = this.getCurrentActivity(ref, human);

    if (activities && activities.length) {
      return activities[0].percent;
    }

    return 0;
  }

  getCurrentActivity(
    ref: ContentieuReferentielInterface,
    human: HumanResourceInterface
  ) {
    const collectIds = (list: ContentieuReferentielInterface[]): number[] => {
      let elements: number[] = [];
      for (let i = 0; i < list.length; i++) {
        elements.push(list[i].id);
        elements = elements.concat(collectIds(list[i].childrens || []));
      }

      return elements;
    };
    const ids = collectIds([ref]);

    const now = new Date();
    return (human.activities || []).filter((a: any) => {
      const dateStop = a.dateStop ? new Date(a.dateStop) : null;
      const dateStart = a.dateStart ? new Date(a.dateStart) : null;

      return (
        ids.indexOf(a.referentielId) !== -1 &&
        ((dateStart === null && dateStop === null) ||
          (dateStart &&
            dateStart.getTime() <= now.getTime() &&
            dateStop === null) ||
          (dateStart === null &&
            dateStop &&
            dateStop.getTime() >= now.getTime()) ||
          (dateStart &&
            dateStart.getTime() <= now.getTime() &&
            dateStop &&
            dateStop.getTime() >= now.getTime()))
      );
    });
  }

  onEditActivities(action: any) {
    switch (action.id) {
      case 'modify':
        const currentActivities = this.getCurrentActivity(
          this.updateActivity.referentiel,
          this.updateActivity.hr
        );
        this.updateActivity.hrActivities.map((activity: any) => {
          const percentAffected = currentActivities.find(
            (a) => a.referentielId === activity.id
          );
          activity.percent = +activity.percent; // format

          if (activity.percent) {
            if (percentAffected) {
              percentAffected.percent = activity.percent;
            } else {
              this.updateActivity.hr.activities =
                this.updateActivity.hr.activities || [];
              this.updateActivity.hr.activities.push({
                referentielId: activity.id,
                percent: activity.percent,
                dateStart: new Date(),
                dateStop: null,
              });
            }
          } else if (percentAffected) {
            percentAffected.percent = 0;
          }
        });

        this.humanResourceService.updateHR(this.humanResources);
        this.updateActivity = null;
        break;
      default:
        this.updateActivity = null;
        break;
    }
  }

  onFilterList() {
    this.referentielFiltred = this.referentiel.filter(r => r.selected);

    const list: HumanResourceInterface[] = [];

    this.allHumanResources.map(hr => {
      const catFromList = this.categoriesFilterList.find(c => c.id === (hr.category && hr.category.id));
      if(catFromList && catFromList.selected) {
        list.push(hr);
      }
    })

    this.humanResources = list;
  }

  onSelectedCategoryIdsChanged(list: number[]) {
    this.categoriesFilterList = this.categoriesFilterList.map(cat => {
      cat.selected = list.indexOf(cat.id) !== -1;

      return cat;
    });

    this.onFilterList();
  }

  onSelectedReferentielIdsChanged(list: number[]) {
    this.referentiel = this.referentiel.map(cat => {
      cat.selected = list.indexOf(cat.id) !== -1;

      return cat;
    });

    this.onFilterList();
  }
}
