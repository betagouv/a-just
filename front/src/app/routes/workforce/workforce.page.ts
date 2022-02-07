import { Component, OnDestroy, OnInit } from '@angular/core';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { groupBy, orderBy, sortBy, sumBy } from 'lodash';
import { MainClass } from 'src/app/libs/main-class';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';
import { fixDecimal } from 'src/app/utils/numbers';
import { BackupInterface } from 'src/app/interfaces/backup';
import { dataInterface } from 'src/app/components/select/select.component';
import { copyArray } from 'src/app/utils/array';
import { etpLabel } from 'src/app/utils/referentiel';

interface HumanResourceSelectedInterface extends HumanResourceInterface {
  opacity: number;
  tmpActivities?: any;
  etpLabel: string;
  hasIndisponibility: number;
  currentActivities: RHActivityInterface[];
}

interface HRCategorySelectedInterface extends HRCategoryInterface {
  selected: boolean;
  etpt: number;
  nbPersonal: number;
  labelPlural: string;
}

interface listFormatedInterface {
  textColor: string;
  bgColor: string;
  label: string;
  hr: HumanResourceSelectedInterface[];
  referentiel: ContentieuReferentielInterface[];
}

@Component({
  templateUrl: './workforce.page.html',
  styleUrls: ['./workforce.page.scss'],
})
export class WorkforcePage extends MainClass implements OnInit, OnDestroy {
  allHumanResources: HumanResourceInterface[] = [];
  preformatedAllHumanResource: HumanResourceSelectedInterface[] = [];
  humanResources: HumanResourceSelectedInterface[] = [];
  referentiel: ContentieuReferentielInterface[] = [];
  referentielFiltred: ContentieuReferentielInterface[] = [];
  formReferentiel: dataInterface[] = [];
  categoriesFilterList: HRCategorySelectedInterface[] = [];
  selectedReferentielIds: any[] = [];
  searchValue: string = '';
  valuesFinded: HumanResourceInterface[] | null = null;
  indexValuesFinded: number = 0;
  timeoutUpdateSearch: any = null;
  hrBackup: BackupInterface | undefined;
  dateSelected: Date = new Date();
  listFormated: listFormatedInterface[] = [];
  filterSelected: ContentieuReferentielInterface | null = null;

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
        this.preformatHumanResources();
      })
    );
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((ref) => {
        this.referentiel = ref.map((r) => ({ ...r, selected: true }));
        this.formReferentiel = this.referentiel
          .filter(
            (a) => this.referentielService.idsIndispo.indexOf(a.id) === -1
          )
          .map((r) => ({
            id: r.id,
            value: this.referentielMappingName(r.label),
          }));
        this.selectedReferentielIds = this.formReferentiel.map((r) => r.id);
        this.onFilterList();
      })
    );
    this.watch(
      this.humanResourceService.categories.subscribe((ref) => {
        this.categoriesFilterList = ref.map((c) => ({
          ...c,
          selected: true,
          label:
            c.label && c.label === 'Magistrat' ? 'Magistrat du siège' : c.label,
          labelPlural:
            c.label && c.label === 'Magistrat'
              ? 'Magistrats du siège'
              : `${c.label}s`,
          etpt: 0,
          nbPersonal: 0,
        }));
        this.onFilterList();
      })
    );
    this.watch(
      this.humanResourceService.backupId.subscribe((backupId) => {
        const hrBackups = this.humanResourceService.backups.getValue();
        this.hrBackup = hrBackups.find((b) => b.id === backupId);
      })
    );
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  preformatHumanResources() {
    this.preformatedAllHumanResource = this.allHumanResources.map((h) => {
      const currentActivities =
        this.humanResourceService.filterActivitiesByDate(
          h.activities || [],
          this.dateSelected
        );
      const hasIndisponibility = fixDecimal(
        sumBy(
          currentActivities.filter(
            (a) =>
              this.referentielService.idsIndispo.indexOf(a.referentielId) !== -1
          ),
          'percent'
        ) / 100
      );

      return {
        ...h,
        currentActivities,
        opacity: 1,
        etpLabel: etpLabel(h.etp || 0),
        hasIndisponibility,
      };
    });

    this.updateCategoryValues();
    this.onFilterList();
  }

  updateCategoryValues() {
    const idsOfRef = this.referentielFiltred.map((r) => r.id);

    this.categoriesFilterList = this.categoriesFilterList.map((c) => {
      const personal = this.humanResources.filter(
        (h) => h.category && h.category.id === c.id
      );
      let etpt = 0;

      personal.map((h) => {
        const activities = this.getCurrentActivity(null, h).filter(
          (a) => idsOfRef.indexOf(a.referentielId) !== -1
        );
        if (activities.length) {
          etpt +=
            (((h.etp || 0) - h.hasIndisponibility) *
              sumBy(activities, 'percent')) /
            100;
        }
      });

      return {
        ...c,
        etpt,
        nbPersonal: personal.length,
      };
    });
  }

  addHR() {
    this.humanResourceService.createHumanResource();
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  getCurrentActivity(
    ref: ContentieuReferentielInterface | null,
    human: HumanResourceSelectedInterface | HumanResourceInterface,
    listChildren = false
  ) {
    let ids = ref ? [ref.id] : [];
    if (ref && listChildren) {
      ids = ids.concat((ref.childrens || []).map((c) => c.id));
    }
    if (!ref) {
      ids = [...this.referentielService.mainActivitiesId];
    }

    const now = new Date(this.dateSelected);
    return (human.activities || []).filter((a: any) => {
      const dateStop = a.dateStop ? new Date(a.dateStop) : null;
      const dateStart = a.dateStart ? new Date(a.dateStart) : null;

      return (
        (ids.length ? ids.indexOf(a.referentielId) !== -1 : true) &&
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

  checkHROpacity(hr: HumanResourceInterface) {
    if (
      !this.searchValue ||
      (hr.firstName || '')
        .toLowerCase()
        .includes(this.searchValue.toLowerCase()) ||
      (hr.lastName || '').toLowerCase().includes(this.searchValue.toLowerCase())
    ) {
      return 1;
    }

    return 0.5;
  }

  onFilterList() {
    if (
      !this.categoriesFilterList.length ||
      !this.referentiel.length ||
      !this.categoriesFilterList.length
    ) {
      return;
    }

    this.referentielFiltred = this.referentiel.filter((r) => r.selected);

    const selectedCategoryIds = this.categoriesFilterList
      .filter((c) => c.selected)
      .map((c) => c.id);
    let list: HumanResourceSelectedInterface[] =
      this.preformatedAllHumanResource
        .filter(
          (hr) =>
            hr.category && selectedCategoryIds.indexOf(hr.category.id) !== -1
        )
        .map((h) => ({
          ...h,
          opacity: this.checkHROpacity(h),
        }));
    const valuesFinded = list.filter((h) => h.opacity === 1);
    this.valuesFinded =
      valuesFinded.length === list.length ? null : valuesFinded;
    this.indexValuesFinded = 0;

    if (this.referentielFiltred.length !== this.referentiel.length) {
      const idsOfRef = this.referentielFiltred.map((r) => r.id);
      list = list.filter((h) => {
        const idsOfactivities = this.getCurrentActivity(null, h).map(
          (a) => a.referentielId
        );
        for (let i = 0; i < idsOfactivities.length; i++) {
          if (idsOfRef.indexOf(idsOfactivities[i]) !== -1) {
            return true;
          }
        }

        return false;
      });
    }

    this.humanResources = list;

    this.formatListToShow();
    this.updateCategoryValues();

    if (this.valuesFinded && this.valuesFinded.length) {
      this.onGoTo(this.valuesFinded[this.indexValuesFinded]);
    } else if (list.length) {
      this.onGoTo(null);
    }
  }

  formatListToShow() {
    const groupByCategory = groupBy(this.humanResources, 'category.id');

    this.listFormated = Object.values(groupByCategory).map(
      (group: HumanResourceSelectedInterface[]) => {
        const label = group[0].category.label;
        let referentiel = (
          copyArray(this.referentiel) as ContentieuReferentielInterface[]
        )
          .filter(
            (r) => this.referentielService.idsIndispo.indexOf(r.id) === -1
          )
          .map((ref) => {
            ref.totalAffected = 0;
            return ref;
          });

        group = group.map((hr) => {
          hr.tmpActivities = {};

          referentiel = referentiel.map((ref) => {
            hr.tmpActivities[ref.id] = this.getCurrentActivity(ref, hr);
            const timeAffected = sumBy(hr.tmpActivities[ref.id], 'percent');
            if (timeAffected) {
              ref.totalAffected =
                (ref.totalAffected || 0) +
                (timeAffected / 100) * ((hr.etp || 0) - hr.hasIndisponibility);
            }

            return ref;
          });

          return hr;
        });

        if (this.filterSelected) {
          group = orderBy(
            group,
            (h) => {
              const acti = (h.activities || []).find(
                (a) => a.referentielId === this.filterSelected?.id
              );
              return acti ? acti.percent || 0 : 0;
            },
            ['desc']
          );
        }

        return {
          textColor: this.getCategoryColor(label),
          bgColor: this.getCategoryColor(label, 0.2),
          referentiel,
          label:
            group.length <= 1
              ? label && label === 'Magistrat'
                ? 'Magistrat du siège'
                : label
              : label && label === 'Magistrat'
              ? 'Magistrats du siège'
              : `${label}s`,
          hr: group,
        };
      }
    );
  }

  onGoTo(hr: HumanResourceInterface | null) {
    const findContainer = document.getElementById('container-list');
    if (findContainer) {
      if (hr) {
        const findElement = findContainer.querySelector(`#human-${hr.id}`);
        if (findElement) {
          const headers = findContainer.querySelectorAll('.header-list');
          const { top } = findElement.getBoundingClientRect();
          let topDelta = findContainer.getBoundingClientRect().top + 8;
          for (let i = 0; i < headers.length; i++) {
            const topHeader = headers[i].getBoundingClientRect().top;
            if (topHeader < top) {
              topDelta += headers[i].getBoundingClientRect().height;
            }
          }
          findContainer.scrollTo({
            behavior: 'smooth',
            top: top - topDelta,
          });
        }
      } else {
        findContainer.scrollTo({
          behavior: 'smooth',
          top: 0,
        });
      }
    } else {
      setTimeout(() => this.onGoTo(hr), 200);
    }
  }

  onFindNext(delta: number = 1) {
    if (this.valuesFinded) {
      this.indexValuesFinded = this.indexValuesFinded + delta;
      if (this.indexValuesFinded > this.valuesFinded.length - 1) {
        this.indexValuesFinded = 0;
      } else if (this.indexValuesFinded < 0) {
        this.indexValuesFinded = this.valuesFinded.length - 1;
      }

      this.onGoTo(this.valuesFinded[this.indexValuesFinded]);
    }
  }

  onSelectedReferentielIdsChanged(list: any) {
    this.selectedReferentielIds = list;
    this.referentiel = this.referentiel.map((cat) => {
      cat.selected = list.indexOf(cat.id) !== -1;

      return cat;
    });

    this.onFilterList();
  }

  updateSearch() {
    if (this.timeoutUpdateSearch) {
      clearTimeout(this.timeoutUpdateSearch);
      this.timeoutUpdateSearch = null;
    }

    this.timeoutUpdateSearch = setTimeout(() => {
      this.onFilterList();
    }, 500);
  }

  onDateChanged(date: any) {
    this.dateSelected = date;
    this.onFilterList();
  }

  onFilterBy(ref: ContentieuReferentielInterface) {
    if (!this.filterSelected || this.filterSelected.id !== ref.id) {
      this.filterSelected = ref;
    } else {
      this.filterSelected = null;
    }

    this.onFilterList();
  }
}
