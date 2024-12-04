import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { groupBy, mapValues, get, isNumber } from 'lodash';
import { MainClass } from '../../../libs/main-class';
import { PopupComponent } from '../../../components/popup/popup.component';
import { DateSelectComponent } from '../../../components/date-select/date-select.component';
import { CommonModule } from '@angular/common';
import { WrapperComponent } from '../../../components/wrapper/wrapper.component';
import {
  DATA_GITBOOK,
  NOMENCLATURE_DOWNLOAD_URL,
} from 'src/app/constants/documentation'
import {
  ContentieuReferentielActivitiesInterface,
  ContentieuReferentielInterface,
} from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { AppService } from 'src/app/services/app/app.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { copy } from 'src/app/utils'
import { downloadFile } from 'src/app/utils/system'
import { groupBy, mapValues, get, isNumber } from 'lodash'
import { VALUE_QUALITY_TO_VERIFY } from 'src/app/constants/referentiel'
import { UserService } from 'src/app/services/user/user.service'
import { OPACITY_20 } from 'src/app/constants/colors'


/**
 * Composant page activité
 */
@Component({
  selector: 'aj-popin-edit-activities',
  standalone: true,
  imports: [
    PopupComponent,
    DateSelectComponent,
    CommonModule,
    MatIconModule,
    FormsModule,
    CommentActivitiesComponent,
    RadioButtonComponent,
  ],
  templateUrl: './popin-edit-activities.component.html',
  styleUrls: ['./popin-edit-activities.component.scss'],
})
export class PopinEditActivitiesComponent
  extends MainClass
  implements OnChanges, AfterViewInit
{
  /**
   * Dom du wrapper
   */
  @Input() wrapper: WrapperComponent | undefined;
  /**
   * Référentiel
   */
  @Input() referentiel: ContentieuReferentielInterface | null = null;
  /**
   * Référentiel sélectionné
   */
  @Input() selectedReferentielId: number = 0;
  /**
   * Date du mois sélectionné
   */
  @Input() activityMonth: Date = new Date();
  /**
   * On Close event
   */
  @Output() onClose: EventEmitter<{
    reload: boolean
    month?: Date | undefined
  }> = new EventEmitter()

  /**
   * Current updates
   */
  updates: any = {};
  /**
   * Databook url
   */
  DATA_GITBOOK = DATA_GITBOOK;
  /**
   * Nomeclature url
   */
  NOMENCLATURE_DOWNLOAD_URL = NOMENCLATURE_DOWNLOAD_URL;
  /**
   * Total in, out, stock
   */
  total: {
    in: { value: null | number | undefined; updated: boolean }
    out: { value: null | number | undefined; updated: boolean }
    stock: { value: null | number | undefined; updated: boolean }
  } = {
    in: { value: null, updated: false },
    out: { value: null, updated: false },
    stock: { value: null, updated: false },
  }
  /**
   * have values to show
   */
  hasValuesToShow: boolean = true;
  /**
   * Lien vers la nomenclature a-just
   */
  nomenclature = '/assets/nomenclature-A-Just.html';
  /**
   * Lien vers le data book
   */
  dataBook = 'https://docs.a-just.beta.gouv.fr/le-data-book/';
  /**
   *
   */
  totalUrl = 'https://docs.a-just.beta.gouv.fr/tooltips-a-just/';
  /**
   *
   */
  logicielDataUrl =
    'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/donnees-dactivite/donnees-dactivite-logiciel'
  /**
   *
   */
  calculatedDataUrl =
    'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/donnees-dactivite/donnees-dactivite-a-justees'

  /**
   *  Vérifie que le mois prochain comporte des données d'activité
   */
  hasNextMonth: boolean = false
  
  /**
   * Show comments
   */
  showComments: boolean = false;

  /**
   * Constructeur
   * @param appService
   * @param referentielService
   * @param activitiesService
   */
  constructor(
    private appService: AppService,
    private activitiesService: ActivitiesService,
    private userService: UserService
  ) {
    super();
  }

  ngAfterViewInit() {
    this.checkIfNextMonthHasValue();
    // Mise en gris du background du sous-contentieux sélectionné et scroll automatique au niveau de ce contentieux
    const container = document.getElementById('contentieux-list');
    if (container) {
      const element = container.querySelector(
        `#contentieux-${this.selectedReferentielId}`
      )
      const logicielElement = container.querySelector(
        `.selected-contentieux-${this.selectedReferentielId}`
      )
      if (element) {
        // Mise en gris du background
        const referentielList = container.querySelectorAll('.header-list');
        const containerTop = container.getBoundingClientRect().top;
        const selectedElementTop = element.getBoundingClientRect().top;
        let delta = containerTop;

        element.classList.add('grey-bg');

        // Scroll automatique au niveau de ce contentieux
        for (let i = 0; i < referentielList.length; i++) {
          const topHeader = referentielList[i].getBoundingClientRect().top;
          if (topHeader === containerTop || containerTop < selectedElementTop) {
            delta += referentielList[i].getBoundingClientRect().height;
            break;
          }
        }
        let scrollTop = selectedElementTop - delta + container.scrollTop - 8;
        container.scroll({
          behavior: 'smooth',
          top: scrollTop,
        });
      }
    }

    // Mettre la couleur du background du header selon le contentieux
    if (this.referentiel) {
      const element = document.getElementById('header-popin')
      const bgColor =
        this.userService.referentielMappingColorActivityByInterface(
          this.referentiel?.label,
          OPACITY_20
        )

      if (element) element.style.backgroundColor = bgColor
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('new ref', this.referentiel, changes);
    if (changes['referentiel']) {
      this.updateTotal();
    }
  }

  /**
   * Récuperer le type de l'app
   */
  getInterfaceType() {
    return this.userService.interfaceType === 1;
  }

  /**
   * Vérifie si le mois suivant à des données d'activité
   * pour activier le bouton "Aller au mois suivant" ou "Enregistrer puis mois suivant"
   */
  checkIfNextMonthHasValue() {
    this.activitiesService.getLastMonthActivities().then((resp) => {
      const tmp = new Date(resp);

      const date1 = new Date(tmp.getFullYear(), tmp.getMonth(), 1)
      const date2 = new Date(
        this.activityMonth.getFullYear(),
        this.activityMonth.getMonth(),
        1
      )

      if (date1 > date2) this.hasNextMonth = true
      else this.hasNextMonth = false
    })
  }

  /**
   * Vérifie si il y a des données mise à jours
   * @returns
   */
  checkIfHasUpdates() {
    if (Object.keys(this.updates).length > 0) return true
    return false
  }

  /**
   * Controle si des données ont été modifiés avant fermeture de la page de saisie
   * Et si c'est le cas, on lance une alerte pour en informer l'utilisateur et l'inciter à enregistrer les modifications
   */
  async controlBeforeChange(close = false) {
    return new Promise((resolve) => {
      if (Object.values(this.updates).length === 0) {
        resolve(true);
      } else {
        if (this.checkIfHasUpdates()) {
          if (close) {
            this.appService.alert.next({
              classPopin: 'width-600',
              title: 'Modifications non enregistrées',
              text: 'Si vous fermez cette fenêtre sans avoir enregistré vos modifications, les nouvelles valeurs A-JUSTées seront automatiquement effacées.',
              okText: 'Annuler les modifications',
              callback: () => {
                resolve(true);
              },
              secondaryText: 'Enregistrer les modifications',
              callbackSecondary: () => {
                this.onSave({ force: false, exit: true })
              },
            });
          } else {
            this.onSave({ force: false, exit: false }).then(() => resolve(true))
          }
        }
      }
    });
  }

  /**
   * Lancement d'alerte lors de la fermeture de la fenêtre d'édition et contrôle si il y a eu des données modifiés
   */
  close() {
    this.controlBeforeChange(true).then(() => {
      if (this.wrapper) this.wrapper?.onForcePanelHelperToShow(null, false)
      this.onClose.emit({ reload: true })
    })
  }

  /**
   * Permet de permettre la modification d'une donnée au clique à l'extérieur de l'input concerné
   * ou lors de l'appuie sur la touche entrée
   * @param newValue
   * @param nodeName
   * @param contentieux
   */
  onBlur(
    newValue: string,
    nodeName: string,
    contentieux: ContentieuReferentielInterface
  ) {
    this.onUpdateValue(newValue, nodeName, contentieux)
  }

  /**
   * Vérification que le charactère entré par l'utilisateur est compris entr '0' et '9'
   * @param e
   * @returns
   */
  validateNo(e: any) {
    const charCode = e.which ? e.which : e.keyCode;

    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * Mise à jour des totaux du contentieux concerné suite à une modification de donnée
   */
  updateTotal() {
    this.total.in.value = this.referentiel?.in;
    this.total.out.value = this.referentiel?.out;
    this.total.stock.value = this.referentiel?.stock;
    const updates = Object.values(this.updates);

    if (updates.length) {
      this.total.in.value =
        this.total.in.value ??
        this.referentiel?.in ??
        this.referentiel?.originalIn
      this.total.out.value =
        this.total.out.value ??
        this.referentiel?.out ??
        this.referentiel?.originalOut
      this.total.stock.value =
        this.total.stock.value ??
        this.referentiel?.stock ??
        this.referentiel?.originalStock

      updates.map((elem: any) => {
        let nodeValue = null;
        let updatedValue = elem.value;

        switch (elem.node) {
          case 'entrees':
            nodeValue = elem.contentieux.in ?? elem.contentieux.originalIn;
            if (elem.value === null)
              updatedValue = isNumber(elem.contentieux.originalIn)
                ? elem.contentieux.originalIn
                : null
            break
          case 'sorties':
            nodeValue = elem.contentieux.out ?? elem.contentieux.originalOut;
            if (elem.value === null)
              updatedValue = isNumber(elem.contentieux.originalOut)
                ? elem.contentieux.originalOut
                : null
            break
          case 'stock':
            nodeValue =
              elem.contentieux.stock ?? elem.contentieux.originalStock;
            if (elem.value === null)
              updatedValue = isNumber(elem.contentieux.originalStock)
                ? elem.contentieux.originalStock
                : null
            break
        }

        let delta = (updatedValue || 0) - (nodeValue || 0);

        switch (elem.node) {
          case 'entrees':
            this.total.in.value = (this.total.in.value || 0) + delta
            if (
              updatedValue === null &&
              this.referentiel?.originalIn === null
            ) {
              this.total.in.value = null
              this.total.in.updated = false
            } else this.total.in.updated = true
            break
          case 'sorties':
            this.total.out.value = (this.total.out.value || 0) + delta

            if (
              updatedValue === null &&
              this.referentiel?.originalOut === null
            ) {
              this.total.out.value = null
              this.total.out.updated = false
            } else this.total.out.updated = true
            break
          case 'stock':
            this.total.stock.value = (this.total.stock.value || 0) + delta

            if (
              updatedValue === null &&
              this.referentiel?.originalStock === null
            ) {
              this.total.stock.value = null
              this.total.stock.updated = false
            } else this.total.stock.updated = true
            break
        }
      })

      if (
        this.total.in.value !== null &&
        this.total.in.value !== undefined &&
        this.total.in.value < 0
      ) {
        this.total.in.value = 0;
      }

      if (
        this.total.out.value !== null &&
        this.total.out.value !== undefined &&
        this.total.out.value < 0
      ) {
        this.total.out.value = 0;
      }

      if (
        this.total.stock.value !== null &&
        this.total.stock.value !== undefined &&
        this.total.stock.value < 0
      ) {
        this.total.stock.value = 0;
      }
    }
  }

  /**
   * Mise à jours d'une donnée
   * @param newValue
   * @param nodeName
   * @param contentieux
   */
  onUpdateValue(
    newValue: string,
    nodeName: string,
    contentieux: ContentieuReferentielInterface
  ) {
    let value: null | number = null
    let originalValue: number | null = null
    let isToVerify: boolean = false
    let updateTotal: boolean = false


    if (newValue !== '' && newValue.length > 0) {
      value = +newValue;
    }

    switch (nodeName) {
      case 'entrees':
        originalValue = isNumber(contentieux.originalIn)
          ? contentieux.originalIn
          : null
        if (contentieux.valueQualityIn === this.VALUE_QUALITY_TO_VERIFY)
          isToVerify = true;
        break;
      case 'sorties':
        originalValue = isNumber(contentieux.originalOut)
          ? contentieux.originalOut
          : null
        if (contentieux.valueQualityOut === this.VALUE_QUALITY_TO_VERIFY)
          isToVerify = true;
        break;
      case 'stock':
        originalValue = isNumber(contentieux.originalStock)
          ? contentieux.originalStock
          : null
        if (contentieux.valueQualityStock === this.VALUE_QUALITY_TO_VERIFY)
          isToVerify = true
        break
    }

    if (newValue.length !== 0 && newValue === null) {
      delete this.updates[`${contentieux.id}-${nodeName}`];
      updateTotal = true;
    } else {
      if (newValue.length === 0) {
        this.updates[`${contentieux.id}-${nodeName}`] = {
          value: null,
          node: nodeName,
          contentieux,
          calculated: false,
          setted: true,
          sendBack: true,
        };
      } else {
        this.updates[`${contentieux.id}-${nodeName}`] = {
          value,
          node: nodeName,
          contentieux,
          calculated: false,
          setted: true,
          sendBack: true,
        };
      }
      updateTotal = true;
    }
    const stock = document.getElementById(
      `contentieux-${contentieux.id}-stock`
    ) as HTMLInputElement

    // Remise du stock à son état d'origine si l'entréer et/ou la sortie précédement ajusté ont été mis à null ET qu'il n'y ai pas de donnée de stock saisie
    // Dans ce cas on remet le stock à son état d'origine
    if (
      ((this.updates[`${contentieux.id}-entrees`] &&
        this.updates[`${contentieux.id}-entrees`].value === null &&
        this.updates[`${contentieux.id}-sorties`] &&
        this.updates[`${contentieux.id}-sorties`].value === null) ||
        (this.updates[`${contentieux.id}-entrees`] &&
          this.updates[`${contentieux.id}-entrees`].value === null &&
          !this.updates[`${contentieux.id}-sorties`] &&
          contentieux.out === null) ||
        (this.updates[`${contentieux.id}-sorties`] &&
          this.updates[`${contentieux.id}-sorties`].value === null &&
          !this.updates[`${contentieux.id}-entrees`] &&
          contentieux.in === null)) &&
      contentieux.stock === null &&
      (!this.updates[`${contentieux.id}-stock`] ||
        (this.updates[`${contentieux.id}-stock`] &&
          this.updates[`${contentieux.id}-stock`].value === null)) /*|| 
        (contentieux.stock !== null && (!contentieux.activityUpdated || (contentieux.activityUpdated && (contentieux.activityUpdated.stock === null || contentieux.activityUpdated.stock.value === null ))))*/
    ) {
      updateTotal = true;
      this.updates[`${contentieux.id}-stock`] = {
        value: contentieux.originalStock,
        node: 'stock',
        contentieux,
        calculated: false,
        setted: false,
        sendBack: true, //false
      }
      stock.value = contentieux.originalStock
        ? contentieux.originalStock.toString()
        : '-'
    }
    //Pas de recalcul de stock si un stock a été saisi manuellement et qu'une valeur d'entrée et sortie de type "A vérifier" a été confirmer
    else if (
      (this.isStockCalculated(contentieux) ||
        (this.updates[`${contentieux.id}-stock`] &&
          this.updates[`${contentieux.id}-stock`].value === null)) &&
      (this.updates[`${contentieux.id}-entrees`] ||
        this.updates[`${contentieux.id}-sorties`])
    ) {
      updateTotal = true
      let entreeValue = 0
      let sortieValue = 0
      let stockValue = 0


      if (
        this.updates[`${contentieux.id}-entrees`] &&
        this.updates[`${contentieux.id}-entrees`].value !== null &&
        (contentieux.valueQualityIn !== VALUE_QUALITY_TO_VERIFY ||
          (contentieux.valueQualityIn === VALUE_QUALITY_TO_VERIFY &&
            this.updates[`${contentieux.id}-entrees`].value !==
              contentieux.originalIn))
      )
        entreeValue = this.updates[`${contentieux.id}-entrees`].value

      else {
        if (
          (this.updates[`${contentieux.id}-entrees`] &&
            this.updates[`${contentieux.id}-entrees`].value === null) ||
          contentieux.in === null
        ) {
          entreeValue = contentieux.originalIn ?? 0
        } else entreeValue = contentieux.in ?? 0

      }

      if (
        this.updates[`${contentieux.id}-sorties`] &&
        this.updates[`${contentieux.id}-sorties`].value !== null &&
        (contentieux.valueQualityOut !== VALUE_QUALITY_TO_VERIFY ||
          (contentieux.valueQualityOut === VALUE_QUALITY_TO_VERIFY &&
            this.updates[`${contentieux.id}-sorties`].value !==
              contentieux.originalOut))
      )
        sortieValue = this.updates[`${contentieux.id}-sorties`].value
      else {
        if (
          (this.updates[`${contentieux.id}-sorties`] &&
            this.updates[`${contentieux.id}-sorties`].value === null) ||
          contentieux.out === null
        ) {
          sortieValue = contentieux.originalOut ?? 0
        } else sortieValue = contentieux.out ?? 0
      }

      if (
        this.updates[`${contentieux.id}-stock`] &&
        this.updates[`${contentieux.id}-stock`].value === null
      )
        stockValue = contentieux.originalStock ?? 0
      else stockValue = contentieux.originalStock ?? contentieux.stock ?? 0 //Utile si pas de stock le mois n-1 (resp = null dans la suite)

      this.getLastMonthStock(contentieux.id).then((resp) => {
        let newStock: number | null =
          (resp ?? stockValue ?? 0) + entreeValue - sortieValue

        // condition spécifique pour envoyer une donnée au back dans le cas suivant: Entrée, Sortie et Stock ajusté puis supression du stock ajusté et ensuite suppression de l'entrée et/ou sortie ajusté.
        // Sans cette condition, la suppression du stock n'est pas prise en compte car la donnée est recalculé (suite à la supression de l'entrée et/ou sortie) et on indique pas au back que l'on souhaite supprimer la valeur précédement entrés
        // (plus bas on met sendBack à false car uopdate[stock].value !== null)
        const checkIfSendBack =
          this.updates[`${contentieux.id}-stock`] &&
          this.updates[`${contentieux.id}-stock`].calculated &&
          (this.updates[`${contentieux.id}-entrees`] ||
            this.updates[`${contentieux.id}-sorties`])
            ? true
            : false


        this.updates[`${contentieux.id}-stock`] = {
          value: newStock !== null ? (newStock > 0 ? newStock : 0) : null,
          node: 'stock',
          contentieux,
          calculated: true,
          setted: false,
          // Envoie au back si suppression d'une valeur de stock précédement ajusté
          sendBack:
            this.updates[`${contentieux.id}-stock`] &&
            (this.updates[`${contentieux.id}-stock`].value === null ||
              checkIfSendBack)
              ? true
              : false,
        }
        stock.value =
          newStock !== null ? (newStock > 0 ? newStock.toString() : '0') : '-'
      })

    }
    console.log('this.updates 00:', this.updates);
    updateTotal && setTimeout(() => this.updateTotal(), 1000);
  }

  /**
   * Obtention du stock du mois N-1
   * @param contentieuxId
   * @returns
   */
  async getLastMonthStock(contentieuxId: number) {
    let date: Date = new Date(this.activityMonth)
    date.setMonth(this.activityMonth.getMonth() - 1)
    return this.activitiesService.loadMonthActivities(date).then((resp) => {
      let stock = null
      const tmp = resp.list.find((elem: any) => {
        if (elem.contentieux.id === contentieuxId) return elem
      })

      if (tmp) stock = tmp.stock ?? tmp.originalStock ?? null
      return stock
    })

  }

  /**
   * Sauvegarde dans la base de données des données modifiées et lancenement de l'alerte informant
   * l'utilisateur de l'impact de la modification des données
   * @param param0
   */
  async onSave({ force = false, exit = false }) {
    if (!force) {
      await new Promise((resolve, reject) => {
        this.appService.alert.next({
          classPopin: 'width-600',
          title: 'Impact de vos modifications',
          text: `Les valeurs A-JUSTées que vous allez enregistrer vont se substituer aux données logiciel dans l'écran de synthèse et seront prises en compte comme nouvelle base des calculs.<br/><br/>Vous conserverez, dans l'écran de saisie, les données "logiciels" et les A-JUSTements que vous avez réalisés afin de vous en servir comme donnée de référence si besoin.`,
          okText: 'Annuler les modifications',
          callback: () => {
            this.updates = {}; // clear datas
            if (exit) {
              if (this.wrapper)
                this.wrapper?.onForcePanelHelperToShow(null, false)
              this.onClose.emit({ reload: false })

            }
            resolve(true);
          },
          secondaryText: 'Enregistrer les modifications',
          callbackSecondary: async () => {
            if (exit) {
              if (this.wrapper)
                this.wrapper?.onForcePanelHelperToShow(null, false)
              await this.onSave({ force: true, exit: true })
            } else await this.onSave({ force: true })
            resolve(true)

          },
        });
      });
    } else {
      let updates: any = Object.values(this.updates).filter(
        (elem: any) => (elem.calculated && elem.sendBack) || elem.sendBack
      )
      updates = updates.map((elem: any) => {
        if (elem.calculated) return { ...elem, value: null }
        return elem
      })
      let contentieux = groupBy(updates, (elem) => get(elem, 'contentieux.id'))

      contentieux = mapValues(contentieux, (group) =>
        group.map((elem) => {
          const initialValues = {
            in:
              elem.contentieux.in !== null
                ? elem.contentieux.in
                : elem.contentieux.originalIn,
            out:
              elem.contentieux.out !== null
                ? elem.contentieux.out
                : elem.contentieux.originalOut,
            stock:
              elem.contentieux.stock !== null
                ? elem.contentieux.stock
                : elem.contentieux.originalStock,
          }
          return { ...elem, ...initialValues }

        })
      );
      for (const cont of Object.keys(contentieux)) {
        const up: any = contentieux[cont];
        let options = {
          entrees: null,
          sorties: null,
          stock: null,
        };
        for (const elem of up) {
          switch (elem.node) {
            case 'entrees':
              options.entrees = elem.value;
              break;
            case 'sorties':
              options.sorties = elem.value;
              break;
            case 'stock':
              options.stock = elem.value;
              break;
          }
          console.log('OPTIONS:', options);
          await this.activitiesService.updateDatasAt(
            Number(cont),
            this.activityMonth,
            options,
            elem.node
          )
        }
      }

      if (updates.length && this.referentiel) {
        this.appService.notification(
          `Le contentieux <b>${
            this.getInterfaceType() === true
              ? this.referentielCAMappingName(this.referentiel.label)
              : this.referentielMappingName(this.referentiel.label)
          }</b> a été ajusté avec succès pour ${this.getMonthString(
            this.activityMonth
          )} ${this.activityMonth.getFullYear()}`
        );
      }
      this.updates = {}; // clear datas
      if (exit)
        this.onClose.emit({
          reload: updates.length ? true : false,
          month: this.activityMonth,
        })
    }
  }

  /**
   *Permet de changer le mois sur lequel on visualise les données
   * @param date
   */
  async selectMonth(date: any) {
    await this.controlBeforeChange().then(() => {
      this.activitiesService.loadMonthActivities(date).then((list: any) => {
        this.activityMonth = new Date(date);
        this.checkIfNextMonthHasValue();
        this.hasValuesToShow = list.list.length !== 0;
        console.log(list, this.activityMonth);
        if (this.referentiel) {
          this.referentiel = copy(this.referentiel);

          if (this.referentiel) {
            const getValuesFromList = (id: number) => {
              const element = list.list.find(
                (i: any) => i.contentieux.id === id
              );

              return {
                in: element ? element.entrees : null,
                originalIn: element ? element.originalEntrees : null,
                out: element ? element.sorties : null,
                originalOut: element ? element.originalSorties : null,
                stock: element ? element.stock : null,
                originalStock: element ? element.originalStock : null,
                activityUpdated: element ? element.updatedBy : null,
              }
            }

            this.referentiel = {
              ...this.referentiel,
              ...getValuesFromList(this.referentiel.id),
            };

            this.referentiel.childrens = (this.referentiel.childrens || []).map(
              (child) => ({ ...child, ...getValuesFromList(child.id) })
            );

            this.updateTotal()
          }
        }
      });
    });
  }

  /**
   * Vérifie si une donnée a été ajusté et non calculé
   * @param cont
   * @param node
   * @returns
   */
  isValueUpdated({
    cont,
    node,
  }: {
    cont: ContentieuReferentielInterface
    node: string
  }) {
    switch (node) {
      case 'entrees':
        if (this.updates[`${cont.id}-${node}`]) {
          if (this.updates[`${cont.id}-${node}`].value === null) return false
          return true
        } else if (cont.in !== null) return true
        break
      case 'sorties':
        if (this.updates[`${cont.id}-${node}`]) {
          if (this.updates[`${cont.id}-${node}`].value === null) return false
          return true
        } else if (cont.out !== null) return true
        break
      case 'stock':
        if (this.updates[`${cont.id}-${node}`]) {
          if (this.updates[`${cont.id}-${node}`].value === null) return false
          return true
        } else if (cont.stock !== null) return true
        break
    }
    return false;
  }

  /**
   * Vérifie si une donnée de stock a été calculé et non ajusté
   * @param cont
   * @returns
   */
  isStockCalculated(cont: ContentieuReferentielInterface) {
    if (this.updates[`${cont.id}-stock`]) {
      return this.updates[`${cont.id}-stock`].calculated
    } else if (
      (cont.stock !== null &&
        (!cont.activityUpdated ||
          (cont.activityUpdated && !cont.activityUpdated.stock) ||
          (cont.activityUpdated &&
            cont.activityUpdated.stock &&
            cont.activityUpdated.stock.value === null))) ||
      cont.stock === null
    ) {
      return true
    }
    return false;
  }

  /**
   * Vérifie si une valeur à "confirmer" a bien été confirmé ou non (ajusté ou ni ajusté, ni confirmé)
   * @param value
   * @param contentieux
   * @param node
   * @returns
   */
  isValueToVerifySetted({
    value,
    contentieux,
    node,
  }: {
    value: number | null
    contentieux: ContentieuReferentielInterface
    node: string
  }) {
    switch (node) {
      case 'entrees':
        if (
          value === contentieux.originalIn &&
          contentieux.valueQualityIn === VALUE_QUALITY_TO_VERIFY
        )
          return true
        break
      case 'sorties':
        if (
          value === contentieux.originalOut &&
          contentieux.valueQualityOut === VALUE_QUALITY_TO_VERIFY
        )
          return true
        break
      case 'stock':
        if (
          value === contentieux.originalStock &&
          contentieux.valueQualityStock === VALUE_QUALITY_TO_VERIFY
        )
          return true
        break
      default:
        return false
    }
    return false
  }

  /**
   * Permet de lancer l'ouverture du panel d'aide lors d'un clique sur une ampoule
   * Dépend du niveau du contentieux (level 3 ou 4) et de si c'est une donnée d'éntrée, sortie ou stock
   * @param level
   * @param cont
   * @param node
   * @param url
   */
  onShowHelpPanel({
    level,
    cont,
    node,
    url,
  }: {
    level?: number
    cont?: ContentieuReferentielInterface
    node?: string
    url?: string
  }) {
    if (cont && node) {
      switch (node) {
        case 'entrees':
          if (level === 3) {
            console.log('Entrées - TOTAL')
            url =
              'https://docs.a-just.beta.gouv.fr/tooltips-a-just/entrees/total-des-entrees'
          } else if (this.isValueUpdated({ cont, node })) {
            console.log('Entrées - AJUSTE')
            url =
              'https://docs.a-just.beta.gouv.fr/tooltips-a-just/entrees/entrees-a-justees'
          } else {
            console.log('Entrées - NORMAL')
            url =
              'https://docs.a-just.beta.gouv.fr/tooltips-a-just/entrees/entrees'
          }
          break
        case 'sorties':
          if (level === 3) {
            console.log('Sorties - TOTAL')
            url =
              'https://docs.a-just.beta.gouv.fr/tooltips-a-just/sorties/total-des-sorties'
          } else if (this.isValueUpdated({ cont, node })) {
            console.log('Sorties - AJUSTE')
            url =
              'https://docs.a-just.beta.gouv.fr/tooltips-a-just/sorties/sorties-a-justees'
          } else {
            console.log('Sorties - NORMAL')
            url =
              'https://docs.a-just.beta.gouv.fr/tooltips-a-just/sorties/sorties'
          }
          break
        case 'stock':
          if (level === 3) {
            console.log('Stock - TOTAL')
            url =
              'https://docs.a-just.beta.gouv.fr/tooltips-a-just/stocks/stock-total'
          } else if (this.isValueUpdated({ cont, node })) {
            // WARNING: Pour le Stock au niveau 4, il esxiste 2 possibilités. (1) Le stock a été recalculé, (2) Le stock a été saisi (ajusté)
            if (!this.isStockCalculated(cont)) {
              console.log('Stock - AJUSTE')
              url =
                'https://docs.a-just.beta.gouv.fr/tooltips-a-just/stocks/stock-a-juste'
            } else {
              console.log('Stock - CALCULE')
              url =
                'https://docs.a-just.beta.gouv.fr/tooltips-a-just/stocks/stock-calcule'
            }
          } else {
            console.log('STOCK')
            url =
              'https://docs.a-just.beta.gouv.fr/tooltips-a-just/stocks/stock'
          }
          break
      }
    }
    if (this.wrapper && this.referentiel && url) {
      this.wrapper?.onForcePanelHelperToShow({
        title: '',
        path: url,
        subTitle: '',
        printSubTitle: false,
        bgColor: this.userService.referentielMappingColorActivityByInterface(
          this.referentiel.label,
          OPACITY_20
        ),
        closeColor: 'black',
      });
    }
  }

  hasValue(cont: ContentieuReferentielInterface, node: string) {
    if (
      this.updates[`${cont.id}-${node}`] &&
      this.updates[`${cont.id}-${node}`].value === null
    )
      return false
    switch (node) {
      case 'entrees':
        if (cont.valueQualityIn === this.VALUE_QUALITY_TO_COMPLETE) {
          if (
            cont.in !== null ||
            cont.originalIn !== null ||
            (this.updates[`${cont.id}-${node}`] &&
              this.updates[`${cont.id}-${node}`].value)
          )
            return true
        } else if (cont.valueQualityIn === this.VALUE_QUALITY_TO_VERIFY) {
          if (
            cont.in !== null ||
            (this.updates[`${cont.id}-${node}`] &&
              this.updates[`${cont.id}-${node}`].value !== null)
          ) {
            return true
          }
        } else if (cont.in !== null) return true
        break
      case 'sorties':
        if (cont.valueQualityOut === this.VALUE_QUALITY_TO_COMPLETE) {
          if (
            cont.out !== null ||
            cont.originalOut !== null ||
            (this.updates[`${cont.id}-${node}`] &&
              this.updates[`${cont.id}-${node}`].value)
          )
            return true
        } else if (cont.valueQualityOut === this.VALUE_QUALITY_TO_VERIFY) {
          if (
            cont.out !== null ||
            (this.updates[`${cont.id}-${node}`] &&
              this.updates[`${cont.id}-${node}`].value !== null)
          )
            return true
        } else if (cont.out !== null) {
          return true
        }
        break;
      case 'stock':
        if (cont.valueQualityStock === this.VALUE_QUALITY_TO_COMPLETE) {
          if (
            cont.stock !== null ||
            cont.originalStock !== null ||
            (this.updates[`${cont.id}-${node}`] &&
              this.updates[`${cont.id}-${node}`].value)
          )
            return true
        } else if (cont.valueQualityStock === this.VALUE_QUALITY_TO_VERIFY) {
          if (
            cont.stock !== null ||
            (this.updates[`${cont.id}-${node}`] &&
              this.updates[`${cont.id}-${node}`].value !== null)
          ) {
            return true
          }
        } else if (cont.stock !== null) {
          return true
        }
        break
    }
    return this.updates[`${cont.id}-${node}`];
  }

  /**
   * Vérifie si on doit afficher une donnée en bleue (donné, bordure du bas et ampoule)
   * Régle:
   *  - Une donnée est en bleue si elle est modifié ou calculé (pour le stock)
   *  - La bordure du bas est en bleu si et seulement si c'est une donne ajusté manuellement et non calculé
   *  - Une ampoule est en bleue si une donnée est ajustée ou calculée
   * @param cont
   * @param node
   * @param level
   * @param isForBulbOrBottom
   * @returns
   */
  checkIfBlue({
    cont,
    node,
    level,
    isForBulbOrBottom,
  }: {
    cont: ContentieuReferentielInterface
    node: string
    level: number
    isForBulbOrBottom: boolean
  }) {
    switch (node) {
      case 'entrees':
        if (level === 3) {
          if (this.total.in.updated || this.isValueUpdated({ cont, node }))
            return true
          return false
        } else if (this.isValueUpdated({ cont, node })) return true
        break
      case 'sorties':
        if (level === 3) {
          if (this.total.out.updated || this.isValueUpdated({ cont, node }))
            return true
        } else if (this.isValueUpdated({ cont, node })) return true
        break
      case 'stock':
        if (level === 3) {
          if (this.total.stock.updated || this.isValueUpdated({ cont, node }))
            return true
        } else if (this.isValueUpdated({ cont, node })) {
          // Si l'entree et/ou la sortie sont de type 'A vérifier' est que l'une ou les deux ont été confirmées, et si le stock et bien calculé et que suite à un
          // recalcul de stock on obtient la meme valeur que la valeur logiciel), on imprime la valeur en bleue
          if (
            (this.isValueToVerifySetted({
              value: this.updates[`${cont.id}-entrees`]
                ? this.updates[`${cont.id}-entrees`].value
                : cont.in,
              contentieux: cont,
              node: 'entrees',
            }) ||
              this.isValueToVerifySetted({
                value: this.updates[`${cont.id}-sorties`]
                  ? this.updates[`${cont.id}-sorties`].value
                  : cont.out,
                contentieux: cont,
                node: 'sorties',
              })) &&
            this.updates[`${cont.id}-stock`] &&
            this.updates[`${cont.id}-stock`].value === cont.originalStock &&
            this.isStockCalculated(cont) &&
            !isForBulbOrBottom
          )
            return true
          //Si il y a une mise à jours du stock et que sa valeur est la même que celle initial (logiciel),
          // Et que ce n'est pas une valeur de stock saisie (càd: je saisie une valeur de stock égale à la valeur logiciel. Dans ce cas on doit imprimer la valeur en bleu)
          else if (
            this.updates[`${cont.id}-stock`] &&
            this.updates[`${cont.id}-stock`].value === cont.originalStock &&
            !this.updates[`${cont.id}-stock`].setted
          )
            return false
          if (isForBulbOrBottom && this.isStockCalculated(cont)) return false
          else if (cont.stock !== cont.originalStock) return true
          return true
        }
        break
    }
    return false;
  }

  /**
   * Permet de lancer le téléchargement de la nomenclature et du databook
   * @param type
   * @param download
   */
  downloadAsset(type: string, download = false) {
    let url = null;

    if (type === 'nomenclature') url = this.nomenclature
    else if (type === 'dataBook') url = this.dataBook

    if (url) {
      if (download) {
        downloadFile(url);
      } else {
        window.open(url)
      }
    }
  }

  /**
   * Permet d'obtenir la largeur de la scrollbar pour permetrre d'adapter
   * la marge à droite sur les parties non scrollable
   * @returns
   */
  getScrollbarWidth() {
    if (this.isNotIOS()) {
      const element = document.getElementById('contentieux-list');
      if (element) {
        let scrollWidth = element.offsetWidth - element.clientWidth
        return scrollWidth.toString() + 'px'
      }
    }
    return '0px'
  }
}
