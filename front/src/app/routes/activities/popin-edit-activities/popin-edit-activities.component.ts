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
import { groupBy, mapValues, get } from 'lodash';

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
  @Output() onClose: EventEmitter<boolean> = new EventEmitter()
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
  controlBeforeChange() {
    return new Promise((resolve) => {
      if (Object.values(this.updates).length === 0) {
        resolve(true)
      } else {
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
            this.onSave(false)
          },
        })
      }
    })
  }

  /**
   * Emit to close the popin
   */
  close() {
    this.controlBeforeChange().then(() => {
      this.onClose.emit(false)
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
      this.total.in = this.referentiel?.in || this.referentiel?.originalIn
      this.total.out = this.referentiel?.out || this.referentiel?.originalOut
      this.total.stock = this.referentiel?.stock || this.referentiel?.originalStock
      //console.log('Updates 01:', updates)
      updates.map((value: any) => {
        let nodeValue = null
        switch (value.node) {
          case 'entrees':
            nodeValue = value.contentieux.in || value.contentieux.originalIn
            break
          case 'sorties':
            nodeValue = value.contentieux.out || value.contentieux.originalOut
            break
          case 'stock':
            nodeValue =
              value.contentieux.stock || value.contentieux.originalStock
            break
        }
        if (nodeValue !== value.value) {
          const delta = (value.value || 0) - (nodeValue || 0)

          switch (value.node) {
            case 'entrees':
              {
                this.total.in = (this.total.in || 0) + delta
              }
              break
            case 'sorties':
              {
                this.total.out = (this.total.out || 0) + delta
              }
              break
            case 'stock':
              {
                this.total.stock = (this.total.stock || 0) + delta
              }
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
  
  checkInput(event : KeyboardEvent) {
    // Laisse passer ces touches
    if ((event.key >= '0' && event.key <= '9') || event.key === 'Backspace') {
          return true
    } else {
      // Empêche l'action pour toutes les autres touches
     return false
    }
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
    if (newValue !== '' && newValue.length > 0) {
      value = +newValue
    }

    if (newValue.length !== 0 && newValue === null) {
      delete this.updates[`${contentieux.id}-${nodeName}`]
    } else  {
      this.updates[`${contentieux.id}-${nodeName}`] = {
        value,
        node: nodeName,
        contentieux,
        calculated: false,
      }
    }
    const stock = document.getElementById(`contentieux-${contentieux.id}-stock`) as HTMLInputElement
    if (contentieux.stock === null || (contentieux.activityUpdated && (contentieux.activityUpdated.stock && contentieux.activityUpdated.stock.value === null || !contentieux.activityUpdated.stock))) {
      if (( this.updates[`${contentieux.id}-stock`] && this.updates[`${contentieux.id}-stock`].calculated ) || !this.updates[`${contentieux.id}-stock`]) {
        const entree = document.getElementById(`contentieux-${contentieux.id}-entrees`) as HTMLInputElement
        const sortie = document.getElementById(`contentieux-${contentieux.id}-sorties`) as HTMLInputElement
        const entreeValue : number =  (entree.value !== null && entree.value.length > 0) ? Number(entree.value) : (contentieux.originalIn ? contentieux.originalIn : 0)
        const sortieValue : number = (sortie.value !== null && sortie.value.length > 0) ? Number(sortie.value) : (contentieux.originalOut ? contentieux.originalOut : 0)

        this.getLastMonthStock(contentieux.id).then(resp => {
          const newStock = resp + entreeValue - sortieValue
          this.updates[`${contentieux.id}-stock`] = {
            value: newStock > 0 ? newStock : 0,
            node: 'stock',
            contentieux,
            calculated: true,
          }
          //console.log('this.updates[`${contentieux.id}-${nodeName}`] 01:', this.updates[`${contentieux.id}-stock`])
          stock.value =  newStock > 0 ? newStock.toString() : '0'
        })
      }
    }
    //console.log('this.updates 00:', this.updates)
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
  async onSave(force = false) {
    if (!force) {
      this.appService.alert.next({
        classPopin: 'width-600',
        title: 'Impact de vos modifications',
        text: `Les valeurs A-JUSTées que vous allez enregistrer vont se substituer aux données logiciel dans l'écran de synthèse et seront prises en compte comme nouvelle base des calculs.<br/><br/>Vous conserverez, dans l'écran de saisie, les données "logiciels" et les A-JUSTements que vous avez réalisés afin de vous en servir comme donnée de référence si besoin.`,
        okText: 'Annuler les modifications',
        callback: () => {
          this.onClose.emit(false)
        },
        secondaryText: 'Enregistrer les modifications',
        callbackSecondary: () => {
          this.onSave(true)
        },
      })
    } else {
      let updates : any = Object.values(this.updates).filter((elem: any) => !elem.calculated)
      console.log('Updates_00:', updates)
      updates.map((elem : any) => delete elem.calculated)
      console.log('Updates_01:', updates)

      let contentieux= groupBy(updates, (elem) => get(elem, 'contentieux.id'));
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
              options.entrees = elem.value
              break
            case 'sorties':
              options.sorties = elem.value
              break
            case 'stock':
              options.stock = elem.value
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

      this.onClose.emit(updates.length ? true : false)
    }
  }

  /**
   * Change month selection
   */
  selectMonth(date: any) {
    this.controlBeforeChange().then(() => {
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

  onShowHelpPanel() {
    if (this.wrapper && this.referentiel && this.referentiel.helpUrl) {
      this.wrapper?.onForcePanelHelperToShow({
        title: `Données d'activité ${this.referentielMappingName(
          this.referentiel.label
        )}`,
        path: this.referentiel.helpUrl,
        printSubTitle: true,
      })
    }
  }


  hasValueForToVerifyData (cont: ContentieuReferentielInterface, node: string) {

    if (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value === null)
      return false

    switch (node) {
      case 'entrees':
        if (cont.in !== null || (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value !== null))
          return true
        break;
      case 'sorties':
        if (cont.out !== null || (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value !== null))
          return true
        break;
      case 'stock':
        if (cont.stock!== null || (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value !== null))
          return true
        break;
   }
   return false
  }

  hasValue(cont: ContentieuReferentielInterface, node: string) {
    switch (node) {
      case 'entrees':
        if (cont.valueQualityIn === this.VALUE_QUALITY_TO_COMPLETE) {
          if (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value === null) {
            return false
          }
          else if (cont.in !== null || cont.originalIn !== null || (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value))
            return true
        }
        else if (cont.valueQualityIn === this.VALUE_QUALITY_TO_VERIFY) {
          return this.hasValueForToVerifyData(cont, node)
        }
        else if (cont.in !== null)
          return true
        break
      case 'sorties':
        if (cont.valueQualityOut === this.VALUE_QUALITY_TO_COMPLETE) {
          if (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value === null) {
            return false
          }
          else if (cont.out !== null || cont.originalOut !== null || (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value))
            return true
        }
        else if (cont.valueQualityOut === this.VALUE_QUALITY_TO_VERIFY) {
          return this.hasValueForToVerifyData(cont, node)
        }
        else if (cont.out !== null) {
          return true
        }
        break
      case 'stock':
        if (cont.valueQualityStock === this.VALUE_QUALITY_TO_COMPLETE) {
          if (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value === null) {
            return false
          }
          else if (cont.stock !== null || cont.originalStock !== null || (this.updates[`${cont.id}-${node}`] && this.updates[`${cont.id}-${node}`].value))
            return true
        }
        else if (cont.valueQualityStock === this.VALUE_QUALITY_TO_VERIFY) {
          return this.hasValueForToVerifyData(cont, node)
        }
        else if (cont.stock !== null) {
          return true
        }
        break
    }

    return this.updates[`${cont.id}-${node}`]
  }

  checkIfBlue (item : ContentieuReferentielInterface, node: string, inputValue : any, isForBulb? : boolean) {
    let input = null
    if (inputValue !== null)
      input = +inputValue
    switch (node) {
      case 'entrees':
          if (!inputValue)
            input = item.in
          if (input !== null && input !== item.originalIn)
            return true
        break;
      case 'sorties':
          if (!inputValue)
            input = item.out
          if (input !== null && input !== item.originalOut)
            return true
        break;
      case 'stock':
          if (!inputValue)
            input = item.stock
          if ((input !== null && input !== item.originalStock)) {
            if (isForBulb && (this.checkIfCalculated(item, 'stock') || (item.activityUpdated && (item.activityUpdated.stock && item.activityUpdated.stock.value === null || !item.activityUpdated.stock))))
              return false
            return true
          }
        break;
    }
    return false
  }

  checkIfCalculated(item : ContentieuReferentielInterface, node: string) {
    if (this.updates[`${item.id}-${node}`] && this.updates[`${item.id}-${node}`].calculated === true)
      return true
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
      const element =document.getElementById('contentieux-list')
      if (element) {
        let scrollWidth = element.offsetWidth - element.clientWidth;
        return  scrollWidth.toString() + 'px';
      }
    }
    return '0px';
  }

}
