import { Injectable } from '@angular/core';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { ActivitiesService } from '../activities/activities.service';
import { ContentieuxOptionsService } from '../contentieux-options/contentieux-options.service';
import { ServerService } from '../http-server/server.service';
import { HumanResourceService } from '../human-resource/human-resource.service';

@Injectable({
  providedIn: 'root',
})
export class ReferentielService {
  idsIndispo: number[] = [];
  idsMainIndispo: number = 0;
  idsSoutien: number[] = [];
  mainActivitiesId: number[] = [];

  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService,
    private activitiesService: ActivitiesService,
    private contentieuxOptionsService: ContentieuxOptionsService
  ) {
    this.activitiesService.activities.subscribe(() =>
      this.updateReferentielValues()
    );
    this.activitiesService.activityMonth.subscribe(() =>
      this.updateReferentielValues()
    );
    this.contentieuxOptionsService.contentieuxOptions.subscribe(() =>
      this.updateReferentielOptions()
    );
  }

  initDatas() {
    this.loadReferentiels().then((list: ContentieuReferentielInterface[]) => {
      const refIndispo = list.find((r) => r.label === 'Indisponibilité');
      const idsIndispo = [];
      this.humanResourceService.allIndisponibilityReferentiel = [];
      if (refIndispo) {
        this.idsMainIndispo = refIndispo.id;
        this.humanResourceService.allIndisponibilityReferentiel.push(refIndispo);
        idsIndispo.push(refIndispo.id);
        (refIndispo.childrens || []).map((c) => {
          idsIndispo.push(c.id);
          this.humanResourceService.allIndisponibilityReferentiel.push(c);
        });
      }
      this.idsIndispo = idsIndispo;
      this.humanResourceService.copyOfIdsIndispo = idsIndispo;

      const refSoutien = list.find((r) => r.label === 'Soutien');
      const idsSoutien = [];
      if (refSoutien) {
        idsSoutien.push(refSoutien.id);
        (refSoutien.childrens || []).map((c) => {
          idsSoutien.push(c.id);
        });
      }
      this.idsSoutien = idsSoutien;

      this.mainActivitiesId = list.map((r) => (r.id));

      this.humanResourceService.contentieuxReferentiel.next(list);
      this.updateReferentielValues();
      this.updateReferentielOptions();
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
      ref.in = (getActivity && getActivity.entrees) || null;
      ref.out = (getActivity && getActivity.sorties) || null;
      ref.stock = (getActivity && getActivity.stock) || null;

      ref.childrens = (ref.childrens || []).map((c) => {
        const getChildrenActivity = activities.find(
          (a) => a.contentieux.id === c.id
        );
        c.in = (getChildrenActivity && getChildrenActivity.entrees) || null;
        c.out = (getChildrenActivity && getChildrenActivity.sorties) || null;
        c.stock = (getChildrenActivity && getChildrenActivity.stock) || null;

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
