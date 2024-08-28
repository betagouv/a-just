import {
  Component,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
} from '@angular/core'
import { BackupInterface } from 'src/app/interfaces/backup'
import { MainClass } from 'src/app/libs/main-class'
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service'
import { dataInterface } from '../select/select.component'
import { Router } from '@angular/router'

/**
 * Composant de la liste des sauvegardes des options (temps moyens / dossier)
 */

@Component({
  selector: 'aj-options-backup-panel',
  templateUrl: './options-backup-panel.component.html',
  styleUrls: ['./options-backup-panel.component.scss'],
})
export class OptionsBackupPanelComponent
  extends MainClass
  implements OnDestroy, OnChanges {
  /**
   * Autoriser à changer ou non la sauvergarde actuelle
   */
  @Input() readOnly: boolean = false
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
  constructor(private contentieuxOptionsService: ContentieuxOptionsService, private router: Router) {
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
    if (
      this.selectedIds &&
      this.selectedIds.length &&
      !this.backups.find((b) => b.id === this.selectedIds[0])
    ) {
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

  /**
   * Sélection d'une nouvelle sauvegarde
   * @param id 
   * @returns 
   */
  onChangeBackup(id: any[]) {
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
    this.contentieuxOptionsService.onSaveDatas(isCopy)
    if (isCopy)
      this.router.navigate(['/temps-moyens'])
    if (this.contentieuxOptionsService.openedFromCockpit.getValue().value === true)
      setTimeout(() => { this.router.navigate(['/calculateur', { datestart: this.contentieuxOptionsService.openedFromCockpit.getValue().dateStart, datestop: this.contentieuxOptionsService.openedFromCockpit.getValue().dateStop }]) }, 100)
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
    document.getElementById('filePicker')!.click();
    document.getElementById('trigger-drop-down')!.click();
  }
}
