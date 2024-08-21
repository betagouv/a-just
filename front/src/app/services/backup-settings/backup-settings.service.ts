import { Injectable } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { BackupSettingInterface } from 'src/app/interfaces/backup-setting'

/**
 * Gestion des settings liés à un bakcup
 */
@Injectable({
  providedIn: 'root',
})
export class BackupSettingsService extends MainClass {
  /**
   * Constructeur
   * @param serverService 
   * @param humanResourceService 
   * @param contentieuxOptionsService 
   */
  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService,
  ) {
    super()
  }

  /**
   * API retourne la liste de setting d'une juridiction
   * @param types 
   * @returns 
   */
  list(types: string[]): Promise<BackupSettingInterface[]> {
    return this.serverService
      .post(`hr-backup-settings/list`, {
        backupId: this.humanResourceService.backupId.getValue(),
        types,
      })
      .then((data) => data.data || [])
  }

  /**
   * API met à jour un setting d'une juridiction
   * @param type
   * @param datas
   * @param id
   * @returns 
   */
  addOrUpdate(type: string, datas: any, id: number | undefined) {
    return this.serverService
      .post(`hr-backup-settings/list`, {
        backupId: this.humanResourceService.backupId.getValue(),
        type,
        datas,
        id,
      })
      .then((data) => data.data || null)
  }

  /**
   * API supprimer un setting d'une juridiction
   * @param id
   * @returns 
   */
  removeSetting(id: number) {
    return this.serverService
      .delete(`remove-settings/${id}`)
      .then((data) => data.data || null)
  }
}
