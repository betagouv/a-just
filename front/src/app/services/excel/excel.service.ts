import { Injectable } from '@angular/core';
import { HumanResourceService } from '../human-resource/human-resource.service';
import { BehaviorSubject } from 'rxjs';
import { UserService } from '../user/user.service';
import * as FileSaver from 'file-saver';
import { ServerService } from '../http-server/server.service';
import { AppService } from '../app/app.service';
import { Renderer } from 'xlsx-renderer';
import { MainClass } from '../../libs/main-class';
import { HRCategoryInterface } from '../../interfaces/hr-category';
import { HRFonctionInterface } from '../../interfaces/hr-fonction';
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel';
import { setTimeToMidDay } from '../../utils/dates';

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
 * Service d'extraction excel
 */
@Injectable({
  providedIn: 'root',
})
export class ExcelService extends MainClass {
  /**
   * Categories selectionnées par l'utilisateur
   */
  categories: HRCategoryInterface[] = [];
  /**
   * Fonctions selectionnées par l'utilisateur
   */
  fonctions: HRFonctionInterface[] = [];
  /**
   * Liste des referentiels
   */
  allReferentiels: ContentieuReferentielInterface[] = [];
  /**
   * Date de début d'extraction
   */
  dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());
  /**
   * Date de fin d'extraction
   */
  dateStop: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());
  /**
   * Catégories à extraire
   */
  selectedCategory: BehaviorSubject<Array<string>> = new BehaviorSubject<
    Array<string>
  >(new Array());
  /**
   * En cours de chargement
   */
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  /**
   * Données d'extraction
   */
  data: Array<any> = [];
  /**
   * Taille des colonnes dans l'onglet 1 du fichier excel extrait
   */
  columnSize: Array<any> = [];
  /**
   * Taille des colonnes dans l'longlet 2 fichier excel extrait
   */
  columnSizeSecondTab: Array<any> = [];

  tabs: any = {
    onglet1: { values: null, columnSize: null },
    onglet2: { values: null, columnSize: null },
  };

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
    super();
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
        this.tabs = data.data;
        const viewModel = {
          ...this.tabs.viewModel,
          fonctions: data.data.fonctions,
          firstLink: {
            label: 'Consultez notre documentation en ligne ici.',
            url: 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/extraire-ses-donnees-deffectifs/le-fichier-excel-de-lextracteur-deffectifs',
          },
          secondLink: {
            label:
              'Pour une présentation de la méthodologie à suivre, consultez la documentation ici.',
            url: 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/extraire-ses-donnees-deffectifs/remplir-ses-tableaux-detpt-pour-les-ddg-en-quelques-minutes',
          },
          thirdLink: {
            label:
              'Pour une présentation détaillée de la méthodologie à suivre, consultez la documentation en ligne, disponible ici.',
            url: 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/extraire-ses-donnees-deffectifs/remplir-ses-tableaux-detpt-pour-les-ddg-en-quelques-minutes',
          },
          daydate: `- du ${new Date(
            this.dateStart.getValue()
          ).toLocaleDateString()} au ${new Date(
            this.dateStop.getValue()
          ).toLocaleDateString()}`,
        };
        fetch(
          this.userService.isCa() === false
            ? '/assets/template4.xlsx'
            : '/assets/template4CA.xlsx'
        )
          // 2. Get template as ArrayBuffer.
          .then((response) => response.arrayBuffer())
          // 3. Fill the template with data (generate a report).
          .then((buffer) => {
            return new Renderer().renderFromArrayBuffer(buffer, viewModel);
          })
          // 4. Get a report as buffer.
          .then(async (report) => {
            console.log(viewModel);
            report = await this.getReport(report, viewModel);
            if (this.tabs.onglet1.values.length === 0) {
              alert(
                'Une erreur est survenue lors de la génération de votre fichier.'
              );
              throw 'no values';
            }
            return report.xlsx.writeBuffer();
          })
          // 5. Use `saveAs` to download on browser site.
          .then((buffer) => {
            const filename = this.getFileName();
            this.isLoading.next(false);
            return FileSaver.saveAs(
              new Blob([buffer]),
              filename + EXCEL_EXTENSION
            );
          })
          .catch((err) => console.log('Error writing excel export', err));
      });
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
      .slice(0, 10)}`;
  }

  /**
   * Creation d'un worksheet excel
   * @param file
   */
  modifyExcel(file: any) {
    import('xlsx').then(async (xlsx) => {
      const data = await file.arrayBuffer();
      let wb = xlsx.read(data);
      const worksheet = xlsx.utils.json_to_sheet(this.data, {});

      wb.Sheets[wb.SheetNames[0]] = worksheet;

      const excelBuffer: any = xlsx.write(wb, {
        bookType: 'xlsx',
        type: 'array',
      });
      const filename = this.getFileName();
      const datas: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE });
      this.appService.alert.next({
        text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
      });
      FileSaver.saveAs(datas, filename + EXCEL_EXTENSION);
    });
  }

  /**
   * Formate Excel juridiction list
   * @param viewModel
   */
  async formatListTpx(viewModel: any) {
    return [
      '"' +
        (await [...viewModel.tpxlist, ...viewModel.isolatedCPH]
          .join(',')
          .replaceAll("'", "'")
          .replaceAll('(', '')
          .replaceAll(')', '')) +
        '"',
    ];
  }

  /**
   * Mise en forme du ficher DDG
   * @param report
   * @param viewModel
   * @returns
   */
  async getReport(report: any, viewModel: any) {
    const tpxlistExcel = await this.formatListTpx(viewModel);

    // JURIDICTION PICKER
    if (this.userService.isTJ()) {
      // DDG TJ
      report.worksheets[10].getCell('D' + +5).value =
        viewModel.tgilist[0] || viewModel.uniqueJur[0];
      // DDG TPROX
      report.worksheets[11].getCell('D' + +5).value =
        viewModel.tpxlist[0] || '';
      report.worksheets[11].getCell('D' + +5).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: tpxlistExcel,
        error: 'Veuillez selectionner une valeur dans le menu déroulant',
        prompt: viewModel.tpxlist.length
          ? 'Selectionner un TPROX'
          : "Aucun TPROX n'est disponible pour cette juridiction",
        showErrorMessage: true,
        showInputMessage: true,
      };
      // DDG CPH
      report.worksheets[12].getCell('D' + +5).value =
        viewModel.uniqueJur[0] || '';
      report.worksheets[12].getCell('D' + +5).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: viewModel.tProximite,
        error: 'Veuillez selectionner une valeur dans le menu déroulant',
        prompt: 'Selectionner une juridiction',
        showErrorMessage: true,
        showInputMessage: true,
      };
    }

    // ONGLET ETPT DDG
    report.worksheets[2].columns = [...this.tabs.onglet2.columnSize];
    report.worksheets[2].columns[0].width = 16;
    report.worksheets[2].columns[8].width = 0;
    this.tabs.onglet2.values.forEach((element: any, index: number) => {
      const indexCell = +(+index + 3);

      // TJ
      if (this.userService.isTJ()) {
        // FONCTION RECODEE ONGLET DDG => AUTOMATISER PLUS TARD
        report.worksheets[2].getCell('FA' + (+index + 3)).value = {
          formula:
            '=IF(H' +
            indexCell +
            '="","",IF(H' +
            indexCell +
            '="CONT A JP",IF(G' +
            indexCell +
            '="Autour du magistrat","CONT A JP Autour du Juge","CONT A JP Greffe"),VLOOKUP(H' +
            indexCell +
            ',Table_Fonctions!C:F,4,FALSE)))',
          result: '0',
        };

        // FONCTION AGREGAT ONGLET DDG => AUTOMATISER PLUS TARD
        report.worksheets[2].getCell('FB' + (+index + 3)).value = {
          formula:
            '=IFERROR(VLOOKUP(H' +
            indexCell +
            ',Table_Fonctions!C:E,3,FALSE),I' +
            indexCell +
            ')',
          result: '',
        };

        // TEMPS VENTILE CIVILS ET SOCIAUX ONGLET DDG
        report.worksheets[2].getCell(
          this.getExcelFormulaFormat(
            ['Temps ventilés sur la période (contentieux civils et sociaux)'],
            indexCell,
            viewModel.days1
          )
        ).value = {
          formula:
            '=IFERROR(SUM(' +
            this.getExcelFormulaFormat(
              ['1. ', '2. ', '3. ', '4. ', '5. ', '6.1. '],
              indexCell,
              viewModel.days1
            ) +
            '),"")',
          result: '0',
        };

        // PENAL ONGLET DDG
        report.worksheets[2].getCell(
          this.getExcelFormulaFormat(
            ['Temps ventilés sur la période (affaires pénales)'],
            indexCell,
            viewModel.days1
          )
        ).value = {
          formula:
            '=IF(H' +
            indexCell +
            '="","",SUM(' +
            this.getExcelFormulaFormat(
              ['6.2. ', '7. ', '8. ', '9. ', '10. '],
              indexCell,
              viewModel.days1
            ) +
            '))',
          result: '0',
        };

        // VERIF ABS ONGLET DDG
        report.worksheets[2].getCell(
          this.getExcelFormulaFormat(
            [
              'Vérif adéquation "temps ventilé sur la période" et somme (temps ventilés civils + pénals + autres activités + indisponibilité)',
            ],
            indexCell,
            viewModel.days1
          )
        ).value = {
          formula:
            '=IF(H' +
            indexCell +
            '="","",IF(' +
            this.getExcelFormulaFormat(
              [
                'Temps ventilés sur la période (contentieux civils et sociaux)',
                'Temps ventilés sur la période (affaires pénales)',
                '11. TOTAL AUTRES ACTIVITÉS',
                "12. TOTAL des INDISPONIBILITÉS relevant de l'action 99",
              ],
              indexCell,
              viewModel.days1,
              '+'
            ) +
            '=' +
            this.getExcelFormulaFormat(
              ['Temps ventilés sur la période'],
              indexCell,
              viewModel.days1
            ) +
            ',"OK","OK (contient de l action 99)"))',
          result: '0',
        };

        // TEMPS VENTILE DONT INDISPO ONGLET DDG
        let tmpIncludingIndispo = this.getExcelFormulaFormat(
          [
            'Temps ventilés sur la période',
            "12. TOTAL des INDISPONIBILITÉS relevant de l'action 99",
          ],
          indexCell,
          viewModel.days1,
          '+'
        );
        report.worksheets[2].getCell(
          this.getExcelFormulaFormat(
            ['Temps ventilé sur la période (y.c. indisponibilité)'],
            indexCell,
            viewModel.days1
          )
        ).value = {
          formula:
            '=IF(ISERROR(' +
            tmpIncludingIndispo +
            '),"",' +
            tmpIncludingIndispo +
            ')',
          result: '0',
        };

        // ECART JE ONGLET DDG
        report.worksheets[2].getCell(
          this.getExcelFormulaFormat(
            ['Ecart JE → détails manquants, à rajouter dans A-JUST'],
            indexCell,
            viewModel.days1
          )
        ).value = {
          formula:
            '=ROUND(' +
            this.getExcelFormulaFormat(
              ['6. TOTAL JUGES DES ENFANTS'],
              indexCell,
              viewModel.days1
            ) +
            '-(' +
            this.getExcelFormulaFormat(
              ['6.1. ACTIVITÉ CIVILE', '6.2. ACTIVITÉ PÉNALE'],
              indexCell,
              viewModel.days1,
              '+'
            ) +
            '),3)',
        };
        // ECART JI ONGLET DDG
        report.worksheets[2].getCell(
          this.getExcelFormulaFormat(
            ['Ecart JI → détails manquants, à rajouter dans A-JUST'],
            indexCell,
            viewModel.days1
          )
        ).value = {
          formula:
            '=ROUND(' +
            this.getExcelFormulaFormat(
              ["8. TOTAL JUGES D'INSTRUCTION"],
              indexCell,
              viewModel.days1
            ) +
            '-(' +
            this.getExcelFormulaFormat(
              [
                '8.1. SERVICE GÉNÉRAL',
                '8.11. ECO-FI HORS JIRS',
                '8.2. JIRS ÉCO-FI',
                '8.3. JIRS CRIM-ORG',
                '8.4. AUTRES SECTIONS SPÉCIALISÉES',
              ],
              indexCell,
              viewModel.days1,
              '+'
            ) +
            '),3)',
        };
      }

      if (this.userService.isCa()) {
        // FONCTION RECODEE ONGLET DDG => AUTOMATISER PLUS TARD
        report.worksheets[2].getCell('FA' + (+index + 3)).value = {
          formula:
            '=IF(H' +
            indexCell +
            '="","",VLOOKUP(H' +
            indexCell +
            ',Table_Fonctions!C:F,4,FALSE))',
          result: '0',
        };

        // FONCTION AGREGAT ONGLET DDG => AUTOMATISER PLUS TARD
        report.worksheets[2].getCell('FB' + (+index + 3)).value = {
          formula:
            '=IFERROR(VLOOKUP(H' +
            indexCell +
            ',Table_Fonctions!C:E,3,FALSE),I' +
            indexCell +
            ')',
          result: '',
        };

        // SOCIAUX CIVILS ET COMMERCIAUX  ONGLET DDG
        report.worksheets[2].getCell(
          this.getExcelFormulaFormat(
            [
              'Temps ventilés sur la période (contentieux sociaux civils et commerciaux)',
            ],
            indexCell,
            viewModel.days1
          )
        ).value = {
          formula:
            '=IFERROR(SUM(Q' +
            indexCell +
            ',V' +
            indexCell +
            ',AF' +
            indexCell +
            ',AK' +
            indexCell +
            ',AS' +
            indexCell +
            ',BO' +
            indexCell +
            ',BD' +
            indexCell +
            '),"")',
          result: '0',
        };
        // PENAL  ONGLET DDG
        report.worksheets[2].getCell(
          this.getExcelFormulaFormat(
            ['Temps ventilés sur la période (service pénal)'],
            indexCell,
            viewModel.days1
          )
        ).value = {
          formula:
            '=IF(H' +
            indexCell +
            '="","",SUM(BP' +
            indexCell +
            ',BQ' +
            indexCell +
            ',CA' +
            indexCell +
            ',CL' +
            indexCell +
            ',CR' +
            indexCell +
            '))',
          result: '0',
        };

        // Ventillation hors indispo  ONGLET DDG
        report.worksheets[2].getCell(
          this.getExcelFormulaFormat(
            ['Temps ventilés sur la période (hors indisponibilité)'],
            indexCell,
            viewModel.days1
          )
        ).value = {
          formula:
            '=IF(H' +
            indexCell +
            '="","",SUM(' +
            this.getExcelFormulaFormat(
              [
                'Temps ventilés sur la période (contentieux sociaux civils et commerciaux)',
                'Temps ventilés sur la période (service pénal)',
                '13. TOTAL AUTRES ACTIVITÉS',
              ],
              indexCell,
              viewModel.days1
            ) +
            '))',
          result: '0',
        };

        // Ventillation comprenant indispo  ONGLET DDG
        report.worksheets[2].getCell(
          this.getExcelFormulaFormat(
            ['Temps ventilés sur la période (y.c. indisponibilité)'],
            indexCell,
            viewModel.days1
          )
        ).value = {
          formula:
            '=IF(H' +
            indexCell +
            '="","",SUM(' +
            this.getExcelFormulaFormat(
              [
                'Temps ventilés sur la période (contentieux sociaux civils et commerciaux)',
                'Temps ventilés sur la période (service pénal)',
                '13. TOTAL AUTRES ACTIVITÉS',
                "14. TOTAL des INDISPONIBILITÉS relevant de l'action 99",
              ],
              indexCell,
              viewModel.days1,
              '+'
            ) +
            '))',
          result: '0',
        };

        // Soutien  ONGLET DDG
        report.worksheets[2].getCell(
          this.getExcelFormulaFormat(
            ['Soutien (Hors accueil du justiciable)'],
            indexCell,
            viewModel.days1
          )
        ).value = {
          formula:
            '=IF(H' +
            indexCell +
            '="","",SUM(' +
            this.getExcelFormulaFormat(
              [
                '13.1. SOUTIEN (AUTRES)',
                '13.2. FORMATIONS SUIVIES',
                '13.5. EXPERTISES (SUIVI ET LISTES)',
                '13.6. MÉDIATION / CONCILIATION (SUIVI ET LISTES)',
                '13.11. ACTIVITÉS EXTÉRIEURES ET PARTENARIATS',
                '13.12. ÉQUIPEMENT',
                '13.13. COMMUNICATION',
                '13.14. POLITIQUE ASSOCIATIVE ET AIDE AUX VICTIMES',
                '13.15. AUTRES ACTIVITÉS NON JURIDICTIONNELLES',
              ],
              indexCell,
              viewModel.days1
            ) +
            '))',
          result: '0',
        };

        // ECART CTX MINEURS  ONGLET DDG
        report.worksheets[2].getCell(
          this.getExcelFormulaFormat(
            ['Ecart CTX MINEURS → détails manquants, à rajouter dans A-JUST'],
            indexCell,
            viewModel.days1
          )
        ).value = {
          formula:
            '=ROUND(BN' +
            indexCell +
            '-(BO' +
            indexCell +
            '+BP' +
            indexCell +
            '),3)',
        };
        report.worksheets[2].columns[15].width = 0;
      }

      // CHOIX juridiction TPRX TJ onglet ETPT DDG
      report.worksheets[2].getCell('C' + (+index + 3)).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: viewModel.tProximite,
        error: 'Veuillez selectionner une valeur dans le menu déroulant',
        showErrorMessage: true,
        showInputMessage: true,
      };

      // CHOIX PLACE ADD OU SUB ONGLET DDG
      // Data validation pour menus déroulants
      const fonctionCellToCheck =
        (report.worksheets[2].getCell('H' + (+index + 3)).value! as string) ||
        '';

      if (
        fonctionCellToCheck.includes('PLACÉ') ||
        (this.userService.isCa() &&
          (fonctionCellToCheck === 'VPP' || fonctionCellToCheck === 'JP'))
      ) {
        report.worksheets[2].getCell('H' + (+index + 3)).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [
            `"${
              report.worksheets[2].getCell('H' + (+index + 3)).value
            } ADDITIONNEL,${
              report.worksheets[2].getCell('H' + (+index + 3)).value
            } SUBSTITUTION"`,
          ],
        };
        report.worksheets[2].getCell('H' + (+index + 3)).value = `${
          report.worksheets[2].getCell('H' + (+index + 3)).value
        } ADDITIONNEL`;
      }

      // CHOIX JA ONGLET DDG
      if (report.worksheets[2].getCell('H' + (+index + 3)).value === 'JA') {
        report.worksheets[2].getCell('H' + (+index + 3)).value =
          'JA Siège autres';
        report.worksheets[2].getCell('H' + (+index + 3)).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: this.userService.isCa()
            ? ['"JA Chambres Sociales,JA Siège autres,JA Parquet Général"']
            : ['"JA Siège autres,JA Pôle Social,JA Parquet,JA JP,JA VIF"'],
        };
      }
    });
    // FIN FOREACH

    if (this.userService.isCa() === true) {
      report.worksheets[7].getCell('D' + +5).value =
        viewModel.tgilist[0] || viewModel.uniqueJur[0];
      report.worksheets[8].getCell('D' + +5).value =
        viewModel.tgilist[0] || viewModel.uniqueJur[0];
    }

    //ONGLET ETPT AJUST
    report.worksheets[1].columns = [...this.tabs.onglet1.columnSize];
    report.worksheets[1].columns[0].width = 16;

    // ONGLET AGREGAT
    report.worksheets[3].columns[0].width = 20;
    report.worksheets[3].getCell('A' + +3).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: viewModel.tProximite,
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      prompt:
        'Selectionner une juridiction pour mettre à jour le tableau de synthèse ci-après',
      showErrorMessage: true,
      showInputMessage: true,
    };

    // ONGLET AGGREGAT MESSAGE SI ECART
    report.worksheets[3]['_rows'][6].height = 30;
    report.worksheets[3].getCell('F7').value = {
      formula:
        "=IF(OR('Agrégats DDG'!L6<>'Agrégats DDG'!L7,'Agrégats DDG'!S6<>'Agrégats DDG'!S7,'Agrégats DDG'!U6<>'Agrégats DDG'!U7),CONCATENATE(\"Temps ventilés sur la période :\",CHAR(10),\"ℹ️ Des ventilations sont incomplètes, se référer à la colonne N de l’onglet ETPT format DDG\"),\"Temps ventilés sur la période\")",
      result:
        '"Temps ventilés sur la période : Des ventilations sont incomplètes,",CHAR(10),"se référer à la colonne N de l’onglet ETPT format DDG"',
    };

    if (viewModel.arrondissement === "TJ LES SABLES D'OLONNE") {
      viewModel.tProximite = viewModel.tProximite.map((value: string) => {
        if (value.includes('DOLONNE')) return value.replaceAll('DOL', "D'OL");
        return value;
      });
    }

    return report;
  }

  /**
   * Génère un model de donnée de référentiel
   * @returns
   */
  generateModel() {
    const referentiels =
      this.humanResourceService.contentieuxReferentielOnly.getValue();

    let referentiel = new Array();
    let counter = 0;
    let sumLists = new Array();

    referentiels.map((r) => {
      if (r.childrens && r.childrens.length > 0) {
        r.childrens?.map((c) => {
          counter++;
          referentiel.push({
            code: c['code_import'],
            label: c.label,
            parent: this.userService.isCa()
              ? this.referentielCAMappingName(r.label)
              : this.referentielMappingName(r.label),
            index: null,
            sum: null,
          });
          sumLists.push('E' + (counter + 8));
        });
      }
      counter++;
      referentiel.push({
        code: r['code_import'],
        label: '',
        parent: 'TOTAL ' + r.label,
        index: 'E' + (counter + 8),
        sum: sumLists,
      });
      sumLists = new Array();
    });

    return referentiel;
  }

  /**
   * Génération d'un template de fiche agent
   */
  async generateAgentFile() {
    let referentiel = this.generateModel();
    const viewModel = {
      referentiel,
    };

    fetch('/assets/Feuille_de_temps_Modèle.xlsx')
      // 2. Get template as ArrayBuffer.
      .then((response) => response.arrayBuffer())
      // 3. Fill the template with data (generate a report).
      .then((buffer) => {
        return new Renderer().renderFromArrayBuffer(buffer, viewModel);
      })
      // 4. Get a report as buffer.
      .then(async (report) => {
        report = await this.setStyleXls(report, viewModel);
        return report.xlsx.writeBuffer();
      })
      // 5. Use `saveAs` to download on browser site.
      .then((buffer) => {
        const filename = 'Feuille_de_temps_Modèle';
        return FileSaver.saveAs(new Blob([buffer]), filename + EXCEL_EXTENSION);
      })
      .catch((err) => console.log('Error writing excel export', err));
  }

  /**
   * Set fiche agent template style
   * @param report
   * @param viewModel
   * @returns
   */
  async setStyleXls(report: any, viewModel: any) {
    const MAG = 'Magistrat';
    const GREFFE = 'Greffe';
    const ADM = 'Autour du magistrat';

    // category picker
    report.worksheets[0].getCell('C2').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"MAGISTRAT,GREFFE,AUTOUR DU MAGISTRAT"'],
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      showErrorMessage: true,
      showInputMessage: true,
    };
    // time picker
    report.worksheets[0].getCell('C5').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Temps plein, Temps partiel"'],
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      showErrorMessage: true,
      showInputMessage: true,
    };

    // functions by category
    const findCategoryMag =
      this.humanResourceService.categories
        .getValue()
        .find((c: HRCategoryInterface) => c.label === MAG) || null;
    const findCategoryGreffe =
      this.humanResourceService.categories
        .getValue()
        .find((c: HRCategoryInterface) => c.label === GREFFE) || null;
    const findCategoryAdm =
      this.humanResourceService.categories
        .getValue()
        .find((c: HRCategoryInterface) => c.label === ADM) || null;

    const fonctionsMag = this.humanResourceService.fonctions
      .getValue()
      .filter((v) => v.categoryId === findCategoryMag?.id);
    const fonctionsGreffe = this.humanResourceService.fonctions
      .getValue()
      .filter((v) => v.categoryId === findCategoryGreffe?.id);
    const fonctionsAdm = this.humanResourceService.fonctions
      .getValue()
      .filter((v) => v.categoryId === findCategoryAdm?.id);

    let lineIndex = 0;
    for (let i = 0; i < fonctionsMag.length; i++) {
      if (fonctionsMag[i].label) lineIndex++;
      report.worksheets[1].getCell('A' + lineIndex).value =
        fonctionsMag[i].label.toUpperCase();
    }
    lineIndex = 0;
    for (let i = 0; i < fonctionsGreffe.length; i++) {
      if (fonctionsGreffe[i].label) lineIndex++;
      report.worksheets[1].getCell('B' + lineIndex).value =
        fonctionsGreffe[i].label.toUpperCase();
    }
    lineIndex = 0;
    for (let i = 0; i < fonctionsAdm.length; i++) {
      if (fonctionsAdm[i].label) lineIndex++;
      report.worksheets[1].getCell('C' + lineIndex).value =
        fonctionsAdm[i].label.toUpperCase();
    }

    let globalSum = new Array();

    // sum by parent
    viewModel.referentiel.map((r: any) => {
      if (r.sum !== null) {
        if (r.sum.length > 0)
          report.worksheets[0].getCell(r.index).value = {
            formula: '=SUM(' + r.sum.join(',') + ')',
            result: '0',
          };
        globalSum.push(r.index);
      }
    });

    // total sum
    report.worksheets[0].getCell('E7').value = {
      formula: '=SUM(' + globalSum.join(',') + ')/100',
      result: '0',
    };

    return report;
  }

  numberToExcelColumn(num: number): string {
    if (num <= 0) {
      throw new Error('Le nombre doit être supérieur à 0.');
    }
    let column = '';
    while (num > 0) {
      const remainder = (num - 1) % 26;
      column = String.fromCharCode(65 + remainder) + column;
      num = Math.floor((num - 1) / 26);
    }
    return column;
  }

  findIndexByPrefix(array: string[], prefix: string): number {
    for (let i = 0; i < array.length; i++) {
      if (array[i].startsWith(prefix)) {
        return i;
      }
    }
    return -1;
  }

  getExcelFormulaFormat(
    array: string[],
    index: number,
    referentiel: string[],
    separator = ','
  ) {
    let str = '';
    for (let i = 0; i < array.length; i++) {
      let value = this.numberToExcelColumn(
        this.findIndexByPrefix(referentiel, array[i]) + 1
      );
      if (value && value.length) str += value + index + separator;
    }
    return this.removeLastSeparator(str, separator);
  }

  removeLastSeparator(input: string, separator = ','): string {
    if (input.endsWith(separator)) {
      return input.slice(0, -1);
    }
    return input;
  }
}
