import { Component } from '@angular/core'
import FileSaver from 'file-saver'
import { orderBy } from 'lodash'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { AppService } from 'src/app/services/app/app.service'
import { ExcelService } from 'src/app/services/excel/excel.service'
import { ServerService } from 'src/app/services/http-server/server.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { UserService } from 'src/app/services/user/user.service'
import { generalizeTimeZone, getShortMonthString } from 'src/app/utils/dates'
import * as xlsx from 'xlsx'

/**
 * Excel file details
 */
const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
/**
 * Excel file extension
 */
const EXCEL_EXTENSION = '.xlsx'

/**
 * Excel file headers
 */
const headers = [
  ' ',
  'Période',
  'Entrées logiciel',
  'Entrées A-JUSTées',
  'Sorties logiciel',
  'Sorties A-JUSTées',
  'Stock logiciel',
  'Stock A-JUSTé',
]

@Component({
  selector: 'aj-extractor-activity',
  templateUrl: './extractor-activity.component.html',
  styleUrls: ['./extractor-activity.component.scss'],
})
export class ExtractorActivityComponent extends MainClass {
  /**
   * Date de début selectionnée
   */
  dateStart: Date | null = null
  /**
   * Date de fin selectionnée
   */
  dateStop: Date | null = null
  /**
   * Date à aujourd'hui
   */
  today = new Date()
  /**
   * Activation selection
   */
  classSelected = 'disabled'
  /**
   * Categories
   */
  categories = new Array<any>()
  /**
   * Categorie selectionée
   */
  selectedCategorieId: undefined | string = undefined
  /**
   * Loader
   */
  isLoading: boolean = false
  /**
   * Date de dernier data uploaded
   */
  lastDataDate: Date | null = null
  /**
   * Données à extraire
   */
  data: any = undefined
  /**
   * Somme des données à extraire
   */
  sumTab: any = undefined

  /**
   * Constructeur
   * @param humanResourceService
   * @param serverService
   * @param userService
   * @param appService
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private serverService: ServerService,
    private excelService: ExcelService,
    private activityService: ActivitiesService,
    private appService: AppService,
    private userService: UserService
  ) {
    super()

    this.activityService.getLastMonthActivities().then((data) => {
      this.lastDataDate = new Date(data)
    })
  }

  /**
   * Selecteur de date
   * @param dateType date de début ou date de fin
   * @param value date
   */
  selectDate(dateType: string, value: any): void {
    if (dateType === 'start') {
      this.excelService.dateStart.next(value)
      this.dateStart = value
    }
    if (dateType === 'stop') {
      this.excelService.dateStop.next(value)
      this.dateStop = value
    }
    this.checkValidity()
  }

  /**
   * Vérifie si tous les paramètres sont bien selectionnés
   */
  checkValidity() {
    if (this.dateStart !== null && this.dateStop !== null)
      this.classSelected = ''
    else this.classSelected = 'disabled'
  }

  /**
   * Retourne le nom d'un onglet excel formaté
   */
  getMonthTabName(act: any) {
    return (
      getShortMonthString(new Date(act.periode)) +
      ' ' +
      new Date(act.periode).getFullYear()
    )
  }

  /**
   * Retourne le label de la période à extraire
   * @param dateStart
   * @param dateStop
   * @returns
   */
  getTotalPeriodeLabel(dateStart: Date, dateStop: Date) {
    return (
      'De ' +
      (getShortMonthString(new Date(dateStart)) +
        ' ' +
        new Date(dateStart).getFullYear()) +
      ' à ' +
      (getShortMonthString(new Date(dateStop)) +
        ' ' +
        new Date(dateStop).getFullYear())
    )
  }

