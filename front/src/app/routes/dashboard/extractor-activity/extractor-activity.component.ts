import { Component } from '@angular/core';
import * as Sentry from '@sentry/browser';
import * as FileSaver from 'file-saver';
import { orderBy } from 'lodash';
import * as xlsx from 'xlsx';
import { DateSelectComponent } from '../../../components/date-select/date-select.component';
import { MainClass } from '../../../libs/main-class';
import { HumanResourceService } from '../../../services/human-resource/human-resource.service';
import { ServerService } from '../../../services/http-server/server.service';
import { ExcelService } from '../../../services/excel/excel.service';
import { ActivitiesService } from '../../../services/activities/activities.service';
import { AppService } from '../../../services/app/app.service';
import { UserService } from '../../../services/user/user.service';
import { ReferentielService } from '../../../services/referentiel/referentiel.service';
import {
  generalizeTimeZone,
  getShortMonthString,
  setTimeToMidDay,
} from '../../../utils/dates';
import { MatIconModule } from '@angular/material/icon';
import { Renderer } from 'xlsx-renderer';
import { startLatencyScope } from '../../../utils/sentry-latency';
import { exposeDownloadToCypress } from '../../../utils/test-download';

/**
 * Excel file details
 */
const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
/**
 * Excel file extension
 */
const EXCEL_EXTENSION = '.xlsx';

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
];

/**
 * Excel file headers sum
 */
