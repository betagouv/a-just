import { Injectable } from '@angular/core'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HumanResourceService } from '../human-resource/human-resource.service'

@Injectable({
  providedIn: 'root',
})
export class ReferentielService {
  idsIndispo: number[] = []
  idsMainIndispo: number = 0
  idsSoutien: number[] = []
  mainActivitiesId: number[] = []

  constructor(private humanResourceService: HumanResourceService) {}

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
    this.humanResourceService.allIndisponibilityReferentielIds =
      this.humanResourceService.allIndisponibilityReferentiel.map(function (
        obj
      ) {
        return obj.id
      })

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
  }
}