  /**
   * Génère la donnée formatée à injecter dans le fichier Excel
   * @param act
   * @param monthTabName
   * @returns
   */
  generateFormatedDataMonth(act: any, monthTabName: string) {
    const sortCodeArray = act.contentieux.code_import
      .split('.')
      .map((x: string) => Number(x))
      .filter((y: number) => y !== 0)

    return {
      [' ']: act.contentieux.label, //act.contentieux.code_import + ' ' +
      ['codeUnit']: sortCodeArray[0] || 0,
      ['codeCent']: sortCodeArray[1] || -1,
      Période: monthTabName,
      ['Entrées logiciel']: act.originalEntrees,
      ['Entrées A-JUSTées']: act.entrees,
      ['Sorties logiciel']: act.originalSorties,
      ['Sorties A-JUSTées']: act.sorties,
      ['Stock logiciel']: act.originalStock,
      ['Stock A-JUSTé']: act.stock,
    }
  }

  /**
   * Retourne la largeur de chaque colonne en nombre de charactère
   * @param headers
   * @param element
   * @returns
   */
  getColumnWidth(headers: any, element: any) {
    return headers.map((header: any) => {
      return {
        wch: Math.max(
          header.length,
          element.reduce(
            (w: any, r: any) =>
              Math.max(w || 10, (r[header] || []).length || 10),
            10
          )
        ),
      }
    })
  }

  /**
   * Trier data par code import
   */
  sortByCodeImport(sumTab: any) {
    sumTab = orderBy(sumTab, ['codeUnit', 'codeCent'], ['asc'])
    sumTab.forEach(function (v: any) {
      delete v['codeUnit']
      delete v['codeCent']
    })
    return sumTab
  }

  /**
   * Génère le nom du ficher téléchargé
   * @returns 
   */
  getExportFileName(){
    return `Extraction_Données_D_Activité_${this.getTotalPeriodeLabel(
      this.dateStart || new Date(),
      this.dateStop || new Date()
    )}_par ${
      this.userService.user.getValue()!.firstName
    }_${this.userService.user.getValue()!.lastName!}_le ${new Date()
      .toJSON()
      .slice(0, 10)}`
  }

  /**
   * Génère un onglet excel
   * @param headers 
   * @param data 
   * @returns 
   */
  generateWorkSheet(headers: any, data: any) {
    const worksheet = xlsx.utils.json_to_sheet(data, {})
    worksheet['!cols'] = this.getColumnWidth(headers, data)
    return worksheet
  }
  
  /**
   * Get data from back-end
   * @returns
   */
  exportActDate() {
    return this.serverService
      .post(`extractor/filter-list-act`, {
        backupId: this.humanResourceService.backupId.getValue(),
        dateStart: generalizeTimeZone(this.dateStart || this.today),
        dateStop: generalizeTimeZone(this.dateStop || this.today),
      })
      .then((data) => {
        this.data = data.data.list
        this.sumTab = data.data.sumTab

        let monthTabName = ''
        const workbook = xlsx.utils.book_new()

        this.sumTab = this.sumTab.map((act: any) => {
          return this.generateFormatedDataMonth(
            act,
            this.getTotalPeriodeLabel(
              this.dateStart || new Date(),
              this.dateStop || new Date()
            )
          )
        })
        this.sumTab = this.sortByCodeImport(this.sumTab)
        xlsx.utils.book_append_sheet(
          workbook,
          this.generateWorkSheet(headers, this.sumTab),
          'Total sur la période'
        )

        this.data = Object.keys(this.data).map((key: any) => {
          this.data[key] = this.data[key].map((act: any) => {
            monthTabName = this.getMonthTabName(act)
            return this.generateFormatedDataMonth(act, monthTabName)
          })
          this.data[key] = this.sortByCodeImport(this.data[key])
          xlsx.utils.book_append_sheet(
            workbook,
            this.generateWorkSheet(headers, this.data[key]),
            monthTabName
          )
        })

        const excelBuffer: any = xlsx.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
        })

        const dataSaved: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE })
        this.appService.alert.next({
          text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
        })
        FileSaver.saveAs(dataSaved, this.getExportFileName() + EXCEL_EXTENSION)
      })
  }
}