const headersSum = [
  ' ',
  'Période',
  'Total entrées logiciel',
  'Total entrées après A-JUSTements',
  'Total sorties logiciel',
  'Total sorties après A-JUSTements',
  'Stock logiciel',
  'Stock après A-JUSTements',
];
@Component({
  selector: 'aj-extractor-activity',
  standalone: true,
  imports: [DateSelectComponent, MatIconModule],
  templateUrl: './extractor-activity.component.html',
  styleUrls: ['./extractor-activity.component.scss'],
})
export class ExtractorActivityComponent extends MainClass {
  /**
   * Date de début selectionnée
   */
  dateStart: Date | null = null;
  /**
   * Date de fin selectionnée
   */
  dateStop: Date | null = null;
  /**
   * Date à aujourd'hui
   */
  today = new Date();
  /**
   * Activation selection
   */
  classSelected = 'disabled';
  /**
   * Categories
   */
  categories = new Array<any>();
  /**
   * Categorie selectionée
   */
  selectedCategorieId: undefined | string = undefined;
  /**
   * Loader
   */
  isLoading: boolean = false;
  /**
   * Date de dernier data uploaded
   */
  lastDataDate: Date | null = null;
  /**
   * Données à extraire
   */
  data: any = undefined;
  /**
   * Somme des données à extraire
   */
  sumTab: any = undefined;
  /**
   * Date de début minimum
   */
  minDate: Date | null = null;

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
    private userService: UserService,
    private referentielService: ReferentielService
  ) {
    super();

    this.activityService.getLastMonthActivities().then((data) => {
      this.lastDataDate = new Date(data);
    });

    this.minDate = this.userService.isCa()
      ? new Date('2022-01-01')
      : new Date('2021-01-01');
  }

  /**
   * Selecteur de date
   * @param dateType date de début ou date de fin
   * @param value date
   */
  selectDate(dateType: string, value: any): void {
    if (dateType === 'start') {
      this.excelService.dateStart.next(value);
      this.dateStart = value;
    }
    if (dateType === 'stop') {
      this.excelService.dateStop.next(value);
      this.dateStop = value;
    }
    this.checkValidity();
  }

  /**
   * Vérifie si tous les paramètres sont bien selectionnés
   */
  checkValidity() {
    if (this.dateStart !== null && this.dateStop !== null)
      this.classSelected = '';
    else this.classSelected = 'disabled';
  }

  /**
   * Retourne le nom d'un onglet excel formaté
   */
  getMonthTabName(act: any) {
    return (
      getShortMonthString(new Date(act.periode)) +
      ' ' +
      new Date(act.periode).getFullYear()
    );
  }

  /**
   * Retourne le label de la période à extraire
   * @param dateStart
   * @param dateStop
   * @returns
   */
  getTotalPeriodeLabel(dateStart: Date, dateStop: Date, lowerStart = false) {
    return (
      (lowerStart ? 'de ' : 'De ') +
      (getShortMonthString(new Date(dateStart)) +
        ' ' +
        new Date(dateStart).getFullYear()) +
      ' à ' +
      (getShortMonthString(new Date(dateStop)) +
        ' ' +
        new Date(dateStop).getFullYear())
    );
  }

  /**
   * Génère la donnée formatée à injecter dans le fichier Excel
   * @param act
   * @param monthTabName
   * @returns
   */
  generateFormatedDataMonth(act: any, monthTabName: string, total = false) {
    const sortCodeArray = (act.contentieux.code_import || '')
      .split('.')
      .filter((y: String) => y !== '')
      .map((x: string) => (x === '0' ? 0.1 : Number(x)));

    const ref =
      this.humanResourceService.contentieuxReferentielOnly.value
        .map((x) => x.id)
        .includes(act.idReferentiel) === true
        ? true
        : false;
    return {
      ['codeUnit']: sortCodeArray[0] || 0,
      ['codeCent']: sortCodeArray[1] * 10 || -1,
      ['idReferentiel']: act.idReferentiel,
      Période: monthTabName,
      [' ']:
        ref === true
          ? 'Total ' + act.contentieux.label
          : '          ' + act.contentieux.label, //act.contentieux.code_import + ' ' +
      [total === true ? 'Total entrées logiciel' : 'Entrées logiciel']:
        act.originalEntrees,
      [total === true
        ? 'Total entrées après A-JUSTements'
        : 'Entrées A-JUSTées']: act.entrees,
      [total === true ? 'Total sorties logiciel' : 'Sorties logiciel']:
        act.originalSorties,
      [total === true
        ? 'Total sorties après A-JUSTements'
        : 'Sorties A-JUSTées']: act.sorties,
      ['Stock logiciel']: act.originalStock,
      ['Stock après A-JUSTements']:
        act.stock !== null ? act.stock : act.originalStock,
    };
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
      };
    });
  }

  /**
   * Trier data par code import
   */
  sortByCodeImport(sumTab: any) {
    sumTab = orderBy(sumTab, ['codeUnit', 'codeCent'], ['asc']);
    sumTab.forEach(function (v: any) {
      delete v['codeUnit'];
      delete v['codeCent'];
      delete v['idReferentiel'];
    });
    return sumTab;
  }

  /**
   * Génère le nom du ficher téléchargé
   * @returns
   */
  getExportFileName() {
    return `Extraction_données_d_activité_${
      this.humanResourceService.hrBackup.getValue()?.label
    }_${this.getTotalPeriodeLabel(
      this.dateStart || new Date(),
      this.dateStop || new Date(),
      true
    )}_fait_le_${new Date().toJSON().slice(0, 10)}`;
  }

  /**
   * Génère un onglet excel
   * @param headers
   * @param data
   * @returns
   */
  generateWorkSheet(headers: any, data: any) {
    const worksheet = xlsx.utils.json_to_sheet(data, {});
    worksheet['!cols'] = this.getColumnWidth(headers, data);
    return worksheet;
  }

  /**
   * Get data from back-end
   * @returns
   */
  exportActDate() {
    // Start Sentry transaction for Activity Excel export (minimal footprint)
    const l = startLatencyScope('activity-export');
    this.appService.alert.next({
      text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
    });
    return this.serverService
      .post(`extractor/filter-list-act`, {
        backupId: this.humanResourceService.backupId.getValue(),
        dateStart: setTimeToMidDay(this.dateStart || this.today),
        dateStop: setTimeToMidDay(this.dateStop || this.today),
      })
      .then((data) => {
        this.data = data.data.list;
        this.sumTab = data.data.sumTab;
        let monthTabName = '';

        // FORMAT SUM TAB
        this.sumTab = this.sumTab
          .map((act: any) => {
            return this.generateFormatedDataMonth(
              act,
              this.getTotalPeriodeLabel(
                this.dateStart || new Date(),
                this.dateStop || new Date()
              ),
              true
            );
          })
          .filter(
            (r: any) =>
              this.referentielService.idsIndispo.indexOf(r.idReferentiel) ===
                -1 &&
              this.referentielService.idsSoutien.indexOf(r.idReferentiel) === -1
          );
        this.sumTab = this.sortByCodeImport(this.sumTab);

        const viewModel = { sumTab: this.sumTab, data: this.data };

        fetch('/assets/emptyTemplate_.xlsx')
          // 2. Get template as ArrayBuffer.
          .then((response) => response.arrayBuffer())
          // 3. Fill the template with data (generate a report).
          .then((buffer) => {
            return new Renderer().renderFromArrayBuffer(buffer, viewModel);
          })
          // 4. Prepare workbook and write buffer.
          .then(async (report) => {
            report = await this.getReport(report, viewModel);
            if (this.sumTab.length === 0) {
              alert(
                'Une erreur est survenue lors de la génération de votre fichier.'
              );
              throw 'no values';
            } else if (viewModel.data && viewModel.data.length > 49) {
              alert(
                'Vous ne pouvez pas extraire plus de 4 années sur une même extraction.'
              );
              throw 'no values';
            }
            return report.xlsx.writeBuffer();
          })
          // 5. Use `saveAs` to download on browser site.
          .then((buffer) => {
            const filename = this.getExportFileName();
            // Test-only: expose buffer to Cypress so it can salvage file even if saveAs is blocked
            exposeDownloadToCypress(buffer, filename + EXCEL_EXTENSION);
            FileSaver.saveAs(new Blob([buffer]), filename + EXCEL_EXTENSION);
            try { l.finish('success') } catch {}
            return;
          })
          .catch((err) => {
            console.log('Error writing excel export', err);
            try { l.finish('error') } catch {}
          });
      });
  }

  async getReport(report: any, viewModel: any) {
    report = this.setWidthForAllTabs(
      report,
      Object.keys(viewModel.data).length + 1
    );
    report = this.hideEmptyTabs(report, Object.keys(viewModel.data).length + 1);
    report.worksheets[0].name = 'Total sur la période ';
    report = this.setHeaderText(
      report,
      0,
      2,
      ' ' + this.lowercaseFirstLetter(this.sumTab[0]['Période']) || '',
      true
    );

    let conditionnalFormating = report.worksheets[0].conditionalFormattings;
    let views = report.worksheets[0].views;

    // FORMAT DATA TABS
    this.data = Object.keys(this.data).map((key: any, index) => {
      let monthTabName = '';
      this.data[key] = this.data[key]
        .map((act: any) => {
          report.worksheets[index + 1].conditionalFormattings =
            conditionnalFormating;

          report.worksheets[index + 1].views = views;

          report.worksheets[index + 1]._rows[0].height = 80;
          monthTabName = this.getMonthTabName(act);
          report.worksheets[index + 1].name = monthTabName;
          report = this.setHeaderText(
            report,
            index + 1,
            2,
            ' sur ' + monthTabName
          );
          return this.generateFormatedDataMonth(act, monthTabName);
        })
        .filter(
          (r: any) =>
            this.referentielService.idsIndispo.indexOf(r.idReferentiel) ===
              -1 &&
            this.referentielService.idsSoutien.indexOf(r.idReferentiel) === -1
        );

      this.data[key] = this.sortByCodeImport(this.data[key]);
      report = this.populateTab(report, this.data[key], index);
    });

    return report;
  }

  populateTab(report: any, data: any[], indexTab: number) {
    data.map((row: any, index: number) => {
      const columnLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

      columnLetters.forEach((col, colIndex) => {
        const keys = Object.keys(row);
        if (keys[colIndex])
          report.worksheets[indexTab + 1].getCell(`${col}${index + 3}`).value =
            row[keys[colIndex]];
      });
    });

    return report;
  }

  hideEmptyTabs(report: any, tabIndex: number) {
    let index = tabIndex;
    do {
      report.worksheets[index].state = 'hidden';
      index++;
    } while (index < 50);
    return report;
  }
  setHeaderText(
    report: any,
    tabIndex: number,
    headerIndex: number,
    sufix = '',
    sumTab = false
  ) {
    const headers = [
      'Période',
      'Contentieux',
      'Total entrées logiciel',
      'Total entrées après A-JUSTements',
      'Total sorties logiciel',
      'Total sorties après A-JUSTements',
      'Stock logiciel',
      'Stock après A-JUSTements',
    ];

    let tabTitle =
      (sumTab ? '                    ' : '     ') +
      "Extraction de données d'activité " +
      (this.userService.isTJ() ? ' du ' : ' de la ') +
      this.humanResourceService.hrBackup.getValue()?.label;
    report.worksheets[tabIndex].getCell('A1').value = tabTitle + sufix;

    report.worksheets[tabIndex]._rows[headerIndex - 1].height = 80;
    report.worksheets[tabIndex].autoFilter =
      'A' + headerIndex + ':H' + headerIndex;
    headers.map((elem, index) => {
      report.worksheets[tabIndex].getCell(
        this.getExcelColumnLetter(index) + headerIndex
      ).value = elem;
    });

    return report;
  }

  getExcelColumnLetter(index: number): string {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  }

  setTabName(report: any, name: string) {}

  setWidthForAllTabs(report: any, loopIndex: number, sumTab = true) {
    loopIndex--;
    do {
      let index = 0;
      report.worksheets[loopIndex].getCell('I' + 1).value = ''; // TO SET ALL PREVIOUS COL

      do {
        if (index === 0)
          report.worksheets[loopIndex].columns[index].width =
            loopIndex === 0 ? 25 : 15;
        else if (index === 1)
          report.worksheets[loopIndex].columns[index].width = 45;
        else report.worksheets[loopIndex].columns[index].width = 17.1;
        index++;
      } while (index < 8);

      loopIndex--;
    } while (loopIndex >= 0);

    return report;
  }

  lowercaseFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}
