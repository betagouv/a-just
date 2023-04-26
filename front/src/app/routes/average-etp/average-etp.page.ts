import { Component, OnDestroy } from '@angular/core'
import * as FileSaver from 'file-saver'
import { dataInterface } from 'src/app/components/select/select.component'
import { BackupInterface } from 'src/app/interfaces/backup'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service'
import { ServerService } from 'src/app/services/http-server/server.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { UserService } from 'src/app/services/user/user.service'
import { findRealValue } from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'
import { userCanViewGreffier, userCanViewMagistrat } from 'src/app/utils/user'
import * as xlsx from 'xlsx'
import { Renderer } from 'xlsx-renderer'
import readXlsxFile from 'read-excel-file'
import { groupBy } from 'lodash'
import { ContentieuxOptionsInterface } from 'src/app/interfaces/contentieux-options'

/**
 * Excel file extension
 */
const EXCEL_EXTENSION = '.xlsx'

/**
 * Page des temps moyens par dossier
 */
@Component({
  templateUrl: './average-etp.page.html',
  styleUrls: ['./average-etp.page.scss'],
})
export class AverageEtpPage extends MainClass implements OnDestroy {
  /**
   * Référentiel complet
   */
  referentiel: ContentieuReferentielInterface[] = []
  /**
   * Unité de mesure de saisi
   */
  perUnity: string = 'hour'
  /**
   * En cours de chargement
   */
  isLoading: boolean = false
  /**
   * Label du referentiel selectionné
   */
  refNameSelected: string |null= null
  /**
   * Titre de la page
   */
  subTitleDate: string = ''
  /**
   * Sous titre de la page
   */
  subTitleName: string = ''
  /**
   * Catégorie selectionné (MAGISTRATS, FONCTIONNAIRES), null temps que l'on ne charge pas les droits utilisateurs
   */
  categorySelected: string | null = null
  /**
   * Liste des sauvegardes
   */
  backups: BackupInterface[] = []
  /**
   * Liste des sauvegardes des temps mouens
   */
  selectedIds: any[] = []
  /**
   * Liste des sauvegardes formatés pour le menu roulant
   */
  formDatas: dataInterface[] = []
  /**
   * Peux voir l'interface magistrat
   */
  canViewMagistrat: boolean = false
  /**
   * Peux voir l'interface greffier
   */
  canViewGreffier: boolean = false

  /**
   * Constructeur
   * @param contentieuxOptionsService
   * @param humanResourceService
   * @param referentielService
   * @param userService
   */
  constructor(
    private contentieuxOptionsService: ContentieuxOptionsService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private userService: UserService,
    private serverService: ServerService
  ) {
    super()

    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)

