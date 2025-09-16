import { inject, Injectable } from '@angular/core'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel'
import { ServerService } from '../http-server/server.service'

/**
 * Service de centralisation des traitements lié au référentiel
 */
@Injectable({
  providedIn: 'root',
})
export class ReferentielService {
  /**
   * Service de communication avec le serveur
   */
  serverService = inject(ServerService)
  /**
   * Service de gestion des fiches agents
   */
  humanResourceService = inject(HumanResourceService)
  /**
   * Ids du référentiels des indispo
   */
  idsIndispo: number[] = []
  /**
   * Id du référentiels niveau 3 des indispo
   */
  idsMainIndispo: number = 0
  /**
   * Ids des contentieux de type soutien et ses enfants
   */
  idsSoutien: number[] = []
  /**
   * Ids des contentieux niveau 3
   */
  mainActivitiesId: number[] = []

  /**
   * Constructor
   */
  constructor() {
    this.humanResourceService.hrBackup.subscribe(async (backup) => {
      if (backup) {
        const referentiels = await this.onGetReferentiel(backup.id)
        this.formatDatas(referentiels)
      }
    })
  }

  /**
   * Récupération des informations de type référentiel et prétraitement pour gagner du temps dans les scripts
   * @param list
   */
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
    this.humanResourceService.allIndisponibilityReferentielIds = this.humanResourceService.allIndisponibilityReferentiel.map(function (obj) {
      return obj.id
    })

    this.idsIndispo = idsIndispo

    const refSoutien = list.find((r) => r.label === 'Autres activités')
    const idsSoutien: number[] = []
    if (refSoutien) {
      idsSoutien.push(refSoutien.id)
      ;(refSoutien.childrens || []).map((c) => {
        idsSoutien.push(c.id)
      })
    }
    this.idsSoutien = idsSoutien

    this.mainActivitiesId = list.map((r) => r.id)

    this.humanResourceService.selectedReferentielIds = list
      .filter((r) => r.label !== 'Indisponibilité')
      .filter((a) => idsIndispo.indexOf(a.id) === -1)
      .map((r) => r.id)

    this.humanResourceService.mainContentieuxReferentiel.set(
      list
        .filter((r) => r.label !== 'Indisponibilité')
        .filter((a) => idsIndispo.indexOf(a.id) === -1)
        .filter((a) => idsSoutien.indexOf(a.id) === -1),
    )

    this.humanResourceService.contentieuxReferentiel.next(list)
    this.humanResourceService.contentieuxReferentielOnly.next(list.filter((r) => idsIndispo.indexOf(r.id) === -1))
  }

  /**
   * Check if referentiels as "droit local"
   */
  isDroitLocal() {
    const ref = this.humanResourceService.contentieuxReferentiel.getValue()
    return ref.find((r) => r.code_import === '13.') ? true : false
  }

  /**
   * API Appel au serveur retourner une référentiel spécifique
   * @param backupId
   * @returns
   */
  async onGetReferentiel(backupId: number) {
    return this.serverService
      .post(`contentieux-referentiels/get-referentiels`, {
        backupId,
      })
      .then((data) => {
        return data.data
      })
  }
}
