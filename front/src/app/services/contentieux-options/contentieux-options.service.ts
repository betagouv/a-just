import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { BackupInterface } from 'src/app/interfaces/backup'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { ContentieuxOptionsInterface } from 'src/app/interfaces/contentieux-options'
import { MainClass } from 'src/app/libs/main-class'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'

/**
 * Service des options des contentieux donc aujourd'hui le temps moyens / dossier
 */
@Injectable({
  providedIn: 'root',
})
export class ContentieuxOptionsService extends MainClass {
  /**
   * Liste des temps moyens par jeux de données
   */
  contentieuxOptions: BehaviorSubject<ContentieuxOptionsInterface[]> =
    new BehaviorSubject<ContentieuxOptionsInterface[]>([])
  /**
   * Liste des jeux de données avec des valeurs
   */
  backups: BehaviorSubject<BackupInterface[]> = new BehaviorSubject<
    BackupInterface[]
  >([])
  /**
   * Date de dernière modification d'un contentieux
   */
  contentieuxLastUpdate: BehaviorSubject<any> = new BehaviorSubject<any>({})
  /**
   * Id du jeu de donnée en cours d'utilisation
   */
  backupId: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(
    null
  )
  /**
   * Si un temps à été modifié mais non sauvegardé
   */
  optionsIsModify: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  )
  /**
   * Si c'est la première fois que l'on charge les données
   */
  initValue: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  /**
   * Constructeur
   * @param serverService
   * @param humanResourceService
   */
  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService
  ) {
    super()
  }

  /**
   * Récupération des données générales pour un utilisateur
   * @returns
   */
  initDatas() {
    this.humanResourceService.backupId.subscribe(() => {
      this.loadBackupsAndId()
    })
  }

  /**
   * Récuparation des informations générales d'une juridiction
   * @returns
   */
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

  /**
   * API récupération des temps moyens par dossier d'une juridiction
   * @param backupId
   * @returns
   */
  loadDetails(backupId: number): Promise<ContentieuxOptionsInterface[]> {
    return this.serverService
      .get(`contentieux-options/get-backup-details/${backupId}`)
      .then((r) => r.data || [])
  }

  /**
   * Récupération de l'ensemble des juridictions des informations de la juridiction sélectionnée
   * @param juridictionId
   * @returns
   */
  getAllContentieuxOptions(juridictionId: number) {
    return this.serverService
      .post('contentieux-options/get-all', {
        juridictionId,
        backupId: this.backupId.getValue(),
      })
      .then((r) => r.data)
  }

  /**
   * Formatage des données pour les temps moyens / dossier d'un référentiel
   * @param referentiel
   */
  updateOptions(referentiel: ContentieuReferentielInterface) {
    const options = this.contentieuxOptions.getValue()

    const findIndexOptions = options.findIndex(
      (a) => a.contentieux.id === referentiel.id
    )
    if (
      referentiel.averageProcessingTime ||
      referentiel.averageProcessingTimeFonc
    ) {
      if (findIndexOptions === -1) {
        // add
        options.push({
          averageProcessingTime: referentiel.averageProcessingTime || null,
          averageProcessingTimeFonc:
            referentiel.averageProcessingTimeFonc || null,
          contentieux: referentiel,
        })
      } else {
        // update
        options[findIndexOptions] = {
          ...options[findIndexOptions],
          averageProcessingTime: referentiel.averageProcessingTime || null,
          averageProcessingTimeFonc:
            referentiel.averageProcessingTimeFonc || null,
        }
      }
    } else if (findIndexOptions !== -1) {
      // remove activity
      options.splice(findIndexOptions, 1)
    }

    this.contentieuxOptions.next(options)
    this.optionsIsModify.next(true)
  }

  /**
   * API suppréssion d'une sauvegarde d'options
   * @returns
   */
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

  /**
   * Recopie d'options dans un nouveau jeux de données
   * @returns
   */
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

  /**
   * Sauvegarde d'un jeux de données dans la même ou une autre base
   * @param isCopy
   * @returns
   */
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

  /**
   * API création d'une base vide
   * @returns
   */
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

  /**
   * API rénommage d'un jeu de données
   * @returns
   */
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

  /**
   * Récupération de la dernière mise à jour des options d'une juridiction
   * @returns
   */
  getLastUpdate() {
    if (this.backupId.getValue() !== undefined)
      return this.serverService
        .post(`contentieux-options/get-last-update`, {
          backupId: this.backupId.getValue(),
          juridictionId: this.humanResourceService.backupId.getValue(),
        })
        .then((r) => {
          this.contentieuxLastUpdate.next(r.data)
        })
    else return {}
  }

  /**
   * Passage des valeurs par défaut
   * @returns
   */
  setInitValue() {
    this.initValue.next(true)
    this.optionsIsModify.next(false)
  }
}
