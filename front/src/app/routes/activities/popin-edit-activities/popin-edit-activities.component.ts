import {
  AfterViewInit,
  OnInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core'
import { WrapperComponent } from 'src/app/components/wrapper/wrapper.component'
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
import { groupBy, mapValues, get, isNumber } from 'lodash';
import { VALUE_QUALITY_TO_VERIFY } from 'src/app/constants/referentiel'

/**
 * Composant page activité
 */
@Component({
  selector: 'aj-popin-edit-activities',
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
  @Input() wrapper: WrapperComponent | undefined
  /**
   * Référentiel
   */
  @Input() referentiel: ContentieuReferentielInterface | null = null
  /**
   * Référentiel sélectionné
   */
  @Input() selectedReferentielId: number = 0
  /**
   * Date du mois sélectionné
   */
  @Input() activityMonth: Date = new Date()
  /**
   * On Close event
   */
  @Output() onClose: EventEmitter<{reload: boolean, month?: Date | undefined}> = new EventEmitter()
  /**
   * Current updates
   */
  updates: any = {}
  /**
   * Databook url
   */
  DATA_GITBOOK = DATA_GITBOOK
  /**
   * Nomeclature url
   */
  NOMENCLATURE_DOWNLOAD_URL = NOMENCLATURE_DOWNLOAD_URL
  /**
   * Total in, out, stock
   */
  total: {
    in: null | number | undefined
    out: null | number | undefined
    stock: null | number | undefined
  } = {
    in: null,
    out: null,
    stock: null,
  }
  /**
   * have values to show
   */
  hasValuesToShow: boolean = true
  /**
   * Lien vers la nomenclature a-just
   */
  nomenclature = '/assets/nomenclature-A-Just.html'
  /**
   * Lien vers le data book
   */
  dataBook = 'https://docs.a-just.beta.gouv.fr/le-data-book/'
  /**
   * 
   */
  totalUrl = 'https://docs.a-just.beta.gouv.fr/tooltips-a-just/'
  /**
   * 
   */
  logicielDataUrl = 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/donnees-dactivite/donnees-dactivite-logiciel'
  /**
   * 
   */
  calculatedDataUrl = 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/donnees-dactivite/donnees-dactivite-a-justees'

  /**
   *  Vérifie que le mois prochain comporte des données d'activité
  */
  hasNextMonth : boolean = false

  /**
   * Constructeur
   * @param appService
   * @param referentielService
   * @param activitiesService
   */
  constructor(
    private appService: AppService,
    private referentielService: ReferentielService,
    private activitiesService: ActivitiesService
  ) {
    super()
  }

  ngAfterViewInit() {
    this.checkIfNextMonthHasValue()
    // Mise en gris du background du sous-contentieux sélectionné et scroll automatique au niveau de ce contentieux
    const container = document.getElementById('contentieux-list')
    if (container) {
      const element = container.querySelector(`#contentieux-${this.selectedReferentielId}`)
      const logicielElement = container.querySelector(`.selected-contentieux-${this.selectedReferentielId}`)
      if (element) {
        // Mise en gris du background
        const referentielList = container.querySelectorAll('.header-list')
        const containerTop = container.getBoundingClientRect().top
        const selectedElementTop = element.getBoundingClientRect().top
        let delta = containerTop

        element.classList.add('grey-bg')

        // Scroll automatique au niveau de ce contentieux
        for (let i = 0; i < referentielList.length; i++) {
          const topHeader = referentielList[i].getBoundingClientRect().top
          if (topHeader === containerTop || containerTop < selectedElementTop) {
            delta += referentielList[i].getBoundingClientRect().height
            break
          }
        }
        let scrollTop = selectedElementTop - delta + container.scrollTop - 8
        container.scroll({
          behavior: 'smooth',
          top: scrollTop,
        })
      }
    }

    // Mettre la couleur du background du header selon le contentieux
    if (this.referentiel){
      const element = document.getElementById('header-popin')
      const bgColor = this.referentielMappingColorActivity(this.referentiel?.label, 1)

      if (element)
        element.style.backgroundColor = bgColor;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('new ref', this.referentiel, changes)

    if (changes['referentiel']) {
      this.updateTotal()
    }
  }

  checkIfNextMonthHasValue() {
    this.activitiesService.getLastMonthActivities().then((resp) => {
      const tmp = new Date(resp)

      const date1 = new Date(tmp.getFullYear(), tmp.getMonth(), 1)
      const date2 = new Date(this.activityMonth.getFullYear(), this.activityMonth.getMonth(), 1)

      if (date1 > date2)
        this.hasNextMonth = true
      else
        this.hasNextMonth = false
    })
  }

  checkIfHasUpdates() {
    if (Object.keys(this.updates).length > 0)
      return true
    return false
  }

  /**
   * Retour des titres des infos bulles
   * @param type
   * @param contentieux
   * @param value
   * @returns
   */
  getTooltipTitle(
    type: 'entrees' | 'sorties' | 'stock',
    contentieux: ContentieuReferentielActivitiesInterface,
    value: number | null
  ) {
    const activityUpdated = contentieux.activityUpdated
    const modifyBy =
      activityUpdated && activityUpdated[type] ? activityUpdated[type] : null
    let string = `<div class="flex-center"><i class="margin-right-8 color-white ${
      value !== null
        ? modifyBy
          ? 'ri-lightbulb-flash-fill'
          : 'ri-lightbulb-flash-line'
        : ''
    }"></i><p class="color-white">`

    switch (type) {
      case 'entrees':
        string += 'Entrées A-JUSTées'
        break
      case 'sorties':
        string += 'Sorties A-JUSTées'
        break
      case 'stock':
        string += 'Stock A-JUSTé'

        if (value !== null) {
          const isMainActivity =
            this.referentielService.mainActivitiesId.indexOf(contentieux.id) !==
            -1
          const activityUpdated = contentieux.activityUpdated
          const modifyBy =
            activityUpdated && activityUpdated[type]
              ? activityUpdated[type]
              : null
          if (isMainActivity || !modifyBy) {
            string += ' - Calculé'
          }
        }
        break
    }
    string += '</p></div>'

    if (value !== null && modifyBy) {
      const date = new Date(modifyBy.date)
      string += `<p class="color-white font-size-12">Modifié par <b>${
        modifyBy.user?.firstName
      } ${
        modifyBy.user?.lastName
      }</b> le ${date.getDate()} ${this.getShortMonthString(
        date
      )} ${date.getFullYear()}</p>`
    }

    return string
  }

  /**
   * Retour du contenu des tooltips
   * @param type
   * @param contentieux
   * @param value
   * @param level
   * @returns
   */
  getTooltipBody(
    type: 'entrees' | 'sorties' | 'stock',
    contentieux: ContentieuReferentielActivitiesInterface,
    value: number | null,
    level: number
  ) {
    const activityUpdated = contentieux.activityUpdated
    const modifyBy =
      value !== null && activityUpdated && activityUpdated[type]
        ? activityUpdated[type]
        : null

    switch (type) {
      case 'entrees':
      case 'sorties':
        if (level === 3) {
          if (value !== null) {
            return `Dès lors que des ${
              type === 'entrees' ? 'entrées' : 'sorties'
            } sont saisies dans l'un des sous-contentieux de cette colonne, le total des ${
              type === 'entrees' ? 'entrées' : 'sorties'
            } de ce contentieux s'A-JUSTe automatiquement en additionnant les données A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres.`
          } else {
            return `Dès lors que des ${
              type === 'entrees' ? 'entrées' : 'sorties'
            } seront saisies dans l'un des sous-contentieux de cette colonne, le total des ${
              type === 'entrees' ? 'entrées' : 'sorties'
            } de ce contentieux s'A-JUSTera automatiquement en additionnant les données A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres.`
          }
        } else {
          if (modifyBy) {
            return `Dès lors que cette donnée ${
              type === 'entrees' ? "d'entrées" : 'de sorties'
            } mensuelles est modifié manuellement, votre stock est recalculé en prenant en compte cette valeur dans "Stock A-JUSTé".`
          } else {
            return `Dès lors que cette donnée ${
              type === 'entrees' ? "d'entrées" : 'de sorties'
            } mensuelles sera modifiée manuellement, votre stock sera recalculé en prenant en compte cette valeur dans "Stock A-JUSTé"`
          }
        }
      case 'stock': {
        if (level === 3) {
          if (value !== null) {
            return "Dès lors que des données de stock ont été saisies manuellement ou calculées dans l'un des sous-contentieux de cette colonne, le total du stock de ce contentieux s'A-JUSTe automatiquement en additionnant les données de stock A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres."
          } else {
            return "Dès lors que des données de stock seront saisies manuellement ou calculées dans l'un des sous-contentieux de cette colonne, le total du stock de ce contentieux s'A-JUSTera automatiquement en additionnant les données de stock A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres."
          }
        } else {
          if (modifyBy) {
            return `Cette donnée a été saisie manuellement et sera prise en compte pour le calcul du stock des mois prochains.<br/>Si vous modifiez les entrées et/ou les sorties ou données de stock des mois antérieurs, cette valeur ne sera pas modifiée.`
          } else if (value !== null) {
            return `Cette valeur de stock a été recalculée automatiquement, car vous avez saisi des données d'entrées, sorties ou stock pour l'un des mois précédents, ou parce que vous avez A-JUSTé les entrées ou sorties du mois en cours. <br/>Les stocks des prochains mois seront également recalculés à partir de cette valeur.<br/>Vous pouvez modifier manuellement cette donnée. Le cas échéant, les stocks des prochains mois seront recalculés à partir de la valeur que vous aurez saisie.<br/>Dès lors que vous A-JUSTez manuellement un stock, il ne sera plus recalculé, même si vous modifiez les entrées ou sorties du mois en cours ou des mois antérieurs.`
          } else {
            return `Cette valeur de stock sera recalculée automatiquement, dès lors que vous aurez saisi des données d'entrées, sorties ou stock pour l'un des mois précédents, ou si vous avez A-JUSTé les entrées ou sorties du mois en cours. Si vous modifiez manuellement cette donnée, les stocks des prochains mois seront recalculés à partir de la valeur que vous aurez saisie.<br/>Dès lors que vous A-JUSTez manuellement un stock, il ne sera plus recalculé, même si vous modifiez les entrées ou sorties des mois antérieurs.`
          }
        }
      }
    }
  }

  /**
   * Retourne le pied des tooltips
   * @param type
   * @param contentieux
   * @param value
   * @param level
   * @returns
   */
  getTooltipFooter(
    type: string,
    contentieux: ContentieuReferentielActivitiesInterface,
    value: number | null,
    level: number
  ) {
    if (type === 'stock' && level === 4) {
      if (value !== null) {
        const activityUpdated = contentieux.activityUpdated
        const modifyBy =
          activityUpdated && activityUpdated[type]
            ? activityUpdated[type]
            : null

        if (modifyBy) {
          return ''
        }

        return `Calcul :<br/>Stock A-JUSTé M = stock* mois M-1 + entrées* mois M - sorties* mois M<br/>* le stock A-JUSTé se recalcule dès lors qu'au moins l'une de ces 3 valeurs a été A-JUSTée`
      }

      return 'Calcul :<br/>Stock mois M = Stock mois M-1 + Entrées mois M - Sorties mois M'
    }

    return ''
  }

  /**
   * Control to change
   */
  async controlBeforeChange(close = false) {
    return new Promise((resolve) => {
      if (Object.values(this.updates).length === 0) {
        resolve(true)
      } else {
        if (this.checkIfHasUpdates()) {
          if (close) {
            this.appService.alert.next({
              classPopin: 'width-600',
              title: 'Modifications non enregistrées',
              text: 'Si vous fermez cette fenêtre sans avoir enregistré vos modifications, les nouvelles valeurs A-JUSTées seront automatiquement effacées.',
              okText: 'Annuler les modifications',
              callback: () => {
                resolve(true)
              },
              secondaryText: 'Enregistrer les modifications',
              callbackSecondary: () => {
                this.onSave({force: false, exit: true})
              },
            })
          } else {
            this.onSave({force: false, exit: false}).then(() => resolve(true))
          }
        }
      }
    })
  }

  /**
   * Emit to close the popin
   */
  close() {
    this.controlBeforeChange(true).then(() => {
      if (this.wrapper)
        this.wrapper?.onForcePanelHelperToShow(null, false)
      this.onClose.emit({reload: true})
    })
  }

  /**
   * Mise à jour des totaux
   */
  updateTotal() {
    this.total.in = this.referentiel?.in
    this.total.out = this.referentiel?.out
    this.total.stock = this.referentiel?.stock
    const updates = Object.values(this.updates)

    if (updates.length) {
      this.total.in = this.total.in ?? this.referentiel?.in ?? this.referentiel?.originalIn
      this.total.out = this.total.out ?? this.referentiel?.out ?? this.referentiel?.originalOut
      this.total.stock = this.total.stock ?? this.referentiel?.stock ?? this.referentiel?.originalStock

      updates.map((elem: any) => {
        let nodeValue = null
        let updatedValue = elem.value
        switch (elem.node) {
          case 'entrees':
            nodeValue = elem.contentieux.in ?? elem.contentieux.originalIn
            if (elem.value === null)
              updatedValue = isNumber(elem.contentieux.originalIn) ? elem.contentieux.originalIn : null
            break
          case 'sorties':
            nodeValue = elem.contentieux.out ?? elem.contentieux.originalOut
            if (elem.value === null)
              updatedValue = isNumber(elem.contentieux.originalOut) ? elem.contentieux.originalOut : null
            break
          case 'stock':
            nodeValue = elem.contentieux.stock ?? elem.contentieux.originalStock
            if (elem.value === null)
              updatedValue= isNumber(elem.contentieux.originalStock) ? elem.contentieux.originalStock : null
            break
        }
          
        if (nodeValue !== updatedValue) {
          let delta = (updatedValue || 0) - (nodeValue || 0)

          switch (elem.node) {
            case 'entrees':
                this.total.in = (this.total.in || 0) + delta
                if (this.total.in === 0 && updatedValue === null && this.referentiel?.originalIn === null)
                  this.total.in = null
              break
            case 'sorties':
                this.total.out = (this.total.out || 0) + delta
                if (this.total.out === 0  && updatedValue === null && this.referentiel?.originalOut === null)
                    this.total.out = null
              break
            case 'stock':
                this.total.stock = (this.total.stock || 0) + delta
                if (this.total.stock === 0 && updatedValue === null && this.referentiel?.originalStock === null)
                  this.total.stock = null
              break
          }
        }
      })
      // let deltaEntrees =  (this.referentiel?.in || 0) + (this.total.in || 0)
      // let deltaSorties = (this.referentiel?.out || 0) + (this.total.out || 0)

      // // if ((this.referentiel?.in || 0) > (this.total.in || 0))
      // //   deltaEntrees *= -1
      // // if ((this.referentiel?.out || 0) > (this.total.out || 0))
      // //   deltaSorties *= -1

      // console.log('DeltaEntrees:', deltaEntrees)
      // console.log('DeltaSorties:', deltaSorties)
      // console.log('total.stock_01:', this.total.stock)
      // if (deltaEntrees || deltaSorties) {
      //   this.total.stock = (this.total.stock || 0) + deltaEntrees - deltaSorties
      //   console.log('this.total.stock_02:', this.total.stock)
      // }

      if (
        this.total.in !== null &&
        this.total.in !== undefined &&
        this.total.in < 0
      ) {
        this.total.in = 0
      }

      if (
        this.total.out !== null &&
        this.total.out !== undefined &&
        this.total.out < 0
      ) {
        this.total.out = 0
      }

      if (
        this.total.stock !== null &&
        this.total.stock !== undefined &&
        this.total.stock < 0
      ) {
        this.total.stock = 0
      }
    }
  }
  
  checkInput(event : KeyboardEvent, input: string) {
    // Laisse passer ces touches
    // console.log('event.key:', event.key)
    // console.log('input:', input)
    // console.log('input length:', input.length)
    // if ((event.key >= '0' && event.key <= '9') || event.key === 'Backspace') {
    //       return true
    // } else {
    //   // Empêche l'action pour toutes les autres touches
    //  return false
    // }
    return true
  }

  /**
   * onUpdateValue event
   */
  onUpdateValue(
    newValue: string,
    nodeName: string,
    contentieux: ContentieuReferentielInterface
  ) {
    let value: null | number = null
    let original: null | number = null
    let isToVerify: boolean = false

    if (newValue !== '' && newValue.length > 0) {
      value = +newValue
    }
    switch (nodeName) {
      case 'entrees':
        original = isNumber(contentieux.originalIn) ? contentieux.originalIn : null
        if (contentieux.valueQualityIn === this.VALUE_QUALITY_TO_VERIFY)
          isToVerify = true
        break
      case 'sorties':
        original = isNumber(contentieux.originalOut) ? contentieux.originalOut : null
        if (contentieux.valueQualityOut === this.VALUE_QUALITY_TO_VERIFY)
          isToVerify = true
        break
      case 'stock':
        original = isNumber(contentieux.originalStock) ? contentieux.originalStock : null
        if (contentieux.valueQualityStock=== this.VALUE_QUALITY_TO_VERIFY)
          isToVerify = true
        break
    }
    
    if ((newValue.length !== 0 && newValue === null) || (value && original && value === original && !isToVerify)) {
      delete this.updates[`${contentieux.id}-${nodeName}`]
    } else {
      if (newValue.length === 0) {
        this.updates[`${contentieux.id}-${nodeName}`] = {
          value: null,
          node: nodeName,
          contentieux,
          calculated: false,
          sendBack: true,
        }
      } else {
        this.updates[`${contentieux.id}-${nodeName}`] = {
          value,
          node: nodeName,
          contentieux,
          calculated: false,
          sendBack: true,
        }
      }
    }
    const stock = document.getElementById(`contentieux-${contentieux.id}-stock`) as HTMLInputElement

    // Verification si l'entrée et/ou la sortie (déja mise à jours auparavent) a été mise à null (cad annulé)
    // Dans ce cas on remet le stock à son état d'origine
    if ((this.updates[`${contentieux.id}-entrees`] && this.updates[`${contentieux.id}-entrees`].value === null && this.updates[`${contentieux.id}-sorties`] && this.updates[`${contentieux.id}-sorties`].value === null) || 
        (this.updates[`${contentieux.id}-entrees`] && this.updates[`${contentieux.id}-entrees`].value === null && !this.updates[`${contentieux.id}-sorties`] && contentieux.out === null) ||
        (this.updates[`${contentieux.id}-sorties`] && this.updates[`${contentieux.id}-sorties`].value === null && !this.updates[`${contentieux.id}-entrees`] && contentieux.in === null)
    ) {
      setTimeout(() => {
        //delete this.updates[`${contentieux.id}-stock`];
        this.updates[`${contentieux.id}-stock`] = {
          value: contentieux.originalStock,
          node: 'stock',
          contentieux,
          calculated: false,
          sendBack: true,
        }
        stock.value = contentieux.originalStock ? contentieux.originalStock.toString() : '-'
      }, 1000)
    } 
    //Node différent de 'Stock' ou on supprime un valeur de stock ajusté ou calculé
    else if (nodeName !== 'stock' || this.updates[`${contentieux.id}-stock`] && this.updates[`${contentieux.id}-stock`].value === null) {
      let entreeValue = 0
      let sortieValue = 0
    
      if (this.updates[`${contentieux.id}-entrees`] && this.updates[`${contentieux.id}-entrees`].value !== null && contentieux.valueQualityIn !== VALUE_QUALITY_TO_VERIFY)
        entreeValue = this.updates[`${contentieux.id}-entrees`].value
      else  {
        if ((this.updates[`${contentieux.id}-entrees`] && this.updates[`${contentieux.id}-entrees`].value === null) || contentieux.in === null) {
          entreeValue = contentieux.originalIn ? contentieux.originalIn : 0
        }
        else if (typeof contentieux.in !== 'undefined' && contentieux.in !== null )
          entreeValue = contentieux.in
      }

      if (this.updates[`${contentieux.id}-sorties`] && this.updates[`${contentieux.id}-sorties`].value !== null && contentieux.valueQualityOut !== VALUE_QUALITY_TO_VERIFY)
        sortieValue = this.updates[`${contentieux.id}-sorties`].value
      else  {
        if ((this.updates[`${contentieux.id}-sorties`] && this.updates[`${contentieux.id}-sorties`].value === null) || contentieux.out === null) {
          sortieValue = contentieux.originalOut ? contentieux.originalOut : 0
        }
        else if (typeof contentieux.out !== 'undefined' && contentieux.out !== null)
          sortieValue = contentieux.out
      }

      this.getLastMonthStock(contentieux.id).then(resp => {
        const newStock = resp + entreeValue - sortieValue
          this.updates[`${contentieux.id}-stock`] = {
            value: newStock > 0 ? newStock : 0,
            node: 'stock',
            contentieux,
            calculated: true,
            sendBack: this.updates[`${contentieux.id}-stock`] && this.updates[`${contentieux.id}-stock`].value === null ? true : false,
          }
        stock.value =  newStock > 0 ? newStock.toString() : '0'
      })
    }
    console.log('this.updates 00:', this.updates)
    setTimeout(() => this.updateTotal(), 1000)
  }

  async getLastMonthStock(contentieuxId : number) {
    let date : Date =  new Date(this.activityMonth)
    date.setMonth(this.activityMonth.getMonth() - 1)
    return this.activitiesService.loadMonthActivities(date).then(resp => {
      const tmp = resp.list.find((elem: any) => {
        if (elem.contentieux.id === contentieuxId)
          return elem
      })
      const stock = tmp.stock | tmp.originalStock | 0
      return stock
    })
  }

  /**
   * On save
   */
  async onSave({force = false, exit = false}) {
    if (!force) {
      await new Promise((resolve, reject) => {
        this.appService.alert.next({
          classPopin: 'width-600',
          title: 'Impact de vos modifications',
          text: `Les valeurs A-JUSTées que vous allez enregistrer vont se substituer aux données logiciel dans l'écran de synthèse et seront prises en compte comme nouvelle base des calculs.<br/><br/>Vous conserverez, dans l'écran de saisie, les données "logiciels" et les A-JUSTements que vous avez réalisés afin de vous en servir comme donnée de référence si besoin.`,
          okText: 'Annuler les modifications',
          callback: () => {
            this.updates = {} // clear datas
            if (exit) {
              if (this.wrapper)
                this.wrapper?.onForcePanelHelperToShow(null, false)
              this.onClose.emit({reload: false})
            }
            resolve(true)
          },
          secondaryText: 'Enregistrer les modifications',
          callbackSecondary: async () => {
            if (exit) {
              if (this.wrapper)
                this.wrapper?.onForcePanelHelperToShow(null, false)
              await this.onSave({force: true, exit: true})
            }
            else 
              await this.onSave({force: true})
            resolve(true)
          },
        })
      })
    } else {
      let updates : any = Object.values(this.updates).filter((elem: any) => (elem.sendBack))
      updates = updates.map((elem:any) => {
        if (elem.calculated)
          return {...elem, value: null}
        return elem
      })
      //updates.map((elem : any) => delete elem.calculated)
      let contentieux = groupBy(updates, (elem) => get(elem, 'contentieux.id'));
      contentieux= mapValues(contentieux, (group) =>
        group.map((elem) => {
          const initialValues = {
            in: elem.contentieux.in !== null ? elem.contentieux.in : elem.contentieux.originalIn,
            out: elem.contentieux.out !== null ? elem.contentieux.out : elem.contentieux.originalOut,
            stock: elem.contentieux.stock !== null ? elem.contentieux.stock : elem.contentieux.originalStock,
          };
          return { ...elem, ...initialValues };
        })
      )
      for (const cont of Object.keys(contentieux)) {
        const up: any = contentieux[cont]
        let options = {
          entrees: null,
          sorties:  null,
          stock:  null,
        }

        for (const elem of up) {
          switch (elem.node) {
            case 'entrees':
              options.entrees = elem.value !== null ? elem.value : elem.contentieux.originalIn
              break
            case 'sorties':
              options.sorties = elem.value !== null ? elem.value : elem.contentieux.originalOut
              break
            case 'stock':
              options.stock = elem.value !== null? elem.value : elem.contentieux.originalStock
              break
          }
          await this.activitiesService.updateDatasAt(
            Number(cont),
            this.activityMonth,
            options,
            elem.node,
          )
        }
      }

      if (updates.length && this.referentiel) {
        this.appService.notification(
          `Le contentieux <b>${this.referentielMappingName(
            this.referentiel.label
          )}</b> a été ajusté avec succès pour ${this.getMonthString(
            this.activityMonth
          )} ${this.activityMonth.getFullYear()}`
        )
      }
      this.updates = {} // clear datas
      if (exit)
        this.onClose.emit({reload: updates.length ? true : false, month: this.activityMonth})
    }
  }

  /**
   * Change month selection
   */
  async selectMonth(date: any) {
    //this.onSave({force: false, exit: false}).then(() => {
    await this.controlBeforeChange().then(() => {
      this.activitiesService.loadMonthActivities(date).then((list: any) => {
        this.activityMonth = new Date(date)
        this.checkIfNextMonthHasValue()
        this.hasValuesToShow = list.list.length !== 0
        console.log(list, this.activityMonth)
        if (this.referentiel) {
          this.referentiel = copy(this.referentiel)

          if (this.referentiel) {
            const getValuesFromList = (id: number) => {
              const element = list.list.find(
                (i: any) => i.contentieux.id === id
              )

              return {
                in: element ? element.entrees : null,
                originalIn: element ? element.originalEntrees : null,
                out: element ? element.sorties : null,
                originalOut: element ? element.originalSorties : null,
                stock: element ? element.stock : null,
                originalStock: element ? element.originalStock : null,
              }
            }

            this.referentiel = {
              ...this.referentiel,
              ...getValuesFromList(this.referentiel.id),
            }

            this.referentiel.childrens = (this.referentiel.childrens || []).map(
              (child) => ({ ...child, ...getValuesFromList(child.id) })
            )


            this.updateTotal()
          }
        }
      })
    })
  }

  isValueUpdated({cont, node} : {cont: ContentieuReferentielInterface, node: string }) {
    switch (node) {
      case 'entrees':
        if (this.updates[`${cont.id}-${node}`]) {
          if (this.updates[`${cont.id}-${node}`].value === null)
            return false
          else if (this.updates[`${cont.id}-${node}`].value !== cont.originalIn) {
            return true
          }
        } else if (cont.in !== null && cont.in !== cont.originalIn)
            return true
        break;
      case 'sorties':
        if (this.updates[`${cont.id}-${node}`]) {
          if (this.updates[`${cont.id}-${node}`].value === null)
            return false
          else if (this.updates[`${cont.id}-${node}`].value !== cont.originalOut) {
            return true
          }
        } else if (cont.out !== null && cont.out !== cont.originalOut)
            return true
        break;
      case 'stock':
        if (this.updates[`${cont.id}-${node}`]) {
          if (this.updates[`${cont.id}-${node}`].value === null)
            return false
          else if (this.updates[`${cont.id}-${node}`].value !== cont.originalStock) {
            return true
          }
        } else if (cont.stock !== null && cont.stock !== cont.originalStock)
            return true
        break;
    }
    return false
  }

  isStockCalculated ({cont, node} : {cont: ContentieuReferentielInterface, node: string }) {
    if (this.updates[`${cont.id}-${node}`]) {
      return this.updates[`${cont.id}-${node}`].calculated
    }
    else if (cont.stock !== null && (!cont.activityUpdated ||  cont.activityUpdated && !cont.activityUpdated.stock || cont.activityUpdated && cont.activityUpdated.stock && cont.activityUpdated.stock.value === null)) {
      return true
    }
    return false
  }

  onShowHelpPanel({level, cont, node, url} : {level?: number, cont?: ContentieuReferentielInterface, node?: string, url?: string}) {
    if (cont && node) {
      switch (node) {
        case 'entrees':
          if (level === 3) {
            console.log('Entrées - TOTAL')
            url = 'https://docs.a-just.beta.gouv.fr/tooltips-a-just/entrees/total-des-entrees'
          }
          else if (this.isValueUpdated({cont, node})) {
            console.log('Entrées - AJUSTE')
            url = 'https://docs.a-just.beta.gouv.fr/tooltips-a-just/entrees/entrees-a-justees'
          } else {
            console.log('Entrées - NORMAL')
            url = 'https://docs.a-just.beta.gouv.fr/tooltips-a-just/entrees/entrees'
          }
          break;
        case 'sorties':
          if (level === 3) {
            console.log('Sorties - TOTAL')
            url = 'https://docs.a-just.beta.gouv.fr/tooltips-a-just/sorties/total-des-sorties'
          }
          else if (this.isValueUpdated({cont, node})) {
            console.log('Sorties - AJUSTE')
            url = 'https://docs.a-just.beta.gouv.fr/tooltips-a-just/sorties/sorties-a-justees'
          } else {
            console.log('Sorties - NORMAL')
            url = 'https://docs.a-just.beta.gouv.fr/tooltips-a-just/sorties/sorties'
          }
          break;
        case 'stock':
          if (level === 3) {
            console.log('Stock - TOTAL')
            url = 'https://docs.a-just.beta.gouv.fr/tooltips-a-just/stocks/stock-total'
          }
          else if (this.isValueUpdated({cont, node})) { 
            // WARNING: Pour le Stock au niveau 4, il esxiste 2 possibilités. (1) Le stock a été recalculé, (2) Le stock a été saisi (ajusté)
            if (!this.isStockCalculated({cont, node})) {
              console.log('Stock - AJUSTE')
              url = 'https://docs.a-just.beta.gouv.fr/tooltips-a-just/stocks/stock-a-juste'
            } else {
              console.log('Stock - CALCULE')
              url = 'https://docs.a-just.beta.gouv.fr/tooltips-a-just/stocks/stock-calcule'
            }
          } else {
            console.log('STOCK')
            url = 'https://docs.a-just.beta.gouv.fr/tooltips-a-just/stocks/stock'
          }
          break; 
      }
    }
    if (this.wrapper && this.referentiel && url) {
      this.wrapper?.onForcePanelHelperToShow({
        title: '',
        path: url,
        subTitle: '',
        printSubTitle: false,
        bgColor: this.referentielMappingColorActivity(this.referentiel.label),
        closeColor: 'black',
      })
    }
  }

  hasValue(cont: ContentieuReferentielInterface, node: string) {
    if (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value === null) 
      return false
    switch (node) {
      case 'entrees':
        if (cont.valueQualityIn === this.VALUE_QUALITY_TO_COMPLETE) {
          if (cont.in !== null || cont.originalIn !== null || (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value))
            return true
        }
        else if (cont.valueQualityIn === this.VALUE_QUALITY_TO_VERIFY) {
          if (cont.in !== null || (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value !== null)) {
            return true
          }
        }
        else if (cont.in !== null)
          return true
        break
      case 'sorties':
        if (cont.valueQualityOut === this.VALUE_QUALITY_TO_COMPLETE) {
          if (cont.out !== null || cont.originalOut !== null || (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value))
            return true
        }
        else if (cont.valueQualityOut === this.VALUE_QUALITY_TO_VERIFY) {
          if (cont.out !== null || (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value !== null))
            return true
        }
        else if (cont.out !== null) {
          return true
        }
        break
      case 'stock':
        if (cont.valueQualityStock === this.VALUE_QUALITY_TO_COMPLETE) {
          if (cont.stock !== null || cont.originalStock !== null || (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value))
            return true
        }
        else if (cont.valueQualityStock === this.VALUE_QUALITY_TO_VERIFY) {
          if (cont.stock!== null || (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value !== null)) {
            return true
          }
        }
        else if (cont.stock !== null) {
          return true
        }
        break
    }
    return this.updates[`${cont.id}-${node}`]
  }

  checkIfBlue({cont, node, level, isForBulbOrBottom} : {cont: ContentieuReferentielInterface, node: string, level: number, isForBulbOrBottom: boolean }) {
    switch (node) {
      case 'entrees':
        if (level === 3) {
          if (this.total.in !== null && this.total.in !== cont.originalIn)
            return true
        }
        else if (this.isValueUpdated({cont, node}))
          return true
        break;
      case 'sorties':
        if (level === 3) {
          if (this.total.out !== null && this.total.out !== cont.originalOut)
            return true
        }
        else if (this.isValueUpdated({cont, node}))
          return true
        break;
      case 'stock':
        if (level === 3) {
          if (this.total.stock !== null && this.total.stock !== cont.originalStock)
            return true
        }
        else if (this.isValueUpdated({cont, node})) {
          if (isForBulbOrBottom && this.isStockCalculated({cont, node})) {// && cont.stock !== cont.originalStock ) {
            return false
          }
          if (cont.stock !== cont.originalStock) {
            return true
          }
          return true
        }
        break;
    }
    return false
  }


  downloadAsset(type: string, download = false) {
    let url = null

    if (type === 'nomenclature')
      url = this.nomenclature
    else if (type === 'dataBook')
      url = this.dataBook

    if (url) {
      if (download) {
        downloadFile(url)
      } else {
        window.open(url)
     }
    }
  }

  getScrollbarWidth() {
    if (this.isNotIOS()) {
      const element = document.getElementById('contentieux-list')
      if (element) {
        let scrollWidth = element.offsetWidth - element.clientWidth;
        return  scrollWidth.toString() + 'px';
      }
    }
    return '0px';
  }

}
