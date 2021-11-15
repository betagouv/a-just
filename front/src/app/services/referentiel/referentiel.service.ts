import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { ServerService } from '../http-server/server.service';
import { HumanResourceService } from '../human-resource/human-resource.service';

@Injectable({
  providedIn: 'root',
})
export class ReferentielService {
  referentiels: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

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
      this.humanResourceService.contentieuxReferentiel.next(list);
    });
  }

  loadReferentiels() {
    return this.serverService
      .get('referentiels/get-referentiels')
      .then((r) => r.data);
  }
}
