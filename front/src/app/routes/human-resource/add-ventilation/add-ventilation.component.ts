import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { sumBy } from 'lodash';
import * as xlsx from 'xlsx';
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel';
import { CommonModule } from '@angular/common';
import { PopupComponent } from '../../../components/popup/popup.component';
import { CalculatriceComponent } from '../../../components/calculatrice/calculatrice.component';
import { PanelActivitiesComponent } from '../../../components/panel-activities/panel-activities.component';
import { MainClass } from '../../../libs/main-class';
import { HumanResourceInterface } from '../../../interfaces/human-resource-interface';
import { RHActivityInterface } from '../../../interfaces/rh-activity';
import { HRCategoryInterface } from '../../../interfaces/hr-category';
import { HRFonctionInterface } from '../../../interfaces/hr-fonction';
import { HRFonctionService } from '../../../services/hr-fonction/hr-function.service';
import { HRCategoryService } from '../../../services/hr-category/hr-category.service';
import { HumanResourceService } from '../../../services/human-resource/human-resource.service';
import { AppService } from '../../../services/app/app.service';
import { CalculatriceService } from '../../../services/calculatrice/calculatrice.service';
import { ServerService } from '../../../services/http-server/server.service';
import { UserService } from '../../../services/user/user.service';
import { fixDecimal } from '../../../utils/numbers';
import {
  CALCULATE_DOWNLOAD_URL,
  DOCUMENTATION_VENTILATEUR_PERSON,
  IMPORT_ETP_TEMPLATE,
  IMPORT_ETP_TEMPLATE_CA,
} from '../../../constants/documentation';
import {
  findRealValueCustom,
  isDateBiggerThan,
  today,
} from '../../../utils/dates';
import { MatIconModule } from '@angular/material/icon';
import { DateSelectComponent } from '../../../components/date-select/date-select.component';
import { HelpButtonComponent } from '../../../components/help-button/help-button.component';

export interface importedVentillation {
  referentiel: ContentieuReferentielInterface;
  percent: number | undefined;
  parentReferentiel: ContentieuReferentielInterface | null;
}

export interface importedSituation {
  index: number | null;
  ventillation: importedVentillation[];
}

/**
 * Panneau pour ajouter / modifier une situation
 * indispos, etp, category, fonction, date début
 */

