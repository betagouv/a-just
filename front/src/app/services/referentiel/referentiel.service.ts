import { Injectable } from '@angular/core'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { ActivitiesService } from '../activities/activities.service'
import { ContentieuxOptionsService } from '../contentieux-options/contentieux-options.service'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'

@Injectable({
  providedIn: 'root',
})
export class ReferentielService {
  idsIndispo: number[] = []
  idsMainIndispo: number = 0
  idsSoutien: number[] = []
  mainActivitiesId: number[] = []

  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService,
    private contentieuxOptionsService: ContentieuxOptionsService
  ) {
    /*this.contentieuxOptionsService.contentieuxOptions.subscribe(() =>
      // TODO this.updateReferentielOptions()
    );*/
  }

  formatDatas(list: ContentieuReferentielInterface[]) {
    const refIndispo = list.find((r) => r.label === 'Indisponibilité')
    const idsIndispo: number[] = []
    this.humanResourceService.allIndisponibilityReferentiel = []
    if (refIndispo) {
      this.idsMainIndispo = refIndispo.id
      this.humanResourceService.allIndisponibilityReferentiel.push(refIndispo)
      idsIndispo.push(refIndispo.id)
      ;(refIndispo.childrens || []).map((c) => {
        idsIndispo.push(c.id)
        this.humanResourceService.allIndisponibilityReferentiel.push(c)
      })
    }
    this.idsIndispo = idsIndispo
    this.humanResourceService.copyOfIdsIndispo = idsIndispo

    const refSoutien = list.find((r) => r.label === 'Soutien')
    const idsSoutien = []
    if (refSoutien) {
      idsSoutien.push(refSoutien.id)
      ;(refSoutien.childrens || []).map((c) => {
        idsSoutien.push(c.id)
      })
    }
    this.idsSoutien = idsSoutien

    this.mainActivitiesId = list.map((r) => r.id)

    // feach all id of contentieux
    let listAll: ContentieuReferentielInterface[] = []
    list.map((cont) => {
      listAll.push(cont)
      listAll = list.concat(cont.childrens || [])
    })
    this.humanResourceService.selectedReferentielIds = listAll
      .filter((a) => idsIndispo.indexOf(a.id) === -1)
      .map((r) => r.id)

    this.humanResourceService.contentieuxReferentiel.next(list)
    /*this.updateReferentielValues();
      this.updateReferentielOptions();*/
  }

  updateReferentielOptions() {
    const options = this.contentieuxOptionsService.contentieuxOptions.getValue()
    const referentiels =
      this.humanResourceService.contentieuxReferentiel.getValue()

    // todo set in, out, stock for each
    const list = referentiels.map((ref) => {
      const getOption = options.find((a) => a.contentieux.id === ref.id)
      ref.averageProcessingTime =
        (getOption && getOption.averageProcessingTime) || null

      ref.childrens = (ref.childrens || []).map((c) => {
        const getOptionActivity = options.find((a) => a.contentieux.id === c.id)
        c.averageProcessingTime =
          (getOptionActivity && getOptionActivity.averageProcessingTime) || null

        return c
      })

      return ref
    })

    // update
    this.humanResourceService.contentieuxReferentiel.next(list)
  }
}