        if (this.canViewMagistrat) {
          this.categorySelected = 'MAGISTRATS'
        } else if (this.canViewGreffier) {
          this.categorySelected = 'FONCTIONNAIRES'
        } else {
          this.categorySelected = null
        }
      })
    )

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
      this.contentieuxOptionsService.initValue.subscribe((b) => {
        if (b === true) {
          this.referentiel.map((v) => {
            v.isModified = false
            v.isModifiedFonc = false

            v.averageProcessingTime = v.defaultValue
            v.averageProcessingTimeFonc = v.defaultValueFonc

            if (v.childrens !== undefined) {
              v.childrens.map((child) => {
                if (child.isModified === true) {
                  child.isModified = false
                  child.isModifiedFonc = false

                  child.averageProcessingTime = child.defaultValue
                  child.averageProcessingTimeFonc = child.defaultValueFonc
                }
              })
            }
          })
        }
      })
    )

    this.watch(
      this.contentieuxOptionsService.backupId.subscribe((backupId) => {
        if (backupId !== null) {
          this.onLoad(backupId)
          this.contentieuxOptionsService.getLastUpdate()
          this.referentiel.map((v) => {
            v.isModified = false
            v.isModifiedFonc = false
          })
        }
      })
    )

    this.watch(
      this.contentieuxOptionsService.contentieuxLastUpdate.subscribe(
        (lastUpdate) => {
          if (lastUpdate !== null && lastUpdate !== undefined) {
            const res =
              this.contentieuxOptionsService.contentieuxLastUpdate.getValue()
            if (res !== undefined && res.date) {
              let strDate = findRealValue(new Date(res.date))
              strDate = strDate === '' ? " aujourd'hui" : ' le ' + strDate
              this.subTitleDate = 'Mis à jour' + strDate + ', par '
              this.subTitleName = res.user.firstName + ' ' + res.user.lastName
            }
          } else {
            this.subTitleDate = ''
            this.subTitleName = ''
          }
        }
      )
    )
  }

  /**
   * Change l'id de la sauvegarde
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
   * Formate le menu déroulant avec la liste de toutes les sauvegardes
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

    this.contentieuxOptionsService.formDatas.next(this.formDatas)

  }

  /**
   * Destruction des observables
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Chargement des temps moyens par dossier
   * @param backupId
   */
  onLoad(backupId: number) {
    if (this.categorySelected === null) {
      return
    }

    this.isLoading = true
    this.contentieuxOptionsService.loadDetails(backupId).then((options) => {
      this.contentieuxOptionsService.contentieuxOptions.next(options)

      const referentiels = [
        ...this.humanResourceService.contentieuxReferentiel.getValue(),
      ].filter(
        (r) =>
          this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
          this.referentielService.idsSoutien.indexOf(r.id) === -1
      )

      // todo set in, out, stock for each
      this.referentiel = referentiels.map((ref) => {
        const getOption = options.find((a) => a.contentieux.id === ref.id)
        ref.averageProcessingTime =
          (getOption && getOption.averageProcessingTime) || null

        ref.averageProcessingTimeFonc =
          (getOption && getOption.averageProcessingTimeFonc) || null

        ref.defaultValue = ref.averageProcessingTime
        ref.defaultValueFonc = ref.averageProcessingTimeFonc

        ref.isModified = false
        ref.isModifiedFonc = false

        ref.childrens = (ref.childrens || []).map((c) => {
          const getOptionActivity = options.find(
            (a) => a.contentieux.id === c.id
          )
          c.averageProcessingTime =
            (getOptionActivity && getOptionActivity.averageProcessingTime) ||
            null

          c.averageProcessingTimeFonc =
            (getOptionActivity &&
              getOptionActivity.averageProcessingTimeFonc) ||
            null
          c.defaultValue = c.averageProcessingTime
          c.defaultValueFonc = c.averageProcessingTimeFonc
          c.isModified = false
          c.isModifiedFonc = false

          return c
        })

        return ref
      })

      this.contentieuxOptionsService.referentiel.next(this.referentiel)

      this.isLoading = false
    })
  }

  /**
   * Modification d'un temps moyen
   * @param referentiel
   * @param value
   * @param unit
   */
  onUpdateOptions(
    referentiel: ContentieuReferentielInterface,
    value: number,
    unit: string
  ) {
    if (
      value !== null &&
      fixDecimal(
        this.getInputValue(referentiel[this.getCategoryStr()], unit),
        100
      ) !== value
    ) {
      referentiel[this.getCategoryStr()] = this.getInputValue(value, unit)
      this.contentieuxOptionsService.updateOptions({
        ...referentiel,
        averageProcessingTimeFonc: referentiel.averageProcessingTimeFonc,
        averageProcessingTime: referentiel.averageProcessingTime,
      })

      if (this.categorySelected === 'MAGISTRATS') referentiel.isModified = true
      else referentiel.isModifiedFonc = true
    }
  }

  /**
   * Change l'unité de mesure
   * @param unit
   */
  changeUnity(unit: string) {
    this.perUnity = unit
  }

  /**
   * Change les catégories
   * @param category
   */
  changeCategorySelected(category: string) {
    this.categorySelected = category
  }

  /**
   * Retourne le temps de traitement d'un point de vue humain
   * @param avgProcessTime
   * @param unit
   * @returns
   */
  getInputValue(avgProcessTime: any, unit: string, category?: string | null) {
    switch (category || this.getCategoryStr()) {
      case 'averageProcessingTime':
        if (unit === 'hour') {
          return avgProcessTime
        } else if (unit === 'nbPerDay') {
          return 8 / avgProcessTime
        } else if (unit === 'nbPerMonth') {
          return (8 / avgProcessTime) * (208 / 12)
        }
        break
      case 'averageProcessingTimeFonc':
        if (unit === 'hour') {
          return avgProcessTime
        } else if (unit === 'nbPerDay') {
          return 7 / avgProcessTime
        } else if (unit === 'nbPerMonth') {
          return (7 / avgProcessTime) * (229.57 / 12)
        }
        break
    }
    return '0'
  }

  /**
   * Modife le champs d'un temps mouens
   * @param referentiel
   * @param event
   * @param unit
   */
  getField(
    referentiel: ContentieuReferentielInterface,
    event: any,
    unit: string
  ) {
    event.target.blur()
    if (
      event.target.value !== '' &&
      fixDecimal(
        this.getInputValue(referentiel[this.getCategoryStr()], unit),
        100
      ) !== parseFloat(event.target.value)
    ) {
      this.onUpdateOptions(referentiel, event.target.value, unit)
      if (this.categorySelected === 'MAGISTRATS') referentiel.isModified = true
      else referentiel.isModifiedFonc = true
    }
  }

  /**
   * Liste des catégories
   * @returns
   */
  getCategoryStr() {
    if (this.categorySelected === 'MAGISTRATS') return 'averageProcessingTime'
    else if (this.categorySelected === 'FONCTIONNAIRES')
      return 'averageProcessingTimeFonc'
    else return 'averageProcessingTime'
  }

  /**
   * Noeu de catégorie
   * @returns
   */
  getCategoryModifStr() {
    if (this.categorySelected === 'MAGISTRATS') return 'isModified'
    else return 'isModifiedFonc'
  }

  /**
   * Extraction des référentiels au format Excel
   */
  extractionExcel() {
    const tmpList = this.generateFlateList()
    this.refNameSelected = this.formDatas.find(x => x.id === this.contentieuxOptionsService.backupId.getValue())?.value || ''

    const viewModel = {
      referentiels: tmpList,
      name: this.refNameSelected+' - MAGISTRATS',
      referentielsFonc: tmpList,
      nameFonc: this.refNameSelected+' - FONCTIONNAIRES',
    }

    fetch('/assets/template2.xlsx')
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
        const filename = this.getFileName(this.refNameSelected)
        return FileSaver.saveAs(new Blob([buffer]), filename + EXCEL_EXTENSION)
      })
      .catch((err) => console.log('Error writing excel export', err))
  }
  /**
   * Fonction qui génère automatiquement le nom du fichier téléchargé
   * @returns String - Nom du fichier téléchargé
   */
  getFileName(label:string|null) {
    return `Extraction_Référentiel de temps moyen - `+ (label||'')
  }

  generateFlateList(){
    const flatList = new Array()
    this.referentiel.map((x) => {
      if (x.childrens) {
        flatList.push({
          ...this.getFileValues(x),
          ...x,
        })
        x.childrens.map((y) => {
          flatList.push({
            ...this.getFileValues(y),
            ...y,
          })
        })
      } else flatList.push({
        ...this.getFileValues(x),
        ...x,
      })
    })
    return flatList
  }

  getFileValues(ref:any){
    return {id:Number(ref.id),nbPerDay: this.getInputValue(
      ref.averageProcessingTime,
      'nbPerDay',
      'averageProcessingTime'
    ),
    nbPerMonth: this.getInputValue(
      ref.averageProcessingTime,
      'nbPerMonth',
      'averageProcessingTime'
    ),
    nbPerDayFonc: this.getInputValue(
      ref.averageProcessingTimeFonc,
      'nbPerDay',
      'averageProcessingTimeFonc'
    ),
    nbPerMonthFonc: this.getInputValue(
      ref.averageProcessingTimeFonc,
      'nbPerMonth',
      'averageProcessingTimeFonc'
    )}
  }

}


