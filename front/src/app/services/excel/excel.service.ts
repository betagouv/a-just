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
import { each, map, sortBy, uniq } from 'lodash'

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
  selectedCategory: BehaviorSubject<Array<string>> = new BehaviorSubject<Array<string>>(new Array())
  /**
 * En cours de chargement
 */
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
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
        const viewModel = {
          ...this.tabs.viewModel,
          "firstLink": {
            "label": "Consultez notre documentation en ligne ici.",
            "url": "https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/extraire-ses-donnees-deffectifs/le-fichier-excel-de-lextracteur-deffectifs"
          },
          "secondLink": {
            "label": "Pour une présentation de la méthodologie à suivre, consultez la documentation ici.",
            "url": "https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/extraire-ses-donnees-deffectifs/remplir-ses-tableaux-detpt-pour-les-ddg-en-quelques-minutes"
          },
          "thirdLink": {
            "label": "Pour une présentation détaillée de la méthodologie à suivre, consultez la documentation en ligne, disponible ici.",
            "url": "https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/extraire-ses-donnees-deffectifs/remplir-ses-tableaux-detpt-pour-les-ddg-en-quelques-minutes"
          }
          , daydate: `- du ${new Date(this.dateStart.getValue()).toLocaleDateString()} au ${new Date(this.dateStop.getValue())
            .toLocaleDateString()}`
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
            report = await this.getReport(report, viewModel)
            if (this.tabs.onglet1.values.length === 0) {
              alert('Une erreur est survenue lors de la génération de votre fichier.')
              throw 'no values';
            }
            return report.xlsx.writeBuffer()
          })
          // 5. Use `saveAs` to download on browser site.
          .then((buffer) => {
            const filename = this.getFileName()
            this.isLoading.next(false)
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

  /**
   * Creation d'un worksheet excel
   * @param file 
   */
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

  /**
   * Mise en forme du ficher DDG
   * @param report 
   * @param viewModel 
   * @returns 
   */
  async getReport(report: any, viewModel: any) {
    const tpxlistExcel = ['"' + await [...viewModel.tpxlist, ...viewModel.isolatedCPH].join(',').replaceAll("'", "").replaceAll("(", "").replaceAll(")", "") + '"']

    report.worksheets[4].insertRows(1, viewModel.uniqueJurIndex, 'o')

    // ONGLET JURIDICTION
    viewModel.tgilist.map((value: any, index: any) => { report.worksheets[5].getCell('B' + (+index + 1)).value = value })
    viewModel.tpxlist.map((value: any, index: any) => { report.worksheets[5].getCell('E' + (+index + 1)).value = value })
    viewModel.cphlist.map((value: any, index: any) => { report.worksheets[5].getCell('H' + (+index + 1)).value = value })
    viewModel.isolatedCPH.map((value: any, index: any) => { report.worksheets[5].getCell('J' + (+index + 1)).value = value })


    // DDG TJ
    report.worksheets[11].getCell('D' + +5).value = viewModel.tgilist[0] || viewModel.uniqueJur[0]
    // DDG TPROX
    report.worksheets[12].getCell('D' + +5).value = viewModel.tpxlist[0] || ""
    report.worksheets[12].getCell('D' + +5).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: tpxlistExcel,
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      prompt: viewModel.tpxlist.length ? 'Selectionner un TPROX' : 'Aucun TPROX n\'est disponible pour cette juridiction',
      showErrorMessage: true,
      showInputMessage: true,
    }
    // DDG CPH
    report.worksheets[13].getCell('D' + +5).value = viewModel.uniqueJur[0] || ""
    report.worksheets[13].getCell('D' + +5).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: viewModel.tProximite,
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      prompt: 'Selectionner une juridiction',
      showErrorMessage: true,
      showInputMessage: true,
    }

    // ONGLET ETPT DDG
    report.worksheets[2].columns = [...this.tabs.onglet2.columnSize]
    report.worksheets[2].columns[0].width = 16
    report.worksheets[2].columns[8].width = 0

    this.tabs.onglet2.values.forEach((element: any, index: number) => {
      const indexCell = + (+index + 3)

      report.worksheets[2].getCell('EA' + (+index + 3)).value = {
        formula: '=IF(H' + indexCell + '="","",IF(H' + indexCell + '="CONT A JP",IF(G' + indexCell + '="Autour du Juge","CONT A JP Autour du Juge","CONT A JP Greffe"),VLOOKUP(H' + indexCell + ',Table_Fonctions!C:F,4,FALSE)))',
        result: "0"
      }
      report.worksheets[2].getCell('EB' + (+index + 3)).value = {
        formula: '=IFERROR(SUM(O' + indexCell + ',T' + indexCell + ',AD' + indexCell + ',AM' + indexCell + ',BG' + indexCell + ',BL' + indexCell + '),"")',
        result: "0"
      }
      report.worksheets[2].getCell('EC' + (+index + 3)).value = {
        formula: '=IF(H' + indexCell + '="","",SUM(BM' + indexCell + ',BN' + indexCell + ',CE' + indexCell + ',CK' + indexCell + ',CP' + indexCell + '))',
        result: "0"
      }
      report.worksheets[2].getCell('ED' + (+index + 3)).value = {
        formula: '=IF(H' + indexCell + '="","",IF(EC' + indexCell + '+EB' + indexCell + '+CS' + indexCell + '+EE' + indexCell + '=M' + indexCell + ',"OK","ERREUR"))',
        result: "0"
      }
      report.worksheets[2].getCell('EE' + (+index + 3)).value = {
        formula: '=IF(ISERROR(DF' + indexCell + '+DH' + indexCell + '+DK' + indexCell + '+DL' + indexCell + '+DM' + indexCell + '+DO' + indexCell + '+DP' + indexCell + '+DQ' + indexCell + '+DR' + indexCell + '),"",DF' + indexCell + '+DH' + indexCell + '+DK' + indexCell + '+DL' + indexCell + '+DM' + indexCell + '+DO' + indexCell + '+DP' + indexCell + '+DQ' + indexCell + '+DR' + indexCell + ')',
        result: "0"
      }
      report.worksheets[2].getCell('EF' + (+index + 3)).value = {
        formula: '=IF(ISERROR(M' + indexCell + '+DE' + indexCell + '),"",M' + indexCell + '+DE' + indexCell + ')',
        result: "0"
      }

      if (viewModel.arrondissement === "TJ LES SABLES D'OLONNE") {
        report.worksheets[2].getCell('C' + (+index + 3)).value = report.worksheets[2].getCell('C' + (+index + 3)).value.replace("D' ", "D'")
        viewModel.tProximite = viewModel.tProximite.map((value: string) => {
          if (value.includes("DOLONNE")) return value.replace("DOL", "D'OL")
          return value
        })
      }

      report.worksheets[2].getCell('C' + (+index + 3)).dataValidation =
      {
        type: 'list',
        allowBlank: true,
        formulae: viewModel.tProximite,
        error:
          'Veuillez selectionner une valeur dans le menu déroulant',
        showErrorMessage: true,
        showInputMessage: true,
      }


      const fonctionCellToCheck = (report.worksheets[2].getCell('H' + (+index + 3)).value! as string) || ""
      if (fonctionCellToCheck.includes("PLACÉ")) {
        report.worksheets[2].getCell('H' + (+index + 3)).dataValidation =
        {
          type: 'list',
          allowBlank: true,
          formulae: [`"${report.worksheets[2].getCell('H' + (+index + 3)).value} ADDITIONNEL,${report.worksheets[2].getCell('H' + (+index + 3)).value} SUBSTITUTION"`],
        }
        report.worksheets[2].getCell('H' + (+index + 3)).value = `${report.worksheets[2].getCell('H' + (+index + 3)).value} ADDITIONNEL`
      }
      if (report.worksheets[2].getCell('H' + (+index + 3)).value === "JA") {
        report.worksheets[2].getCell('H' + (+index + 3)).value = "JA Siège autres"
        report.worksheets[2].getCell('H' + (+index + 3)).dataValidation =
        {
          type: 'list',
          allowBlank: true,
          formulae: ['"JA Siège autres,JA Pôle Social,JA Parquet,JA JP,JA VIF"'],
        }
      }

    })



    //ONGLET ETPT AJUST
    report.worksheets[1].columns = [...this.tabs.onglet1.columnSize]
    report.worksheets[1].columns[0].width = 16

    // ONGLET AGREGAT
    report.worksheets[3].columns[0].width = 20
    report.worksheets[3].getCell('A' + +3).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: viewModel.tProximite,
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      prompt: 'Selectionner une juridiction pour mettre à jour le tableau de synthèse ci-après',
      showErrorMessage: true,
      showInputMessage: true,
    }


    return report
  }
}

