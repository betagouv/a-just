import { Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { MainClass } from '../../libs/main-class'
import { BackupSettingInterface } from '../../interfaces/backup-setting'

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
  addOrUpdate(label: string, type: string, datas: any, id?: number) {
    return this.serverService
      .post(`hr-backup-settings/add-or-update`, {
        backupId: this.humanResourceService.backupId.getValue(),
        label,
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
    return this.serverService.delete(`hr-backup-settings/remove-setting/${id}`).then((data) => data.data || null)
  }
}
