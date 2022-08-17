import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { BackupInterface } from 'src/app/interfaces/backup'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { ContentieuxOptionsInterface } from 'src/app/interfaces/contentieux-options'
import { MainClass } from 'src/app/libs/main-class'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'

@Injectable({
  providedIn: 'root',
})
export class ContentieuxOptionsService extends MainClass {
  contentieuxOptions: BehaviorSubject<ContentieuxOptionsInterface[]> =
    new BehaviorSubject<ContentieuxOptionsInterface[]>([])
  backups: BehaviorSubject<BackupInterface[]> = new BehaviorSubject<
    BackupInterface[]
  >([])
  backupId: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(
    null
  )
  optionsIsModify: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  )

  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService
  ) {
    super()
  }

  initDatas() {
    this.humanResourceService.backupId.subscribe(() => {
      this.loadBackupsAndId()
    })
  }

  loadBackupsAndId() {
    const juridictionId = this.humanResourceService.backupId.getValue()
    if (juridictionId !== null) {
      this.optionsIsModify.next(false)
      this.getAllContentieuxOptions(juridictionId).then((result) => {
        this.backups.next(result.backups)
        this.backupId.next(result.backupId)
      })
    }
  }

  loadDetails(backupId: number): Promise<ContentieuxOptionsInterface[]> {
    return this.serverService
      .get(`contentieux-options/get-backup-details/${backupId}`)
      .then((r) => r.data || [])
  }

  getAllContentieuxOptions(juridictionId: number) {
    return this.serverService
      .post('contentieux-options/get-all', {
        juridictionId,
        backupId: this.backupId.getValue(),
      })
      .then((r) => r.data)
  }

  updateOptions(referentiel: ContentieuReferentielInterface) {
    const options = this.contentieuxOptions.getValue()
    const findIndexOptions = options.findIndex(
      (a) => a.contentieux.id === referentiel.id
    )

    if (referentiel.averageProcessingTime) {
      if (findIndexOptions === -1) {
        // add
        options.push({
          averageProcessingTime: referentiel.averageProcessingTime || null,
          contentieux: referentiel,
        })
      } else {
        // update
        options[findIndexOptions] = {
          ...options[findIndexOptions],
          averageProcessingTime: referentiel.averageProcessingTime || null,
        }
      }
    } else if (findIndexOptions !== -1) {
      // remove activity
      options.splice(findIndexOptions, 1)
    }

    this.contentieuxOptions.next(options)
    this.optionsIsModify.next(true)
  }

  removeBackup() {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde?')) {
      return this.serverService
        .delete(`contentieux-options/remove-backup/${this.backupId.getValue()}`)
        .then(() => {
          this.backupId.next(null)
          this.loadBackupsAndId()
        })
    }

    return Promise.resolve()
  }

  duplicateBackup() {
    const backup = this.backups
      .getValue()
      .find((b) => b.id === this.backupId.getValue())

    const backupName = prompt('Sous quel nom ?', `${backup?.label} - copie`)
    if (backupName) {
      return this.serverService
        .post(`contentieux-options/duplicate-backup`, {
          backupId: this.backupId.getValue(),
          backupName,
          juridictionId: this.humanResourceService.backupId.getValue(),
        })
        .then((r) => {
          this.backupId.next(r.data)
          this.loadBackupsAndId()
        })
    }

    return Promise.resolve()
  }

  onSaveDatas(isCopy: boolean) {
    let backupName = null
    if (isCopy) {
      backupName = prompt('Sous quel nom ?')
    }

    return this.serverService
      .post(`contentieux-options/save-backup`, {
        list: this.contentieuxOptions.getValue(),
        backupId: this.backupId.getValue(),
        backupName: backupName ? backupName : null,
        juridictionId: this.humanResourceService.backupId.getValue(),
      })
      .then((r) => {
        this.backupId.next(r.data)
        this.loadBackupsAndId()
      })
  }

  createEmpy() {
    let backupName = prompt('Sous quel nom ?')

    if (backupName) {
      return this.serverService
        .post(`contentieux-options/save-backup`, {
          list: [],
          backupName: backupName,
          juridictionId: this.humanResourceService.backupId.getValue(),
        })
        .then((r) => {
          this.backupId.next(r.data)
          this.loadBackupsAndId()
        })
    }

    return Promise.resolve()
  }

  renameBackup() {
    const getBackup = this.backups
      .getValue()
      .find((b) => b.id === this.backupId.getValue())
    let backupName = prompt('Sous quel nom ?', getBackup ? getBackup.label : '')

    if (backupName) {
      return this.serverService
        .post(`contentieux-options/rename-backup`, {
          backupId: this.backupId.getValue(),
          backupName: backupName,
          juridictionId: this.humanResourceService.backupId.getValue(),
        })
        .then(() => {
          const list = this.backups.getValue()
          const index = list.findIndex((b) => b.id === this.backupId.getValue())
          if (index !== -1) {
            list[index].label = '' + backupName
            this.backups.next(list)
          }
        })
    }

    return Promise.resolve()
  }
}
