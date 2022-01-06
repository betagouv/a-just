import { Component, OnDestroy, OnInit } from '@angular/core';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { sortBy, sumBy } from 'lodash';
import { MainClass } from 'src/app/libs/main-class';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';
import { fixDecimal } from 'src/app/utils/numbers';

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
  searchValue: string = '';

  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService
  ) {
    super();
  }

  ngOnInit() {
    this.watch(
      this.humanResourceService.hr.subscribe((hr) => {
        this.allHumanResources = sortBy(hr, ['fonction.rank', 'category.rank']);
        this.categoriesFilterList = sortBy(this.categoriesFilterList, ['rank']);
        this.onFilterList();
      })
    );
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((ref) => {
        this.referentiel = ref.map((r) => ({ ...r, selected: true }));
        this.selectedReferentielIds = ref.map((r) => r.id);
        this.onFilterList();
      })
    );
    this.watch(
      this.humanResourceService.categories.subscribe((ref) => {
        this.categoriesFilterList = ref;
        this.selectedCategoryIds = ref.map((c) => c.id);
        this.onFilterList();
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

      hr.workTime = this.calculWorkTime(hr);
      hr.totalAffected = Math.floor(totalAffected * 100) / 100;
    });
  }

  calculWorkTime(hr: HumanResourceInterface) {
    const activities = this.getCurrentActivity(null, hr);
    return fixDecimal(
      sumBy(
        activities.filter(
          (a) =>
            this.referentielService.idsIndispo.indexOf(a.referentielId) === -1
        ),
        'percent'
      )
    );
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
    let listActivities: any[] = [
      {
        id: ref.id,
        label: `Total de ${ref.label}`,
      },
    ];
    (ref.childrens || []).map((r) => {
      listActivities.push({
        id: r.id,
        label: r.label,
      });
    });

    const currentActivities = this.getCurrentActivity(ref, hr, true);
    listActivities = listActivities.map((activity) => {
      const percentAffected = currentActivities.find(
        (a) => a.referentielId === activity.id
      );

      activity.percent = (percentAffected && percentAffected.percent) || 0;
      return activity;
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
    ref: ContentieuReferentielInterface | null,
    human: HumanResourceInterface,
    listChildren = false
  ) {
    let ids = ref ? [ref.id] : [];
    if (ref && listChildren) {
      ids = ids.concat((ref.childrens || []).map((c) => c.id));
    }
    if (!ref) {
      ids = [...this.referentielService.mainActivitiesId];
    }

    const now = new Date();
    return (human.activities || []).filter((a: any) => {
      const dateStop = a.dateStop ? new Date(a.dateStop) : null;
      const dateStart = a.dateStart ? new Date(a.dateStart) : null;

      return ids.length
        ? ids.indexOf(a.referentielId) !== -1
        : true &&
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
                dateStop.getTime() >= now.getTime()));
    });
  }

  calculTotalTmpActivity(
    currentActivities: RHActivityInterface[],
    formActivities: RHActivityInterface[]
  ) {
    // total main activities whitout form
    const totalWhitout = sumBy(
      currentActivities.filter((ca) => {
        const ref = this.referentiel.find((r) => r.id === ca.referentielId);
        if (ref && ca.referentielId !== formActivities[0].id) {
          return true;
        } else {
          return false;
        }
      }),
      'percent'
    );

    return totalWhitout + (formActivities[0].percent || 0);
  }

  onEditActivities(action: any) {
    switch (action.id) {
      case 'modify':
        const allCurrentActivities = this.getCurrentActivity(
          null,
          this.updateActivity.hr
        );
        const totalAffected = this.calculTotalTmpActivity(
          allCurrentActivities,
          this.updateActivity.hrActivities
        );
        if (totalAffected > 100) {
          alert(
            `Attention, avec les autres affectations, vous avez atteint un total de ${totalAffected}% de ventilation ! Vous ne pouvez passer au dessus de 100%.`
          );
          return;
        }

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
    this.referentielFiltred = this.referentiel.filter((r) => r.selected);

    let list: HumanResourceInterface[] = this.allHumanResources.filter(
      (hr) =>
        hr.category && this.selectedCategoryIds.indexOf(hr.category.id) !== -1
    );

    if(this.referentielFiltred.length !== this.referentiel.length) {
      const idsOfRef = this.referentielFiltred.map(r => r.id);
      list = list.filter(h => {
        const idsOfactivities = this.getCurrentActivity(null, h).map(a => a.referentielId)
        for(let i = 0; i < idsOfactivities.length; i++) {
          if(idsOfRef.indexOf(idsOfactivities[i]) !== -1) {
            return true;
          }
        }

        return false;
      });
    }

    this.humanResources = list;
    this.calculateTotalOccupation();
  }

  onSelectedReferentielIdsChanged(list: number[]) {
    this.selectedReferentielIds = list;
    this.referentiel = this.referentiel.map((cat) => {
      cat.selected = list.indexOf(cat.id) !== -1;

      return cat;
    });

    this.onFilterList();
  }

  updateActivityPercent(ref: any, value: number) {
    const isMainRef = this.updateActivity.hrActivities[0].id === ref.id;

    if (isMainRef) {
      this.updateActivity.hrActivities[0].percent = value;
      for (let i = 1; i < this.updateActivity.hrActivities.length; i++) {
        this.updateActivity.hrActivities[i].percent = 0;
      }
    } else {
      ref.percent = value;
      const sum = sumBy(this.updateActivity.hrActivities.slice(1), 'percent');
      this.updateActivity.hrActivities[0].percent = sum;
    }
  }
}