@Component({
  selector: 'add-ventilation',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    PopupComponent,
    CalculatriceComponent,
    PanelActivitiesComponent,
    MatIconModule,
    ReactiveFormsModule,
    DateSelectComponent,
    HelpButtonComponent,
  ],
  templateUrl: './add-ventilation.component.html',
  styleUrls: ['./add-ventilation.component.scss'],
})
export class AddVentilationComponent extends MainClass implements OnChanges {
  /**
   * Fiche
   */
  @Input() human: HumanResourceInterface | null = null;
  /**
   * Liste de toutes les indispo d'une fiche
   */
  @Input() indisponibilities: RHActivityInterface[] = [];
  /**
   * Liste des ventilations en court de modification
   */
  @Input() activities: RHActivityInterface[] = [];
  /**
   * Date de début de la situation
   */
  @Input() lastDateStart: Date | null = null;
  /**
   * Date de fin estimé de la situation
   */
  @Input() dateStop: Date | null = null;
  /**
   * Indispo en erreur si doublon d'indispo
   */
  @Input() indisponibilityError: string | null = null;
  /**
   * Active les boutons de sauvegarde
   */
  @Input() saveActions: boolean = false;
  /**
   * Modification / Création d'une situation
   */
  @Input() isEdit: boolean = false;
  /**
   * Id de situation
   */
  @Input() editId: number | null = null;
  /**
   * Parent form
   */
  @Input() basicData: FormGroup | null = null;
  /**
   * Force to show sub contentieux
   */
  @Input() forceToShowContentieuxDetail: boolean = false;
  /**
   * Indice de la situation édité
   */
  @Input() indexSituation: number | null = null;
  /**
   * Event lors de la sauvegarde
   */
  @Output() onSaveConfirm = new EventEmitter();
  /**
   * Event lors de la demande d'ajout d'une indispo
   */
  @Output() addIndispiniblity = new EventEmitter();
  /**
   * Event fermeture du paneau
   */
  @Output() close = new EventEmitter();
  /**
   * Event pour ouvrir le paneau d'aide
   */
  @Output() onOpenHelpPanel = new EventEmitter();
  /**
   * Réferentiel des indispo
   */
  allIndisponibilityReferentiel: ContentieuReferentielInterface[] = [];
  /**
   * Liste des catégories (magistrat, greffier...)
   */
  categories: HRCategoryInterface[] = [];
  /**
   * Liste des fonctions (1VP, VP, ...)
   */
  fonctions: HRFonctionInterface[] = [];
  /**
   * Referentiel avec les activités
   */
  updatedReferentiels: ContentieuReferentielInterface[] = [];
  /**
   * ETP
   */
  etp: number = 1;
  /**
   * Formulaire de saisie
   */
  form = new FormGroup({
    activitiesStartDate: new FormControl(new Date(), [Validators.required]),
    etp: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(1),
    ]),
    fonctionId: new FormControl<number | null>(null, [Validators.required]),
    categoryId: new FormControl<number | null>(null, [Validators.required]),
  });
  /**
   * Activation de la calculatrice
   */
  calculatriceIsActive: boolean = false;
  /**
   * Ouverture de la calculatrice
   */
  openCalculatricePopup: boolean = false;
  /**
   * Affichage du menu déroulant
   */
  toggleDropDown: boolean = false;
  /**
   * Fonction importée
   */
  importedFunction: number | null = null;
  /**
   * Import de fichié effectué
   */
  displayImportLabels = false;
  /**
   * Somme des valeurs importés
   */
  sumPercentImported = 0;
  /**
   * Liste des indispo courrante
   */
  indisponibilitiesFiltered: RHActivityInterface[] = [];

  /**
   * Constructeur
   * @param hrFonctionService
   * @param hrCategoryService
   * @param humanResourceService
   * @param appService
   */
  constructor(
    private hrFonctionService: HRFonctionService,
    private hrCategoryService: HRCategoryService,
    private humanResourceService: HumanResourceService,
    private appService: AppService,
    private calculatriceService: CalculatriceService,
    private serverService: ServerService,
    private userService: UserService
  ) {
    super();
  }

  /**
   * Au chargement charger les catégories et fonctions
   */
  ngOnInit() {
    window.addEventListener('click', this.onclick.bind(this));
    window.addEventListener('click', this.onclick2.bind(this));
    this.watch(
      this.hrFonctionService.getAll().then(() => this.loadCategories())
    );
    this.watch(
      this.hrCategoryService.getAll().then((list) => (this.categories = list))
    );
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(
        () =>
          (this.allIndisponibilityReferentiel =
            this.humanResourceService.allIndisponibilityReferentiel.slice(1))
      )
    );
    this.watch(
      this.form.get('categoryId')?.valueChanges.subscribe(() => {
        this.loadCategories().then(() => {
          let fct = null;
          if (this.displayImportLabels) {
            fct = this.fonctions.find((c) => c.id === this.importedFunction);
          } else {
            fct = this.fonctions[0];
          }
          this.form.get('fonctionId')?.setValue(fct?.id || null);
          if (fct)
            this.calculatriceIsActive = fct.calculatrice_is_active || false;
        });
      })
    );

    this.watch(
      this.form.get('etp')?.valueChanges.subscribe((value) => {
        if (value) {
          if (value > 1) value = 1;
          else if (value < 0) value = 0;
          let str_value = value?.toString();
          let validationPattern = /^\d+(\.\d{0,2})?$/;

          if (!validationPattern.test(str_value)) {
            value = this.parseFloat(
              str_value.substring(0, str_value.length - 1)
            );
          }
          this.form.get('etp')?.setValue(value, { emitEvent: false });
        }
      })
    );
  }

  /**
   * Initilisation lors du changement de la date
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['lastDateStart'] && changes['lastDateStart'].firstChange) {
      this.onStart();
    }
    if (changes['indisponibilities']) {
      this.indisponibilitiesFiltered = [
        ...this.indisponibilities.filter((i) => i.id < 0),
        ...this.isBiggerThanArray(
          this.indisponibilities.filter((i) => i.id >= 0),
          'dateStop'
        ),
      ];
    }
  }

  /**
   * Initialisation du formulaire
   */
  onStart() {
    const situation = this.humanResourceService.findSituation(
      this.human,
      this.lastDateStart ? this.lastDateStart : undefined
    );

    let etp = (situation && situation.etp) || 0;
    if (etp === this.ETP_NEED_TO_BE_UPDATED) {
      etp = 0;
    }
    this.etp = etp;
    this.form
      .get('activitiesStartDate')
      ?.setValue(this.lastDateStart ? new Date(this.lastDateStart) : null);
    this.form.get('etp')?.setValue(fixDecimal(etp));
    this.form
      .get('categoryId')
      ?.setValue(
        (situation && situation.category && situation.category.id) || null
      );

    this.form
      .get('fonctionId')
      ?.setValue(
        (situation && situation.fonction && situation.fonction.id) || null
      );

    const fonctions = this.humanResourceService.fonctions.getValue();
    const fonct = fonctions.find(
      (c) => c.id == this.form.get('fonctionId')?.value,
      this.form.get('categoryId')?.value
    );
    if (fonct)
      this.calculatriceIsActive = fonct.calculatrice_is_active || false;

    this.loadCategories();
  }

  /**
   * Destruction des observables
   */
  ngOnDestroy(): void {
    this.watcherDestroy();
  }

  /**
   * Filtre des fonctions en fonction des categories
   */
  async loadCategories() {
    if (this.form.value) {
      const foncts = (await this.hrFonctionService.getAll()).filter(
        (c) => this.form.value?.categoryId == c.categoryId
      );

      if (JSON.stringify(foncts) !== JSON.stringify(this.fonctions)) {
        this.fonctions = foncts;
      }
    }
  }

  /**
   * Control du formulaire lors de la sauvegarde
   * @returns
   */
  async onSave(withoutPercentControl = false) {
    if (this.indisponibilityError) {
      alert(this.indisponibilityError);
      return;
    }

    if (!withoutPercentControl) {
      const totalAffected = fixDecimal(
        sumBy(this.updatedReferentiels, 'percent')
      );
      if (totalAffected > 100) {
        this.appService.alert.next({
          title: 'Attention',
          text: `Avec les autres affectations, vous avez atteint un total de ${totalAffected}% de ventilation ! Vous ne pouvez passer au dessus de 100%.`,
        });
        return;
      } else if (totalAffected < 100) {
        this.appService.alert.next({
          title: 'Attention',
          text: `Cet agent n’est affecté qu'à ${totalAffected} %, ce qui signifie qu’il a encore du temps de travail disponible. Même en cas de temps partiel, l’ensemble de ses activités doit constituer 100% de son temps de travail.<br/><br/>Il est également essentiel que, même lorsque l’agent est totalement indisponible (en cas de congé maladie ou maternité/paternité/adoption par exemple), il soit affecté aux activités qu’il aurait eu à traiter s’il avait été présent.<br/><br/>Pour en savoir plus, <a href="${DOCUMENTATION_VENTILATEUR_PERSON}" target="_blank" rel="noreferrer">cliquez ici</a>`,
          callback: () => {
            this.onSave(true);
          },
        });
        return;
      }
    }

    let { activitiesStartDate, categoryId, fonctionId } = this.form.value;

    if (
      this.basicData!.controls['lastName'].value === '' ||
      this.basicData!.controls['lastName'].value === 'Nom'
    ) {
      alert('Vous devez saisir un nom pour valider la création !');
      return;
    }
    if (
      this.basicData!.controls['firstName'].value === '' ||
      this.basicData!.controls['firstName'].value === 'Prénom'
    ) {
      alert('Vous devez saisir un prénom pour valider la création !');
      return;
    }

    if (!activitiesStartDate) {
      alert('Vous devez saisir une date de début de situation !');
      return;
    }

    if (!(this.human && this.human.dateStart)) {
      alert("Vous devez saisir une date d'arrivée !");
      return;
    }
    activitiesStartDate = today(activitiesStartDate);
    if (this.human && this.human.dateEnd && activitiesStartDate) {
      const dateEnd = new Date(this.human.dateEnd);

      // check activity date
      if (activitiesStartDate.getTime() > dateEnd.getTime()) {
        alert(
          'Vous ne pouvez pas saisir une situation postérieure à la date de départ !'
        );
        return;
      }
    }

    if (this.human && this.human.dateStart && activitiesStartDate) {
      const dateStart = today(this.human.dateStart);

      // check activity date
      if (activitiesStartDate.getTime() < dateStart.getTime()) {
        alert(
          "Vous ne pouvez pas saisir une situation antérieure à la date d'arrivée !"
        );
        return;
      }
    }

    const categories = this.humanResourceService.categories.getValue();
    const fonctions = this.humanResourceService.fonctions.getValue();
    const cat = categories.find((c) => categoryId && c.id == categoryId);
    const fonct = fonctions.find((c) => c.id == fonctionId);

    if (!cat) {
      alert('Vous devez saisir une catégorie !');
      return;
    }

    if (!fonct) {
      alert('Vous devez saisir une fonction !');
      return;
    }

    if (
      fonct.minDateAvalaible &&
      !isDateBiggerThan(
        today(activitiesStartDate),
        today(fonct.minDateAvalaible)
      )
    ) {
      alert(
        `Date de début de situation à corriger ! La fonction ${
          fonct.label
        } n’entre en vigueur qu’à compter du ${findRealValueCustom(
          fonct.minDateAvalaible,
          false
        )}.`
      );
      return;
    }

    console.log(this.form.get('etp'));
    if (this.form.get('etp')?.value === null) {
      alert(
        'Vous devez saisir un temps de travail pour valider la création de cette fiche !'
      );
      return;
    }

    const situations = this.generateAllNewSituations(
      this.updatedReferentiels,
      activitiesStartDate,
      this.form.value,
      cat,
      fonct
    );

    console.log(this.updatedReferentiels, situations);

    if (this.human) {
      if (
        await this.humanResourceService.updatePersonById(this.human, {
          firstName: this.basicData!.controls['firstName'].value,
          lastName: this.basicData!.controls['lastName'].value,
          matricule: this.basicData!.controls['matricule'].value,
          situations,
          indisponibilities: this.indisponibilities,
        })
      ) {
        this.onSaveConfirm.emit();
      }
    }
  }

  /**
   * Reformatage des situations
   * @param newReferentiel
   * @param activitiesStartDate
   * @param profil
   * @param cat
   * @param fonct
   * @returns
   */
  generateAllNewSituations(
    newReferentiel: ContentieuReferentielInterface[],
    activitiesStartDate: Date,
    profil: any,
    cat: HRCategoryInterface,
    fonct: HRFonctionInterface
  ) {
    let situations = this.human?.situations || [];
    const activities: any[] = [];
    newReferentiel
      .filter((r) => r.percent && r.percent > 0)
      .map((r) => {
        activities.push({
          percent: r.percent || 0,
          contentieux: r,
        });
        (r.childrens || [])
          .filter((r) => r.percent && r.percent > 0)
          .map((child) => {
            activities.push({
              percent: child.percent || 0,
              contentieux: child,
            });
          });
      });

    console.log(
      'activities',
      JSON.stringify(
        activities.map((a) => ({
          percent: a.percent,
          cid: a.contentieux.id,
          clabel: a.contentieux.label,
        }))
      )
    );

    // find if situation is in same date
    const isSameDate = situations.findIndex((s) => {
      const day = today(s.dateStart);
      return (
        activitiesStartDate.getTime() === day.getTime() && s.id !== this.editId
      );
    });

    const options = {
      etp: profil.etp,
      category: cat,
      fonction: fonct,
      activities,
    };

    if (isSameDate !== -1) {
      console.log(situations[isSameDate]);

      situations[isSameDate] = {
        ...situations[isSameDate],
        ...options,
      };

      situations = situations.filter((s) => s.id !== this.editId);
    } else if (this.editId) {
      const index = situations.findIndex((s) => s.id === this.editId);
      if (index !== -1) {
        situations[index] = {
          ...situations[index],
          ...options,
          dateStart: activitiesStartDate,
        };
      }
    } else {
      situations.splice(0, 0, {
        id: -1,
        ...options,
        dateStart: activitiesStartDate,
      });
    }

    console.log(isSameDate, situations, this.editId);

    return situations;
  }

  /**
   * Retour du référentiel en fonction du paneau d'activité
   * @param referentiels
   */
  onNewReferentiel(referentiels: ContentieuReferentielInterface[]) {
    this.updatedReferentiels = referentiels;
  }

  /**
   * Show panel to help
   * @param type
   */
  openHelpPanel(type: string) {
    this.onOpenHelpPanel.emit(type);
  }

  convertirEtpt() {
    if (
      this.calculatriceService.dataCalculatrice.getValue().selectedTab ===
      'volume'
    ) {
      if (
        this.calculatriceService.dataCalculatrice.getValue().volume.value !==
        null
      ) {
        this.openCalculatricePopup = false;
        this.form
          .get('etp')
          ?.setValue(
            fixDecimal(
              this.calculatriceService.computeEtptCalculatrice(
                String(this.form.get('categoryId')?.value || 1)
              )
            )
          );
      }
    } else if (
      this.calculatriceService.dataCalculatrice.getValue().selectedTab ===
      'vacation'
    ) {
      if (
        this.calculatriceService.dataCalculatrice.getValue().vacation.value !==
          null &&
        this.calculatriceService.dataCalculatrice.getValue().vacation.unit !==
          null
      ) {
        this.openCalculatricePopup = false;
        this.form
          .get('etp')
          ?.setValue(
            fixDecimal(
              this.calculatriceService.computeEtptCalculatrice(
                String(this.form.get('categoryId')?.value || 1)
              )
            )
          );
      }
    }
  }

  setFonc(event: any) {
    const fonctions = this.humanResourceService.fonctions.getValue();
    const fonct = fonctions.find(
      (c) => c.id == this.form.get('fonctionId')?.value,
      event.value
    );
    if (fonct)
      this.calculatriceIsActive = fonct.calculatrice_is_active || false;
  }

  async downloadCalculator() {
    await this.serverService
      .post('centre-d-aide/log-documentation-link', {
        value: CALCULATE_DOWNLOAD_URL,
      })
      .then((r) => {
        return r.data;
      });
    window.open(CALCULATE_DOWNLOAD_URL);
  }

  async downloadEtpTemplate() {
    await this.serverService
      .post('centre-d-aide/log-documentation-link', {
        value: IMPORT_ETP_TEMPLATE,
      })
      .then((r) => {
        return r.data;
      });
    window.open(
      this.userService.isCa() ? IMPORT_ETP_TEMPLATE_CA : IMPORT_ETP_TEMPLATE
    );
  }

  /**
   * Récupère le nom d'une catégorie
   */
  getCategoryLabel() {
    const cat =
      this.categories.find((c) => this.form.get('categoryId')?.value == c.id) ||
      null;
    return cat;
  }

  /**
   * Interprete le fichier Excel importé par l'utilisateur
   * @param event
   * @param element
   */
  getFile(event: any, element: HTMLInputElement) {
    const file = event.target.files[0];

    const classe = {
      codeImport: null,
      value: null,
    };

    this.fileReader(file, classe, event);
    element.value = '';
  }

  private fileReader(file: any, line: any, event: any) {
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      let arrayBuffer = fileReader.result;
      const data = new Uint8Array(arrayBuffer as ArrayBuffer);
      const arr = new Array();

      for (let i = 0; i !== data.length; i++) {
        arr[i] = String.fromCharCode(data[i]);
      }

      const bstr = arr.join('');
      const workbook = xlsx.read(bstr, { type: 'binary', cellDates: true });
      const first_sheet_name = workbook.SheetNames[0];
      const second_sheet_name = workbook.SheetNames[1];

      if (second_sheet_name === 'Fonction' && this.userService.isCa()) {
        alert(
          "Le fichier que vous essayez d'importer est un fichier pour A-JUST TJ !"
        );
        event.target.value = '';
        return;
      } else if (
        second_sheet_name === 'Fonction_CA' &&
        !this.userService.isCa()
      ) {
        alert(
          "Le fichier que vous essayez d'importer est un fichier pour A-JUST CA !"
        );
        event.target.value = '';
        return;
      }

      if (
        !(
          second_sheet_name === 'Fonction' ||
          second_sheet_name === 'Fonction_CA'
        )
      ) {
        alert(
          "Le fichier que vous essayez d'importer n'est pas au bon format, veuillez réessayer !"
        );
        event.target.value = '';
        return;
      }

      const worksheet = workbook.Sheets[first_sheet_name];
      let firstWorksheet = xlsx.utils.sheet_to_json(worksheet, {
        blankrows: false,
      });

      // Formated data from the Excel file imported
      const importedSituation = { ...this.matchingCell(firstWorksheet, line) };

      this.displayImportLabels = true;
      let situation: importedSituation = {
        index: this.indexSituation,
        ventillation: this.affectImportedSituation(importedSituation),
      };
      this.humanResourceService.importedSituation.next(situation);
      this.appService.notification(
        `L’import de vos données a bien été réalisé.`
      );
    };
    fileReader.readAsArrayBuffer(file);
  }

  /**
   * Matching des différents champs de text Excel avec fiche agent AJUST
   * @param worksheet
   * @param line
   * @returns
   */
  private matchingCell(worksheet: any, line: any) {
    const monTab = { value: [] };
    let fct = null;
    let category: any = null;
    let mainEtp = null;
    let startDate = null;
    let worksheetLine = null;
    for (let i = 0; i < worksheet.length; i++) {
      worksheetLine = worksheet[i];

      if (
        worksheetLine['__EMPTY_1'] === 'Fonction' &&
        worksheetLine['__EMPTY_2']
      ) {
        const fctStr = worksheetLine['__EMPTY_2'];

        fct =
          this.humanResourceService.fonctions
            .getValue()
            .find(
              (c: HRFonctionInterface) =>
                c.label.toUpperCase() === fctStr?.toUpperCase()
            ) || null;
      } else if (
        worksheetLine['__EMPTY_1'] === 'Catégorie' &&
        worksheetLine['__EMPTY_2']
      ) {
        let categoryStr = worksheetLine['__EMPTY_2'].replaceAll('_', ' ');
        category =
          this.humanResourceService.categories
            .getValue()
            .find(
              (c: HRCategoryInterface) =>
                c.label.toUpperCase() === categoryStr?.toUpperCase()
            ) || null;
      } else if (
        worksheetLine['__EMPTY_1'] === 'ACTIVITES EXERCEES DEPUIS LE :'
      ) {
        startDate = worksheetLine['__EMPTY_2'];
        if (
          ['(saisir ici depuis quelle date)', '', undefined].includes(startDate)
        )
          startDate = null;
        else {
          startDate = new Date(startDate);
          startDate.setHours(startDate.getHours() + 5);
        }
        this.form.get('activitiesStartDate')?.setValue(startDate);
      } else if (
        worksheetLine['__EMPTY_1'] === 'Temps administratif de travail' &&
        worksheetLine['__EMPTY_4']
      ) {
        mainEtp = worksheetLine['__EMPTY_4'] as number;
        mainEtp = fixDecimal(mainEtp);
      } else if (worksheetLine['__EMPTY'] && worksheetLine['__EMPTY_4']) {
        const updatedLine = {
          codeImport: worksheetLine['__EMPTY'],
          value: worksheetLine['__EMPTY_4'],
        };
        line = { ...line, ...updatedLine };
        monTab.value.push(line as never);
      }
    }

    this.importedFunction = fct?.id || null;
    category !== null
      ? this.form.get('categoryId')?.setValue(category.id || null)
      : this.form.get('categoryId')?.setValue(null);
    this.form.get('etp')?.setValue(mainEtp);

    return { category, fct, mainEtp, startDate, ventilation: monTab };
  }

  /**
   * Comptage ventillation importé sous Excel
   * @param formatedData
   * @returns
   */
  affectImportedSituation(formatedData: any) {
    let result: importedVentillation[] = [];
    this.sumPercentImported = 0;
    formatedData.ventilation.value.map((ref: any) => {
      let found = false;
      this.updatedReferentiels = this.updatedReferentiels.map((item) => {
        const re = new RegExp('[0-9]{1,2}[.]');
        const startCode = ref.codeImport.split('.')[0] + '.';
        if (
          re.exec(ref.codeImport) !== null &&
          ref.codeImport == item.code_import
        ) {
          item.percent = ref.value;
          found = true;
          result.push({
            referentiel: item,
            percent: item.percent,
            parentReferentiel: null,
          });

          this.sumPercentImported += item.percent || 0;
          let sumSubRef = 0;
          const allImported = result.map((r) => r.referentiel.code_import);
          const childs = item.childrens?.map((r) => {
            if (allImported.includes(r.code_import))
              sumSubRef += r.percent || 0;
            return r.code_import;
          });

          if (sumSubRef !== item.percent)
            result = result.filter(
              (r) => childs?.includes(r.referentiel.code_import) === false
            );
        } else {
          if (startCode === item.code_import && found === false) {
            item.childrens = item.childrens?.map((child) => {
              if (child.code_import === ref.codeImport) {
                child.percent = ref.value;
                found = true;
                result.push({
                  referentiel: child,
                  percent: child.percent,
                  parentReferentiel: item,
                });
              }
              return child;
            });
          }
        }
        return item;
      });
    });

    return result;
  }

  /**
   * Event outfocus DropDown import de type 1
   * @param e
   */
  onclick(e: MouseEvent) {
    if (document.getElementById('drop-down')?.contains(e.target as Node)) {
      // Clicked in box
    } else {
      // Clicked outside the box
      if (this.isEdit || this.saveActions) this.toggleDropDown = false;
    }
  }

  /**
   * Event outfocus DropDown import de type 2
   * @param e
   */
  onclick2(e: MouseEvent) {
    if (document.getElementById('drop-down2')?.contains(e.target as Node)) {
      // Clicked in box
    } else {
      // Clicked outside the box
      if (!this.isEdit && !this.saveActions) this.toggleDropDown = false;
    }
  }
}
