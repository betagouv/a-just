import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { ServerService } from '../http-server/server.service'
import { HumanResourceService } from '../human-resource/human-resource.service'
import readXlsxFile from 'read-excel-file'
import { groupBy } from 'lodash'
import { Renderer } from 'xlsx-renderer'
import * as FileSaver from 'file-saver'
import { MainClass } from '../../libs/main-class'
import { ContentieuxOptionsInterface } from '../../interfaces/contentieux-options'
import { dataInterface } from '../../components/select/select.component'
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel'
import { decimalToStringDate } from '../../utils/dates'
import { BackupInterface } from '../../interfaces/backup'

/**
 * Excel file extension
 */
const EXCEL_EXTENSION = '.xlsx'

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
  contentieuxOptions: BehaviorSubject<ContentieuxOptionsInterface[]> = new BehaviorSubject<ContentieuxOptionsInterface[]>([])
  /**
   * Liste des jeux de données avec des valeurs
   */
  backups: BehaviorSubject<BackupInterface[]> = new BehaviorSubject<BackupInterface[]>([])
  /**
   * Nombre de référentiel chargé
   */
  nbOfBackups: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(null)
  /**
   * Date de dernière modification d'un contentieux
   */
  contentieuxLastUpdate: BehaviorSubject<any> = new BehaviorSubject<any>({})
  /**
   * Id du jeu de donnée en cours d'utilisation
   */
  backupId: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(null)
  /**
   * Si un temps à été modifié mais non sauvegardé
   */
  optionsIsModify: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  /**
   * Si c'est la première fois que l'on charge les données
   */
  initValue: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  /**
   * Si la creation est faite depuos le cockpit
   */
  openedFromCockpit: BehaviorSubject<any> = new BehaviorSubject<any>({
    value: false,
    dateStart: null,
    dateStop: null,
    category: null,
  })
  /**
   * Ouverture de la popup pour retourner au calculateur
   */
  onFollowComparaison: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  /**
   * Liste des sauvegardes formatés pour le menu roulant
   */
  formDatas: BehaviorSubject<dataInterface[]> = new BehaviorSubject<dataInterface[]>([])
  /**
   * Label du referentiel selectionné
   */
  refNameSelected: string | null = null
  /**
   * Référentiel complet
   */
  referentiel: BehaviorSubject<ContentieuReferentielInterface[]> = new BehaviorSubject<ContentieuReferentielInterface[]>([])

  /**
   * Constructeur
   * @param serverService
   * @param humanResourceService
   */
  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService,
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
        this.nbOfBackups.next(result.backups.length)
        this.backups.next(result.backups)
        //this.backupId.next(result.backupId)
      })
    }
  }

  /**
   * API récupération des temps moyens par dossier d'une juridiction
   * @param backupId
   * @returns
   */
  loadDetails(backupId: number): Promise<ContentieuxOptionsInterface[]> {
    return this.serverService.get(`contentieux-options/get-backup-details/${backupId}`).then((r) => r.data || [])
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

    const findIndexOptions = options.findIndex((a) => a.contentieux.id === referentiel.id)
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

  /**
   * API suppréssion d'une sauvegarde d'options
   * @returns
   */
  removeBackup() {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde?')) {
      return this.serverService.delete(`contentieux-options/remove-backup/${this.backupId.getValue()}`).then(() => {
        this.backupId.next(null)
        this.loadBackupsAndId()
      })
    }

    return Promise.resolve()
  }

  /**
   * API suppréssion d'une sauvegarde d'options
   * @returns
   */
  async removeBackupByIds(ids: (number | undefined)[]) {
    ids?.map((id) => {
      return this.serverService.delete(`contentieux-options/remove-backup/${id}`).then(() => {
        this.backupId.next(null)
        this.loadBackupsAndId()
      })
    })
    return Promise.resolve()
  }

  /**
   * Recopie d'options dans un nouveau jeux de données
   * @returns
   */
  duplicateBackup() {
    const backup = this.backups.getValue().find((b) => b.id === this.backupId.getValue())

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
   * Recopie d'options dans un nouveau jeux de données
   * @returns
   */
  duplicateBackupById(backupId: number, type: string) {
    const backup = this.backups.getValue().find((b) => b.id === backupId)

    const backupName = prompt('Sous quel nom ?', `${backup?.label} - copie`)

    if (backupName) {
      return this.serverService
        .post(`contentieux-options/duplicate-backup`, {
          backupId: backupId,
          backupName,
          type,
          backupStatus: 'Local',
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
  async onSaveDatas(isCopy: boolean, type = 'SIEGE', backupName: string | null = null, backupStatus = 'Local') {
    if (isCopy) {
      backupName = prompt('Sous quel nom ?')
      if (backupName === null) return null
    }
    return await this.serverService
      .post(`contentieux-options/save-backup`, {
        list: this.contentieuxOptions.getValue(),
        backupId: this.backupId.getValue(),
        type,
        backupName: backupName ? backupName : null,
        juridictionId: this.humanResourceService.backupId.getValue(),
        backupStatus,
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
  createEmpy(first = false, name = '', status = 'Local', type = 'SIEGE') {
    let backupName = null

    if (first) backupName = 'Mon premier référentiel'
    else if (name !== '') backupName = name
    else backupName = prompt('Sous quel nom ?')

    if (backupName) {
      return this.serverService
        .post(`contentieux-options/save-backup`, {
          list: [],
          backupName: backupName,
          backupStatus: status,
          type,
          juridictionId: this.humanResourceService.backupId.getValue(),
        })
        .then((r) => {
          this.backupId.next(r.data)
          this.loadBackupsAndId()
          return r.data
        })
    }

    return Promise.resolve()
  }

  /**
   * API rénommage d'un jeu de données
   * @returns
   */
  renameBackup() {
    const getBackup = this.backups.getValue().find((b) => b.id === this.backupId.getValue())
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
   * API rénommage d'un jeu de données
   * @returns
   */
  renameBackupById(backupId: number) {
    const getBackup = this.backups.getValue().find((b) => b.id === backupId)
    let backupName = prompt('Sous quel nom ?', getBackup ? getBackup.label : '')

    if (backupName) {
      return this.serverService
        .post(`contentieux-options/rename-backup`, {
          backupId: backupId,
          backupName: backupName,
          juridictionId: this.humanResourceService.backupId.getValue(),
        })
        .then(() => {
          const list = this.backups.getValue()
          const index = list.findIndex((b) => b.id === backupId)
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

  /**
   * Formate et envoi au back l'ensemble des valeurs
   * @param form
   * @returns
   */
  async onSendAllActivity(form: any) {
    const file = form.file.files[0]

    if (!file) {
      alert('Vous devez saisir une fichier !')
      return
    }

    const RefList = await readXlsxFile(file, { sheet: 2 })
      .then((rows: any) => {
        rows.splice(0, 2)
        const optionsMag = rows
          .filter((y: any) => {
            if (y[2] !== null) return true
            else return false
          })
          .map((x: any) => {
            return {
              averageProcessingTime: this.castToDecimalTime(String(x[2])),
              contentieux: { id: x[0], label: x[1] },
            }
          })
        return optionsMag
      })
      .then((data: any) => data)

    const res = groupBy([...RefList], 'contentieux.id')
    const resultat = await Object.keys(res).map((key) => {
      if (res[key].length > 1)
        return {
          ...res[key][0],
          ...res[key][1],
        } as ContentieuxOptionsInterface
      else return res[key][0] as ContentieuxOptionsInterface
    })
    this.contentieuxOptions.next(resultat)
    this.optionsIsModify.next(true)
    //await this.onSaveDatas(true)
  }

  /**
   * Cast to decimal time
   * @param value
   * @returns
   */
  castToDecimalTime(value: string) {
    if (value === null) return null
    const arrayValue = value.split(':')
    if (arrayValue.length > 1) return parseFloat(arrayValue[0]) + parseFloat(arrayValue[1]) / 60
    else return Number(value)
  }

  /**
   * Fonction qui génère automatiquement le nom du fichier téléchargé
   * @returns String - Nom du fichier téléchargé
   */
  getFileName(label: string | null) {
    return `Extraction_Référentiel de temps moyen - ` + (label || '')
  }

  /**
   * Télécharger le referentiel au format excel
   */
  downloadTemplate(empty = false) {
    let ref = this.humanResourceService.contentieuxReferentielOnly.getValue().filter((x) => x.label !== 'Autres activités')
    console.log(ref)

    const tmpList = this.generateFlateList(empty ? ref : this.referentiel, empty)
    this.refNameSelected = this.formDatas.getValue().find((x) => x.id === this.backupId.getValue())?.value || ''

    const viewModel = { referentiels: tmpList }

    fetch('/assets/template0.xlsx')
      // 2. Get template as ArrayBuffer.
      .then((response) => response.arrayBuffer())
      // 3. Fill the template with data (generate a report).
      .then((buffer) => {
        return new Renderer().renderFromArrayBuffer(buffer, viewModel)
      })
      // 4. Get a report as buffer.
      .then(async (report) => {
        return report.xlsx.writeBuffer()
      })
      // 5. Use `saveAs` to download on browser site.
      .then((buffer) => {
        const filename = empty ? 'Modèle - référentiel de temps moyens ' : this.getFileName(this.refNameSelected)
        return FileSaver.saveAs(new Blob([buffer]), filename + EXCEL_EXTENSION)
      })
      .catch((err) => console.log('Error writing excel export', err))
  }

  /**
   * Génère une liste de contentieux/sous contentieux à plat
   * @returns
   */
  generateFlateList(list: any, empty = false) {
    const flatList = new Array()
    list = empty ? list : list.getValue()
    list.map((x: any) => {
      const magAvg = decimalToStringDate(x.averageProcessingTime, ':')
      flatList.push({
        ...this.getFileValues(x),
        ...x,
        averageProcessingTime: magAvg === '0' || empty ? '' : magAvg,
      })
      if (x.childrens) {
        x.childrens.map((y: any) => {
          const magAvgChild = decimalToStringDate(y.averageProcessingTime, ':')
          flatList.push({
            ...this.getFileValues(y),
            ...y,
            averageProcessingTime: magAvgChild === '0' || empty ? '' : magAvgChild,
          })
        })
      }
    })
    return flatList
  }

  /**
   * Calcul les valeurs par jour et pas moi via la valeur de référence en heure
   * @param ref
   * @returns
   */
  getFileValues(ref: any) {
    return {
      id: Number(ref.id),
      nbPerDay: this.getInputValue(ref.averageProcessingTime, 'nbPerDay'),
      nbPerMonth: this.getInputValue(ref.averageProcessingTime, 'nbPerMonth'),
    }
  }

  /**
   * Retourne le temps de traitement d'un point de vue humain
   * @param avgProcessTime
   * @param unit
   * @returns
   */
  getInputValue(avgProcessTime: any, unit: string, category?: string | null) {
    switch (category || 'averageProcessingTime') {
      case 'averageProcessingTime':
        if (unit === 'hour') {
          return decimalToStringDate(avgProcessTime)
        } else if (unit === 'nbPerDay') {
          return 8 / avgProcessTime
        } else if (unit === 'nbPerMonth') {
          return (8 / avgProcessTime) * (208 / 12)
        }
        break
      case 'averageProcessingTimeFonc':
        if (unit === 'hour') {
          return decimalToStringDate(avgProcessTime)
        } else if (unit === 'nbPerDay') {
          return 7 / avgProcessTime
        } else if (unit === 'nbPerMonth') {
          return (7 / avgProcessTime) * (229.57 / 12)
        }
        break
    }
    return '0'
  }
}
