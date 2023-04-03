import { Injectable, OnInit } from '@angular/core'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { BehaviorSubject } from 'rxjs'
import { MainClass } from 'src/app/libs/main-class'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { UserService } from '../user/user.service'
import * as FileSaver from 'file-saver'
import { ServerService } from '../http-server/server.service'
import { AppService } from '../app/app.service'
import { setTimeToMidDay } from 'src/app/utils/dates'
import { Renderer } from 'xlsx-renderer'

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
 * Service d'extraction excel
 */
@Injectable({
  providedIn: 'root',
})
export class ExcelService extends MainClass {
  /**
   * Categories selectionnées par l'utilisateur
   */
  categories: HRCategoryInterface[] = []
  /**
   * Fonctions selectionnées par l'utilisateur
   */
  fonctions: HRFonctionInterface[] = []
  /**
   * Liste des referentiels
   */
  allReferentiels: ContentieuReferentielInterface[] = []
  /**
   * Date de début d'extraction
   */
  dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date())
  /**
   * Date de fin d'extraction
   */
  dateStop: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date())
  /**
   * Catégories à extraire
   */
  selectedCategory: BehaviorSubject<string> = new BehaviorSubject<string>('')
  /**
   * Données d'extraction
   */
  data: Array<any> = []
  /**
   * Taille des colonnes dans l'onglet 1 du fichier excel extrait
   */
  columnSize: Array<any> = []
  /**
   * Taille des colonnes dans l'longlet 2 fichier excel extrait
   */
  columnSizeSecondTab: Array<any> = []

  tabs: any = {
    onglet1: { values: null, columnSize: null },
    onglet2: { values: null, columnSize: null },
  }

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
    private userService: UserService,
    private appService: AppService
  ) {
    super()
  }

  /**
   * API retourne les données de ventilations aggrégées pour l'ensemble des ressources présentes sur une date choisie
   * @returns
   */
  exportExcel() {
    console.log(this.dateStart.getValue())
    return this.serverService
      .post(`extractor/filter-list`, {
        backupId: this.humanResourceService.backupId.getValue(),
        dateStart: setTimeToMidDay(this.dateStart.getValue()),
        dateStop: setTimeToMidDay(this.dateStop.getValue()),
        categoryFilter: this.selectedCategory.getValue(),
      })
      .then((data) => {
        this.tabs = data.data
        const keys = Object.keys(this.tabs.onglet1.values[0])

        const viewModel = {
          subtitles: [...Array(keys.length - 6 || 0)],
          days: keys,
          stats: {
            ...this.tabs.onglet1.values.map((item: any) => {
              return { actions: Object.keys(item).map((key: any) => item[key]) }
            }),
          },
        }

        this.appService.alert.next({
          text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
        })
        
        fetch('/assets/template3.xlsx')
          // 2. Get template as ArrayBuffer.
          .then((response) => response.arrayBuffer())
          // 3. Fill the template with data (generate a report).
          .then((buffer) => {
            return new Renderer().renderFromArrayBuffer(buffer, viewModel)
          })
          // 4. Get a report as buffer.
          .then(async (report) => {
            report.worksheets[0].columns = [
              { width: 5 },
              ...this.tabs.onglet1.columnSize,
            ]
            
            report.worksheets[1].insertRows(4,new Array(['',...Object.keys(this.tabs.onglet2.values[0])].map((x)=> x)), 'i+') //report.worksheets[0].getSheetValues().slice(3,4)

            report.worksheets[1].spliceRows(5,1)
            report.worksheets[1].insertRows(5,[],'n')
            report.worksheets[1].spliceRows(3,1)            

            report.worksheets[1].insertRows(4,[...this.tabs.onglet2.values.map((item: any) => ['',...Object.keys(item).map((key: any) => item[key])])],'n')
            report.worksheets[1].columns = [
              { width: 5 },
              ...this.tabs.onglet2.columnSize,
            ]

            return report.xlsx.writeBuffer()
          })
          // 5. Use `saveAs` to download on browser site.
          .then((buffer) => {
            const filename = this.getFileName()
            return FileSaver.saveAs(
              new Blob([buffer]),
              filename + EXCEL_EXTENSION
            )
          })
          // Handle errors.
          .catch((err) => console.log('Error writing excel export', err))

        /**
        this.tabs = data.data

        console.log(this.tabs.onglet1.columnSize)
        import('xlsx').then((xlsx) => {
          const worksheet = xlsx.utils.json_to_sheet(this.tabs.onglet1.values, {})
          worksheet['!cols'] = this.tabs.onglet1.columnSize

          const worksheet1 = xlsx.utils.json_to_sheet(this.tabs.onglet2.values, {})
          worksheet1['!cols'] = this.tabs.onglet2.columnSize

          const workbook = {Sheets: {},SheetNames: []}

          xlsx.utils.book_append_sheet(workbook, {}, 'NOTICE et COMMENTAIRES')
          xlsx.utils.book_append_sheet(workbook, worksheet, 'ETPT A-JUST')
          xlsx.utils.book_append_sheet(workbook, worksheet1, 'ETPT Format DDG')

          const excelBuffer: any = xlsx.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
          })

          const filename = this.getFileName()
          const data: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE })
          this.appService.alert.next({
            text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
          })
          FileSaver.saveAs(data, filename + EXCEL_EXTENSION)
        }) */
      })
  }

  /**
   * Fonction qui génère automatiquement le nom du fichier téléchargé
   * @returns String - Nom du fichier téléchargé
   */
  getFileName() {
    return `Extraction ETPT_du ${new Date(this.dateStart.getValue())
      .toJSON()
      .slice(0, 10)} au ${new Date(this.dateStop.getValue())
      .toJSON()
      .slice(0, 10)}_par ${
      this.userService.user.getValue()!.firstName
    }_${this.userService.user.getValue()!.lastName!}_le ${new Date()
      .toJSON()
      .slice(0, 10)}`
  }

  modifyExcel(file: any) {
    import('xlsx').then(async (xlsx) => {
      const data = await file.arrayBuffer()
      let wb = xlsx.read(data)
      const worksheet = xlsx.utils.json_to_sheet(this.data, {})
      console.log(worksheet)

      wb.Sheets[wb.SheetNames[0]] = worksheet
      //const ws = wb.Sheets[wb.SheetNames[0]]
      //xlsx.utils.book_append_sheet(wb, ws, 'Onglet 1')

      const excelBuffer: any = xlsx.write(wb, {
        bookType: 'xlsx',
        type: 'array',
      })
      const filename = this.getFileName()
      const datas: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE })
      this.appService.alert.next({
        text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
      })
      FileSaver.saveAs(datas, filename + EXCEL_EXTENSION)
    })

    console.log(file.name)
  }
}
