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
import { map, sortBy, uniq } from 'lodash'

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
    return this.serverService
      .post(`extractor/filter-list`, {
        backupId: this.humanResourceService.backupId.getValue(),
        dateStart: setTimeToMidDay(this.dateStart.getValue()),
        dateStop: setTimeToMidDay(this.dateStop.getValue()),
        categoryFilter: this.selectedCategory.getValue(),
      })
      .then(async (data) => {
        this.tabs = data.data
        const keys1 = Object.keys(this.tabs.onglet1.values[0])
        const keys2 = Object.keys(this.tabs.onglet2.values[0])


        const tgilist = [...this.tabs.allJuridiction].filter((x: any) => x.type === 'TGI').map(x => x.tprox)
        const tpxlist = [...this.tabs.allJuridiction].filter((x: any) => x.type === 'TPRX').map(x => x.tprox)
        const cphlist = [...this.tabs.allJuridiction].filter((x: any) => x.type === 'CPH').map(x => x.tprox)

        console.log(this.tabs.allJuridiction)
        const uniqueJur = await sortBy(this.tabs.tproxs, 'tprox').map((t) => t.tprox)
        const uniqueJurIndex = await uniqueJur.map((value, index) => [value, index])
        const tProximite = ['"' + await uniqueJur.join(',').replaceAll("'", "").replaceAll("(", "").replaceAll(")", "") + '"']

        const viewModel = {
          daydate: `- du ${new Date(this.dateStart.getValue()).toLocaleDateString()} au ${new Date(this.dateStop.getValue())
            .toLocaleDateString()}`,
          agregat: this.tabs.onglet2.excelRef,
          referentiel: data.data.referentiels.map((x: any) => {
            return {
              ...x,
              childrens: [
                ...x.childrens.map((y: any) => {
                  return y.label
                }),
              ],
            }
          }),
          arrondissement: uniqueJur[0],
          subtitles: [...Array(keys1.length - 6 || 0)],
          days: keys1,
          stats: {
            ...this.tabs.onglet1.values.map((item: any) => {
              return { actions: Object.keys(item).map((key: any) => item[key]) }
            }),
          },
          subtitles1: [...Array(keys2.length - 6 || 0)],
          days1: keys2,
          stats1: {
            ...this.tabs.onglet2.values.map((item: any) => {
              return { actions: Object.keys(item).map((key: any) => item[key]) }
            }),
          },
        }

        fetch('/assets/template4.xlsx')
          // 2. Get template as ArrayBuffer.
          .then((response) => response.arrayBuffer())
          // 3. Fill the template with data (generate a report).
          .then((buffer) => {
            return new Renderer().renderFromArrayBuffer(buffer, viewModel)
          })
          // 4. Get a report as buffer.
          .then(async (report) => {
            report.worksheets[3].insertRows(1, uniqueJurIndex, 'o')

            tgilist.map((value, index) => { report.worksheets[5].getCell('B' + (+index + 1)).value = value })
            tpxlist.map((value, index) => { report.worksheets[5].getCell('E' + (+index + 1)).value = value })
            cphlist.map((value, index) => { report.worksheets[5].getCell('H' + (+index + 1)).value = value })

            const tgilistExcel = ['"' + await tgilist.join(',').replaceAll("'", "").replaceAll("(", "").replaceAll(")", "") + '"']
            const tpxlistExcel = ['"' + await tpxlist.join(',').replaceAll("'", "").replaceAll("(", "").replaceAll(")", "") + '"']

            report.worksheets[14].getCell('D' + +5).value = tgilist[0] || ""
            report.worksheets[14].getCell('D' + +5).dataValidation = {
              type: 'list',
              allowBlank: false,
              formulae: tgilistExcel,
              error: 'Veuillez selectionner une valeur dans le menu déroulant',
              prompt: 'Selectionner un TJ',
              showErrorMessage: true,
              showInputMessage: true,
            }
            report.worksheets[15].getCell('D' + +5).value = tpxlist[0] || ""
            report.worksheets[15].getCell('D' + +5).dataValidation = {
              type: 'list',
              allowBlank: false,
              formulae: tpxlistExcel,
              error: 'Veuillez selectionner une valeur dans le menu déroulant',
              prompt: 'Selectionner un TPROX',
              showErrorMessage: true,
              showInputMessage: true,
            }
            report.worksheets[16].getCell('D' + +5).value = uniqueJur[0] || ""
            report.worksheets[16].getCell('D' + +5).dataValidation = {
              type: 'list',
              allowBlank: false,
              formulae: tProximite,
              error: 'Veuillez selectionner une valeur dans le menu déroulant',
              prompt: 'Selectionner une juridiction',
              showErrorMessage: true,
              showInputMessage: true,
            }

            report.worksheets[0].columns = [...this.tabs.onglet1.columnSize]
            report.worksheets[1].columns = [...this.tabs.onglet2.columnSize]

            report.worksheets[1].columns[8].width = 0
            report.worksheets[0].columns[0].width = 16
            report.worksheets[1].columns[0].width = 16
            report.worksheets[2].columns[0].width = 20

            report.worksheets[2].getCell('A' + +3).dataValidation = {
              type: 'list',
              allowBlank: false,
              formulae: tProximite,
              error: 'Veuillez selectionner une valeur dans le menu déroulant',
              prompt: 'Selectionner une juridiction pour mettre à jour le tableau de synthèse ci-après',
              showErrorMessage: true,
              showInputMessage: true,
            }

            this.tabs.onglet2.values.forEach((element: any, index: number) => {
              report.worksheets[1].getCell('C' + (+index + 3)).dataValidation =
              {
                type: 'list',
                allowBlank: true,
                formulae: tProximite,
                error:
                  'Veuillez selectionner une valeur dans le menu déroulant',
                //prompt: 'je suis un prompteur',
                showErrorMessage: true,
                showInputMessage: true,
              }
            })

            this.tabs.onglet2.values.forEach((element: any, index: number) => {


              if ((report.worksheets[1].getCell('H' + (+index + 3)).value! as string).includes("PLACÉ")) {
                report.worksheets[1].getCell('H' + (+index + 3)).dataValidation =
                {
                  type: 'list',
                  allowBlank: true,
                  formulae: [`"${report.worksheets[1].getCell('H' + (+index + 3)).value} ADDITIONNEL,${report.worksheets[1].getCell('H' + (+index + 3)).value} SUBSTITUTION"`],
                }

                report.worksheets[1].getCell('H' + (+index + 3)).value = `${report.worksheets[1].getCell('H' + (+index + 3)).value} ADDITIONNEL`

              }
              if (report.worksheets[1].getCell('H' + (+index + 3)).value === "JA") {
                report.worksheets[1].getCell('H' + (+index + 3)).value = "JA Siège autres"
                report.worksheets[1].getCell('H' + (+index + 3)).dataValidation =
                {
                  type: 'list',
                  allowBlank: true,
                  formulae: ['"JA Siège autres,JA Pôle Social,JA Parquet,JA JP"'],
                }
              }
            })


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
          .catch((err) => console.log('Error writing excel export', err))
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
        .slice(0, 10)}_par ${this.userService.user.getValue()!.firstName
      }_${this.userService.user.getValue()!.lastName!}_le ${new Date()
        .toJSON()
        .slice(0, 10)}`
  }

  modifyExcel(file: any) {
    import('xlsx').then(async (xlsx) => {
      const data = await file.arrayBuffer()
      let wb = xlsx.read(data)
      const worksheet = xlsx.utils.json_to_sheet(this.data, {})

      wb.Sheets[wb.SheetNames[0]] = worksheet

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
  }
}

