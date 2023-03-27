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
   * Taille des colonnes dans le fichier excel extrait
   */
  columnSize: Array<any> = []

  tabs:Array<any>=[]

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
        dateStart:  setTimeToMidDay(this.dateStart.getValue()),
        dateStop:  setTimeToMidDay(this.dateStop.getValue()),
        categoryFilter: this.selectedCategory.getValue(),
      })
      .then((data) => {
        this.data = data.data.values
        this.tabs[0] = data.data.values
        this.tabs[1] = data.data.values2
        this.columnSize = data.data.columnSize

        console.log(this.tabs[1])
        import('xlsx').then((xlsx) => {
          const worksheet = xlsx.utils.json_to_sheet(this.data, {})
          worksheet['!cols'] = this.columnSize

          const worksheet1 = xlsx.utils.json_to_sheet(this.tabs[1], {})

          const workbook = {
            Sheets: { data: worksheet },
            SheetNames: ['data'],
          }

          xlsx.utils.book_append_sheet(workbook, worksheet1, 'Onglet 1')

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
        })
      })
  }

  /**
   * Fonction qui génère automatiquement le nom du fichier téléchargé
   * @returns String - Nom du fichier téléchargé
   */
  getFileName() {
    return `Extraction ETPT_du ${new Date(
      this.dateStart
        .getValue())
      .toJSON()
      .slice(0, 10)} au ${new Date(
      this.dateStop
        .getValue())
      .toJSON()
      .slice(0, 10)}_par ${
      this.userService.user.getValue()!.firstName
    }_${this.userService.user.getValue()!.lastName!}_le ${new Date()
      .toJSON()
      .slice(0, 10)}`
  }

  modifyExcel(file:any){

    import('xlsx').then(async (xlsx) => {
      const data = await file.arrayBuffer();
      let wb = xlsx.read(data);
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
