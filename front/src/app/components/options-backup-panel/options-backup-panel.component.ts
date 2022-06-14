import { Component, Input, OnDestroy, OnInit } from '@angular/core'
import { BackupInterface } from 'src/app/interfaces/backup'
import { MainClass } from 'src/app/libs/main-class'
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service'
import { dataInterface } from '../select/select.component'

@Component({
  selector: 'aj-options-backup-panel',
  templateUrl: './options-backup-panel.component.html',
  styleUrls: ['./options-backup-panel.component.scss'],
})
export class OptionsBackupPanelComponent
  extends MainClass
  implements OnInit, OnDestroy
{
  @Input() readOnly: boolean = false
  backups: BackupInterface[] = []
  optionsIsModify: boolean = false
  selectedIds: any[] = []
  formDatas: dataInterface[] = []

  constructor(private contentieuxOptionsService: ContentieuxOptionsService) {
    super()

    this.watch(
      this.contentieuxOptionsService.backups.subscribe((b) => {
        this.backups = b
        this.formatDatas()
      })
    )
    this.watch(
      this.contentieuxOptionsService.backupId.subscribe(
        (b) => (this.selectedIds = [b])
      )
    )
    this.watch(
      this.contentieuxOptionsService.optionsIsModify.subscribe(
        (b) => (this.optionsIsModify = b)
      )
    )
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.watcherDestroy()
  }

  formatDatas() {
    if(this.selectedIds && this.selectedIds.length && !this.backups.find(b => b.id === this.selectedIds[0])) {
      this.selectedIds = []
    }

    this.formDatas = this.backups.map((back) => {
      const date = new Date(back.date)

      return {
        id: back.id,
        value: `${back.label} du ${(date.getDate() + '').padStart(
          2,
          '0'
        )} ${this.getShortMonthString(date)} ${date.getFullYear()}`,
      }
    })
  }

  onChangeBackup(id: any[]) {
    console.log(id)
    if (
      this.contentieuxOptionsService.optionsIsModify.getValue() &&
      !confirm('Vous avez des modifications en cours. Supprimer ?')
    ) {
      this.selectedIds = [this.contentieuxOptionsService.backupId.getValue()]
      return
    }

    if (id.length) {
      this.contentieuxOptionsService.backupId.next(id[0])
    }
  }

  onRemoveBackup() {
    this.contentieuxOptionsService.removeBackup()
  }

  onDuplicateBackup() {
    this.contentieuxOptionsService.duplicateBackup()
  }

  onSaveHR(isCopy: boolean = false) {
    this.contentieuxOptionsService.onSaveDatas(isCopy)
  }

  trackBy(index: number, item: any) {
    return item.id
  }

  onCreateEmptyBackup() {
    this.contentieuxOptionsService.createEmpy()
  }

  onRenameBackup() {
    this.contentieuxOptionsService.renameBackup()
  }
}
