import { Component, HostBinding, Input, OnChanges, OnDestroy, inject } from '@angular/core'
import { dataInterface } from '../select/select.component'
import { Router } from '@angular/router'
import { MainClass } from '../../libs/main-class'
import { CommonModule } from '@angular/common'
import { BackupInterface } from '../../interfaces/backup'
import { ContentieuxOptionsService } from '../../services/contentieux-options/contentieux-options.service'
import { UserService } from '../../services/user/user.service'

/**
 * Composant de la liste des sauvegardes des options (temps moyens / dossier)
 */

@Component({
  selector: 'aj-options-backup-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './options-backup-panel.component.html',
  styleUrls: ['./options-backup-panel.component.scss'],
})
export class OptionsBackupPanelComponent extends MainClass implements OnDestroy, OnChanges {
  contentieuxOptionsService = inject(ContentieuxOptionsService)
  router = inject(Router)
  userService = inject(UserService)
  /**
   * Autoriser à changer ou non la sauvergarde actuelle
   */
  @Input() readOnly: boolean = false
  /**
   * Autoriser à changer ou non la sauvergarde actuelle
   */
  @Input() category: string = ''
  /**
   * Ecoute de la variable de largeur du composant
   */
  @HostBinding('style.width') withLine!: string
  /**
   * Liste des sauvegardes
   */
  backups: BackupInterface[] = []
  /**
   * Mémorisation s'il y a eu une modificiation avant sauvegarde
   */
  optionsIsModify: boolean = false
  /**
   * Id de sauvegarde sélectionnée
   */
  selectedIds: any[] = []
  /**
   * Formateur de la liste des backups
   */
  formDatas: dataInterface[] = []

  /**
   * Constructeur qui écoute tous les changements
   * @param contentieuxOptionsService
   */
  constructor() {
    super()

    this.watch(
      this.contentieuxOptionsService.backups.subscribe((b) => {
        this.backups = b
        this.formatDatas()
      }),
    )
    this.watch(this.contentieuxOptionsService.backupId.subscribe((b) => (this.selectedIds = [b])))
    this.watch(this.contentieuxOptionsService.optionsIsModify.subscribe((b) => (this.optionsIsModify = b)))
  }

  /**
   * A la destruction supprimer les watcher
   */
  ngOnDestroy() {
    this.contentieuxOptionsService.optionsIsModify.next(false)
    this.watcherDestroy()
  }

  /**
   * Écoute du changement la variable readOnly
   */
  ngOnChanges() {
    this.withLine = this.readOnly ? 'fit-content' : '100%'
  }

  /**
   * Formatage de la liste des sauvegardes en liste utilisable
   */
  formatDatas() {
    if (this.selectedIds && this.selectedIds.length && !this.backups.find((b) => b.id === this.selectedIds[0])) {
      this.selectedIds = []
    }

    this.formDatas = this.backups.map((back) => {
      const date = new Date(back.date)

      return {
        id: back.id,
        value: `${back.label} du ${(date.getDate() + '').padStart(2, '0')} ${this.getShortMonthString(date)} ${date.getFullYear()}`,
      }
    })
  }

  /**
   * Sélection d'une nouvelle sauvegarde
   * @param id
   * @returns
   */
  onChangeBackup(id: any[]) {
    if (this.contentieuxOptionsService.optionsIsModify.getValue() && !confirm('Vous avez des modifications en cours. Supprimer ?')) {
      this.selectedIds = [this.contentieuxOptionsService.backupId.getValue()]
      return
    }

    if (id.length) {
      this.contentieuxOptionsService.backupId.next(id[0])
    }
  }

  /**
   * Demande de suppresion d'une sauvegarde
   */
  onRemoveBackup() {
    this.contentieuxOptionsService.removeBackup()
  }

  /**
   * Demande de duplicate une sauvegarde
   */
  onDuplicateBackup() {
    this.contentieuxOptionsService.duplicateBackup()
  }

  /**
   * Demande de sauvegarde des nouvelles données saisies
   * @param isCopy
   */
  onSaveHR(isCopy: boolean = false) {
    this.contentieuxOptionsService.onSaveDatas(isCopy, this.category).then((x) => {
      if (isCopy && x !== null) {
        this.contentieuxOptionsService.optionsIsModify.next(false)
      }
      if (isCopy === false && x !== null && this.contentieuxOptionsService.openedFromCockpit.getValue().value !== true) this.router.navigate(['/temps-moyens'])
    })
    if (this.contentieuxOptionsService.openedFromCockpit.getValue().value === true) this.contentieuxOptionsService.onFollowComparaison.next(true)
  }

  async onSendAllActivity(elem: any) {
    //await this.contentieuxOptionsService.onSendAllActivity(elem)
  }
  /**
   * Demande de création d'une sauvegarde vide
   */
  onCreateEmptyBackup() {
    this.contentieuxOptionsService.createEmpy()
  }

  /**
   * Demande de renommage de la sauvegarde actuelle
   */
  onRenameBackup() {
    this.contentieuxOptionsService.renameBackup()
  }

  /**
   * Demande de réinitilisation des données de bases
   */
  onBackBackup() {
    this.contentieuxOptionsService.setInitValue()
  }

  /**
   * Télécharger le referentiel au format excel
   */
  downloadTemplate() {
    this.contentieuxOptionsService.downloadTemplate()
  }

  /**
   * Ouvre le selecteur de fichier
   */
  openFilePicker() {
    document.getElementById('filePicker')!.click()
    document.getElementById('trigger-drop-down')!.click()
  }
}
