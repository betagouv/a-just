import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { ContentieuxOptionsInterface } from 'src/app/interfaces/contentieux-options';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class ContentieuxOptionsService {
  contentieuxOptions: BehaviorSubject<ContentieuxOptionsInterface[]> =
    new BehaviorSubject<ContentieuxOptionsInterface[]>([]);

  constructor(private serverService: ServerService) {}

  initDatas() {
    this.getAllContentieuxOptions().then((result) => {
      this.contentieuxOptions.next(result.list);
    });
  }

  getAllContentieuxOptions() {
    return this.serverService
      .get('contentieux-options/get-all')
      .then((r) => r.data);
  }

  updateOptions(referentiel: ContentieuReferentielInterface) {
    console.log(referentiel);
    const options = this.contentieuxOptions.getValue();
    const findIndexOptions = options.findIndex(
      (a) => a.contentieux.id === referentiel.id
    );

    if (referentiel.averageProcessingTime) {
      if (findIndexOptions === -1) {
        // add
        options.push({
          averageProcessingTime: referentiel.averageProcessingTime || null,
          contentieux: referentiel,
        });
      } else {
        // update
        options[findIndexOptions] = {
          ...options[findIndexOptions],
          averageProcessingTime: referentiel.averageProcessingTime || null,
        };
      }
    } else if (findIndexOptions !== -1) {
      // remove activity
      options.splice(findIndexOptions, 1);
    }

    this.contentieuxOptions.next(options);
  }
}
