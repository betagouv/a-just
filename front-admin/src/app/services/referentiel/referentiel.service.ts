import { Injectable } from '@angular/core';
import { HumanResourceService } from '../human-resource/human-resource.service';
import { ServerService } from '../http-server/server.service';
import { BehaviorSubject } from 'rxjs';
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel';

/**
 * Service de centralisation des traitements lié au référentiel
 */
@Injectable({
  providedIn: 'root',
})
export class ReferentielService {
  /**
   * Ids du référentiels des indispo
   */
  idsIndispo: number[] = [];
  /**
   * Id du référentiels niveau 3 des indispo
   */
  idsMainIndispo: number = 0;
  /**
   * Ids des contentieux de type soutien et ses enfants
   */
  idsSoutien: number[] = [];
  /**
   * Ids des contentieux niveau 3
   */
  mainActivitiesId: number[] = [];
  /**
   * Liste des contentieux + soutien + indispo
   */
  contentieuxReferentiel: BehaviorSubject<ContentieuReferentielInterface[]> =
    new BehaviorSubject<ContentieuReferentielInterface[]>([]);

  /**
   * Constructor
   * @param humanResourceService
   * @param serverService
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private serverService: ServerService
  ) {}

  async getReferentiels(isJirs?: boolean) {
    return this.serverService
      .post('contentieux-referentiels/get-referentiels', { isJirs })
      .then((res) => {
        this.humanResourceService.contentieuxReferentiel.next(res.data);
        return res.data;
      });
  }

  update(id: number, node: string, value: string) {
    return this.serverService.putWithoutError(
      'contentieux-referentiels/update',
      {
        id,
        node,
        value,
      }
    );
  }

  /**
   * Récupération des informations de type référentiel et prétraitement pour gagner du temps dans les scripts
   * @param list
   */
  formatDatas(list: ContentieuReferentielInterface[]) {
    const refIndispo = list.find((r) => r.label === 'Indisponibilité');
    const idsIndispo: number[] = [];
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
    this.humanResourceService.allIndisponibilityReferentielIds =
      this.humanResourceService.allIndisponibilityReferentiel.map(function (
        obj
      ) {
        return obj.id;
      });

    this.idsIndispo = idsIndispo;

    const refSoutien = list.find((r) => r.label === 'Autres activités');
    const idsSoutien = [];
    if (refSoutien) {
      idsSoutien.push(refSoutien.id);
      (refSoutien.childrens || []).map((c) => {
        idsSoutien.push(c.id);
      });
    }
    this.idsSoutien = idsSoutien;

    this.mainActivitiesId = list.map((r) => r.id);

    this.humanResourceService.selectedReferentielIds = list
      .filter((r) => r.label !== 'Indisponibilité')
      .filter((a) => idsIndispo.indexOf(a.id) === -1)
      .map((r) => r.id);
    this.humanResourceService.contentieuxReferentiel.next(list);
    this.humanResourceService.contentieuxReferentielOnly.next(
      list.filter((r) => idsIndispo.indexOf(r.id) === -1)
    );
  }
}
