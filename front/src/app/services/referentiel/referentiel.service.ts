import { Injectable } from '@angular/core';
import { orderBy } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { referentielMappingIndex } from 'src/app/utils/referentiel';
import { ServerService } from '../http-server/server.service';
import { HumanResourceService } from '../human-resource/human-resource.service';

@Injectable({
  providedIn: 'root',
})
export class ReferentielService {
  referentiels: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  idsIndispo: number[] = [];

  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService
  ) {}

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
}
