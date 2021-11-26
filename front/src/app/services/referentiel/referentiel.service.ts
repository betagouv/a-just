import { Injectable } from '@angular/core';
import { orderBy } from 'lodash';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { referentielMappingIndex } from 'src/app/utils/referentiel';
import { ActivitiesService } from '../activities/activities.service';
import { ContentieuxOptionsService } from '../contentieux-options/contentieux-options.service';
import { ServerService } from '../http-server/server.service';
import { HumanResourceService } from '../human-resource/human-resource.service';

@Injectable({
  providedIn: 'root',
})
export class ReferentielService {
  idsIndispo: number[] = [];

  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService,
    private activitiesService: ActivitiesService,
    private contentieuxOptionsService: ContentieuxOptionsService
  ) {
    this.activitiesService.activities.subscribe(() =>
      this.updateReferentielValues()
    );
    this.contentieuxOptionsService.contentieuxOptions.subscribe(() =>
      this.updateReferentielOptions()
    );
  }

  initDatas() {
    this.loadReferentiels().then((result) => {
      let list: ContentieuReferentielInterface[] = [];
      result.map((main: ContentieuReferentielInterface) => {
        if (main.childrens) {
          main.childrens.map((subMain) => {
            if (subMain.childrens) {
              list = list.concat(subMain.childrens);
            }
          });
        }
      });

      // force to order list
      list = orderBy(
        list.map((r) => {
          r.rank = referentielMappingIndex(r.label);
          return r;
        }),
        ['rank']
      );

      this.humanResourceService.contentieuxReferentiel.next(list);
      this.updateReferentielValues();
      this.updateReferentielOptions();

      const ref = list.find((r) => r.label === 'Indisponibilité');
      const idsIndispo = [];
      if (ref) {
        idsIndispo.push(ref.id);
        (ref.childrens || []).map((c) => {
          idsIndispo.push(c.id);
        });
      }
      this.idsIndispo = idsIndispo;
    });
  }

  loadReferentiels() {
    return this.serverService
      .get('referentiels/get-referentiels')
      .then((r) => r.data);
  }

  updateReferentielValues() {
    const monthActivities = this.activitiesService.activityMonth.getValue();
    const activities = this.activitiesService.activities
      .getValue()
      .filter(
        (a) =>
          a.periode.getFullYear() === monthActivities.getFullYear() &&
          a.periode.getMonth() === monthActivities.getMonth()
      );
    const referentiels =
      this.humanResourceService.contentieuxReferentiel.getValue();

    // todo set in, out, stock for each
    const list = referentiels.map((ref) => {
      const getActivity = activities.find((a) => a.contentieux.id === ref.id);
      ref.in = (getActivity && getActivity.entrees) || 0;
      ref.out = (getActivity && getActivity.sorties) || 0;
      ref.stock = (getActivity && getActivity.stock) || 0;

      ref.childrens = (ref.childrens || []).map((c) => {
        const getChildrenActivity = activities.find(
          (a) => a.contentieux.id === c.id
        );
        c.in = (getChildrenActivity && getChildrenActivity.entrees) || 0;
        c.out = (getChildrenActivity && getChildrenActivity.sorties) || 0;
        c.stock = (getChildrenActivity && getChildrenActivity.stock) || 0;

        return c;
      });

      return ref;
    });

    // update
    this.humanResourceService.contentieuxReferentiel.next(list);
  }

  updateReferentielOptions() {
    const options = this.contentieuxOptionsService.contentieuxOptions.getValue();
    const referentiels =
      this.humanResourceService.contentieuxReferentiel.getValue();

    // todo set in, out, stock for each
    const list = referentiels.map((ref) => {
      const getOption = options.find((a) => a.contentieux.id === ref.id);
      ref.averageProcessingTime = (getOption && getOption.averageProcessingTime) || null;

      ref.childrens = (ref.childrens || []).map((c) => {
        const getOptionActivity = options.find(
          (a) => a.contentieux.id === c.id
        );
        c.averageProcessingTime = (getOptionActivity && getOptionActivity.averageProcessingTime) || null;

        return c;
      });

      return ref;
    });

    // update
    this.humanResourceService.contentieuxReferentiel.next(list);
  }
}
