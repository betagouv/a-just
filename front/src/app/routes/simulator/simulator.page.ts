import { animate, style, transition, trigger } from '@angular/animations'
import {
  decimalToStringDate,
  findRealValue,
  monthDiffList,
  nbOfDays,
  stringToDecimalDate,
} from 'src/app/utils/dates'
import {
  Component,
  OnInit,
  HostListener,
  ViewChild,
  OnDestroy,
} from '@angular/core'

import { dataInterface } from 'src/app/components/select/select.component'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { SimulatorInterface } from 'src/app/interfaces/simulator'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { SimulatorService } from 'src/app/services/simulator/simulator.service'
import { tree } from 'src/app/routes/simulator/simulator.tree'
import { SimulationInterface } from 'src/app/interfaces/simulation'
import { WrapperComponent } from 'src/app/components/wrapper/wrapper.component'
import { BackupInterface } from 'src/app/interfaces/backup'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { DocumentationInterface } from 'src/app/interfaces/documentation'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { UserService } from 'src/app/services/user/user.service'
import {
  userCanViewContractuel,
  userCanViewGreffier,
  userCanViewMagistrat,
} from 'src/app/utils/user'
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service'
import { IDeactivateComponent } from '../canDeactivate-guard-service'
import { ActivatedRoute, Router } from '@angular/router'
import { ServerService } from 'src/app/services/http-server/server.service'
import { HubspotChatService } from 'src/app/services/hubspot-chat/hubspot-chat.service'
import { IntroJSStep } from 'src/app/components/intro-js/intro-js.component'
import { sleep } from 'src/app/utils'

/**
 * Variable ETP magistrat field name
 */
const etpMag = 'etpMag'
/**
 * Variable ETP magistrat popup title
 */
const etpMagTitle = 'des ETPT siège'
/**
 * Variable ETP magistrat unité
 */
const etpMagToDefine = '[un volume moyen de]'

/**
 * Variable ETP fonctionnaire field name
 */
const etpFon = 'etpFon'
/**
 * Variable ETP fonctionnaire popup title
 */
const etpFonTitle = 'des ETPT greffe'
/**
 * Variable ETP fonctionnaire unité
 */
const etpFonToDefine = '[un volume moyen de]'

/**
 * Composant page simulateur
 */
@Component({
  templateUrl: './simulator.page.html',
  styleUrls: ['./simulator.page.scss'],

  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 })),
      ]),
      transition(':leave', [animate(0, style({ opacity: 0 }))]),
    ]),
  ],
})
export class SimulatorPage
  extends MainClass
  implements OnInit, IDeactivateComponent, OnDestroy
{
  /**
   * Wrapper de page contenant le simulateur
   */
  @ViewChild('wrapper') wrapper: WrapperComponent | undefined
  /**
   * Ouverture de la popup de modification de paramètre
   */
  openPopup: boolean = false
  /**
   * Indicateur de saisie date de début de simulation
   */
  mooveClass: string = ''
  /**
   * Indicateur de selection de paramètre de simulation
   */
  disabled: string = 'disabled'
  /**
   * Indicateur d'affichage du titre pour export PDF
   */
  printTitle: string = ''
  /**
   * Contentieux selectionné
   */
  contentieuId: number | null = null
  /**
   * Sous-contentieux selectionné(s)
   */
  subList: number[] = []
  /**
   * Tous les référentiel
   */
  formReferentiel: dataInterface[] = []
  /**
   * Situation à aujourd'hui ou date de début
   */
  firstSituationData: SimulatorInterface | null = null
  /**
   * Situation projetée à la date de fin
   */
  projectedSituationData: SimulatorInterface | null = null
  /**
   * Situation simulée à la date de fin
   */
  simulatedSationData: SimulationInterface | null = null
  /**
   * Référentiel selectionné
   */
  referentiel: ContentieuReferentielInterface[] = []
  /**
   * Date de début de simulation
   */
  dateStart: Date = new Date()
  /**
   * Date de fin de simulation
   */
  dateStop: Date | null = null
  /**
   * Date à aujourd'hui
   */
  today: Date = new Date()
  /**
   * Date de début format chaîne de charactère
   */
  startRealValue: string = ''
  /**
   * Date de fin format chaiîne de charactère
   */
  stopRealValue: string = ''
  /**
   * Nombre de mois contenu dans la période selectionnée
   */
  nbOfMonthWithinPeriod: number[] = []
  /**
   * Bouton de modification de paramètre clické
   */
  buttonSelected: any = undefined
  /**
   * Indicateur de réinitialisation pour les input de type %
   */
  resetPercentage: boolean = false
  /**
   * Objet d'édition de paramètre de simulation
   */
  valueToAjust = { value: '', percentage: null }
  /**
   * Correspond au noeud selectionné dans l'arbre de décision en fonction des paramètres édités lors de la simulation
   */
  currentNode: any | undefined = {}
  /**
   * Loader
   */
  isLoading: boolean = false
  /**
   * Catégorie selectionnée
   */
  categorySelected: string | null = null //'MAGISTRAT'
  /**
   * Liste des fonctions pour la catégorie selectionnée
   */
  functionsList: Array<any> = []
  /**
   * Identifiant(s) de fonction selectionnée(s)
   */
  selectedFonctionsIds: number[] = []
  /**
   * Constante en cours d'impression
   */
  onPrint: boolean = false
  /**
   * Actions de l'utilisateur
   */
  userAction: {
    isLeaving: boolean
    isReseting: boolean
    isResetingParams: boolean
    isComingBack: boolean
    isClosingTab: boolean
  } = {
    isLeaving: false, // L'utilisateur change d'onglet
    isReseting: false, // L'utilisateur réinitialise la simulation
    isResetingParams: false, // L'utilisateur réinitialise les paramètres ajusté
    isComingBack: false, // L'utilisateur revient en arrière depuis le bouton retour
    isClosingTab: false, // L'utilisateur ferme la fenêtre
  }
  /**
   * Liste des actions possibles
   */
  action: {
    reinit: string
    reinitAll: string
    return: string
    closeTab: string
    leave: string
  } = {
    reinit: 'réinitialiser',
    reinitAll: 'tout réinitialiser',
    return: 'retour',
    closeTab: 'close',
    leave: 'sort',
  }

  /**
   * Nom de la prochaine route lors d'un changement de page
   */
  nextState: string | null = null

  forceDeactivate: boolean = false

  /**
   * Listes des paramètres de la simulation à réinitialiser
   */
  valuesToReinit: any = null

  /**
   * URL des différentes documentations selon le simulateur sélectionnée
   */
  documentationUrl = {
    main: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/simulateur/quest-ce-que-cest',
    whiteSimulator:
      'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/simulateur-sans-donnees-pre-alimentees/quest-ce-que-cest',
  }

  /**
   * Documentation widget
   */
  documentation: DocumentationInterface = {
    title: 'Simulateur A-JUST :',
    path: this.documentationUrl.main,
    printSubTitle: true,
  }

  /**
   * Liste d'option pour les bouttons de la popup d'enregistrement, selon l'action de l'utilisateur
   */
  popupAction = {
    leaving: [
      { id: 'leave', content: 'Quitter sans exporter' },
      { id: 'export', content: 'Exporter en PDF et quitter', fill: true },
    ],
    reinit: [
      { id: 'reseting', content: 'Continuer sans exporter' },
      { id: 'export', content: 'Exporter en PDF et continuer', fill: true },
    ],
    closeTab: [
      { id: 'cancel', content: 'Annuler' },
      { id: 'export', content: 'Exporter en PDF', fill: true },
    ],
  }

  /**
   * Option à utiliser pour les bouttons de la popup d'enregistrement, selon l'action de l'utilisateur
   */
  popupActionToUse: (
    | { id: string; content: string; fill?: undefined }
    | { id: string; content: string; fill: boolean }
  )[] = [
    { id: '', content: '' },
    { id: '', content: '', fill: true },
  ]

  printPopup: boolean = false

  /**
   * Paramètres de simulation
   */
  paramsToAjust = {
    param1: {
      label: '',
      value: '',
      percentage: null,
      input: 0,
      button: { value: '' },
    },
    param2: {
      label: '',
      value: '',
      percentage: null,
      input: 0,
      button: { value: '' },
    },
  }
  /**
   * Liste complète de(s) paramètre(s) pouvant être gardé constant lors de la simulation
   */
  pickersParamsToLock = []
  /**
   * Liste de(s) paramètre(s) selectionnés à garder constant lors de la simulation
   */
  paramsToLock = {
    param1: { label: '', value: '' },
    param2: { label: '', value: '' },
  }
  /**
   * Arbre de décision de simulation magistrat
   */
  decisionTreeMag = tree
  /**
   * Arbre de décision de simulation fonctionnaire
   */
  decisionTreeFon = this.FonTree()

  /**
   * Ouverture popup selection de paramètre constant
   */
  toSimulate: boolean = false
  /**
   * Affichage de la simulation
   */
  toDisplaySimulation: boolean = false
  /**
   * Paramètre à afficher sans calcul supplémentaire lors de la restitution de la simulation
   */
  toDisplay = []
  /**
   * Paramètre à calculer lors de la restituation de la simulation
   */
  toCalculate = []
  /**
   * Activation du bouton simuler
   */
  simulateButton = 'disabled'

  /**
   * Backup hr à traiter lors de la simulation
   */
  hrBackup: BackupInterface | undefined
  /**
   * Backup hr global de l'application
   */
  hrBackups: BackupInterface[] = []
  /**
   * Peux voir l'interface magistrat
   */
  canViewMagistrat: boolean = false
  /**
   * Peux voir l'interface greffier
   */
  canViewGreffier: boolean = false
  /**
   * Peux voir l'interface contractuel
   */
  canViewContractuel: boolean = false
  /**
   * Commentaires pour PDF
   */
  commentaire: String = ''
  /**
   * Activation du simulator à blanc
   */
  whiteSimulator: boolean = false
  /**
   * Nombre de jour de simulation à blanc
   */
  whiteNbOfDays: number = 0
  /**
   * Affichage des boutons ajuster et simuler
   */
  displayWhiteElements: boolean = false
  /**
   * Affichage de l'écran de choix de simulateur
   */
  chooseScreen = true

  onReloadAction = false
  /**
   * Intro JS Steps
   */
  introSteps: IntroJSStep[] = [
    {
      target: '.intro-simulateur',
      title: 'Comment simuler votre trajectoire avec A-JUST ?',
      intro:
        'Cette fonctionnalité vous permet de déterminer l’impact d’une modification, choisie ou subie, de l’un des paramètres (effectifs, volumétrie de dossiers à traiter ou temps moyen passé sur chaque dossier) sur chacun des autres.<br/><br/>Elle est disponible pour les magistrats du siège comme pour les fonctionnaires et permet de se projeter dans le futur et de jouer des scénarios.',
    },
    {
      target: '.header-list',
      title: 'Effectuer votre simulation :',
      intro:
        'Découvrez, en <b>vidéo</b>, comment prévoir la trajectoire de votre ' +
        (this.isTJ() ? 'juridiction' : "cour d'appel") +
        ' pour un contentieux ou sous-contentieux considéré compte tenu des données renseignées, toutes choses restant égales par ailleurs.<br/><video controls autoplay class="intro-js-video"><source src="/assets/videos/simulez-votre-trajectoire-de-vol-avec-a-just.mp4" type="video/mp4" /></video><p>Et expérimentez l’A-JUSTement d’un ou deux paramètres de votre choix pour déterminer leur impact prévisible sur les autres selon les scenarii qui vous intéressent.</p><p>Nous vous y donnerons également toutes les clés pour <b>analyser les résultats de votre simulation</b>.</p>',
    },
    {
      target: '.intro-simulateur',
      title: 'Choisissez le type de simulation',
      intro:
        '<p>Vous pouvez <b>effectuer une simulation en utilisant les données renseignées dans A-JUST</b>, c’est ce que nous vous recommandons pour une vision fine de la trajectoire de votre ' +
        (this.isTJ() ? 'juridiction' : "cour d'appel") +
        ' sur des contentieux avec des données pré-alimentées par A-JUST.</p><p>Vous pouvez effectuer <b>une simulation sans données pré-alimentées</b> en renseignant les données d’effectifs et d’activité correspondantes. Ce peut être utile notamment pour jouer des scenarii sur des activités qui ne sont pas recensées en tant que telles dans A-JUST comme les activités administratives ou le soutien (gestion des scellés par ex.), ou des contentieux qui ne seraient pas isolés spécialement dans A-JUST.</p><p><b>Montrer deux boutons</b> : effectuer une simulation avec des données renseignées / effectuer une simulation sans données renseignées.</p>',
    },
    {
      target: '#content',
      title: 'Configurez votre hypothèse',
      intro:
        '<p>Commencez par choisir la catégorie <b>d’effectifs</b> pour laquelle vous souhaitez jouer un scénario : les magistrats du siège ou les agents du greffe. Ensuite, sélectionnez un <b>contentieux</b> dans le menu déroulant. Suivant votre besoin, vous pouvez affiner votre simulation en sélectionnant un sous-contentieux voire une fonction spécifique.</p><p>Enfin, déterminez <b>une date de début et de fin de période</b>, c’est à dire la date ou les dates du futur sur lesquelles vous souhaitez vous projeter ; </p><p><b>Nommez votre simulation</b> : c’est facultatif mais ça vous permettra de bien vous rappeler du champ sur lequel vous avez travaillé, notamment si vous enregistrez les résultats de votre simulation en PDF sur votre ordinateur.</p>',
      beforeLoad: async (intro: any) => {
        const itemToClick = document.querySelector('#on-button-continue')
        if (itemToClick) {
          // @ts-ignore
          itemToClick.click()
          await sleep(200)
        }
      },
    },
  ]

  /**
   * Constructeur
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private simulatorService: SimulatorService,
    private userService: UserService,
    private contentieuxOptionsService: ContentieuxOptionsService,
    private router: Router,
    private route: ActivatedRoute,
    private serverService: ServerService,
    private hubspotChatService: HubspotChatService
  ) {
    super()

    this.watch(
      this.simulatorService.disabled.subscribe((disabled) => {
        this.disabled = disabled
      })
    )
    this.watch(
      this.humanResourceService.backups.subscribe((backups) => {
        this.hrBackups = backups
        this.hrBackup = this.hrBackups.find(
          (b) => b.id === this.humanResourceService.backupId.getValue()
        )
        this.printTitle = `Simulation du ${this.hrBackup?.label} du ${new Date()
          .toJSON()
          .slice(0, 10)}`
      })
    )

    this.watch(
      this.humanResourceService.backupId.subscribe((backupId) => {
        this.hrBackups = this.humanResourceService.backups.getValue()
        this.hrBackup = this.hrBackups.find((b) => b.id === backupId)
        this.printTitle = `Simulation du ${this.hrBackup?.label} du ${new Date()
          .toJSON()
          .slice(0, 10)}`
      })
    )

    this.watch(
      this.contentieuxOptionsService.backupId.subscribe(() => {
        this.resetParams()
      })
    )

    this.watch(
      this.simulatorService.isValidatedWhiteSimu.subscribe((b) => {
        this.displayWhiteElements = b
        if (b === false) {
          this.toDisplaySimulation = false
          //this.simulatorService.situationSimulated.next(null)
          this.initParamsToAjust()
        }
      })
    )

    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
        this.canViewContractuel = userCanViewContractuel(u)
      })
    )

    this.watch(
      this.humanResourceService.categories.subscribe(() => {
        if (this.canViewMagistrat) {
          this.changeCategorySelected('MAGISTRAT')
          this.simulatorService.selectedFonctionsIds.next(
            this.selectedFonctionsIds
          )
        } else if (this.canViewGreffier) {
          this.changeCategorySelected('GREFFE')
          this.simulatorService.selectedFonctionsIds.next(
            this.selectedFonctionsIds
          )
        }
      })
    )

    const originalMsg = JSON.stringify(this.currentNode)
    let updatedMsg = this.replaceAll(originalMsg, etpMagTitle, etpFonTitle)
    updatedMsg = this.replaceAll(updatedMsg, etpMagToDefine, etpFonToDefine)
    updatedMsg = this.replaceAll(updatedMsg, etpMag, etpFon)
  }

  /**
   * Detect is TJ
   * @returns
   */
  isTJ() {
    return this.userService.interfaceType !== 1
  }

  /**
   * Détection de la fermeture de la fenêtre
   */
  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: Event) {
    if (this.toDisplaySimulation) {
      this.onUserActionClick(this.action.closeTab)
      event.preventDefault()
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: Event) {
    if (!this.chooseScreen) {
      this.chooseScreen = true
      this.resetParams()
    }
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy(): void {
    this.resetParams()
  }

  /**
   * Initialisation du composant
   */
  ngOnInit(): void {
    //this.hubspotChatService.loadHubSpotChat();
    this.resetParams()
    this.onResetUserAction()
    this.dateStop = null
    this.route.data.subscribe((data) => console.log('route:', data))
    const findCategory =
      this.humanResourceService.categories
        .getValue()
        .find(
          (c: HRCategoryInterface) =>
            c.label.toUpperCase() === this.categorySelected?.toUpperCase()
        ) || null

    this.simulatorService.selectedCategory.next(findCategory)

    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.id) === -1
        )
        this.formatReferentiel()
      })
    )

    this.watch(
      this.simulatorService.situationActuelle.subscribe((d) => {
        //console.log('Situation actuelle : ', d)
        this.firstSituationData =
          this.simulatorService.situationActuelle.getValue()
      })
    )

    this.watch(
      this.simulatorService.situationProjected.subscribe((d) => {
        //console.log('Situation proj : ', d)
        this.projectedSituationData =
          this.simulatorService.situationProjected.getValue()
      })
    )
    this.watch(
      this.simulatorService.situationSimulated.subscribe((d) => {
        if (d !== null) {
          //console.log('Situation simu : ', d)
          this.simulatedSationData = d
          const findTitle = document.getElementsByClassName('simulation-title')
          const findElement = document.getElementById('content')
          if (d && findElement && findTitle.length) {
            if (findElement) {
              const { top } = findTitle[0].getBoundingClientRect()
              findElement.scrollTo({
                behavior: 'smooth',
                top: top - 100,
              })
            }
          }
        }
      })
    )
    this.watch(
      this.simulatorService.isLoading.subscribe((d) => {
        this.isLoading = d
      })
    )

    this.watch(
      this.simulatorService.dateStart.subscribe((date) => {
        this.dateStart = date
        this.startRealValue = findRealValue(this.dateStart)
      })
    )
    this.watch(
      this.simulatorService.dateStop.subscribe((date) => {
        this.dateStop = date
        this.stopRealValue = findRealValue(this.dateStop)
      })
    )

    if (this.contentieuId)
      this.simulatorService.getSituation([this.contentieuId])

    this.loadFunctions()
  }

  /**
   * Affichage de la situation de début
   */
  displayBeginSituation() {
    return (
      this.simulatorService.contentieuOrSubContentieuId.getValue()?.length &&
      this.simulatorService.selectedFonctionsIds.getValue()?.length
    )
  }
  /**
   * Formatage du référentiel
   */
  formatReferentiel() {
    this.formReferentiel = this.referentiel.map((r) => ({
      id: r.id,
      value: this.referentielMappingNameByInterface(r.label),
      childrens: r.childrens?.map((s) => ({
        id: s.id,
        value: s.label,
        parentId: r.id,
      })),
    }))
  }

  /**
   * Selection de paramètre de simulation
   * @param type contentieux, sous-contentieux, date de début, date de fin
   * @param event capteur d'élément clické
   */
  updateReferentielSelected(type: string = '', event: any = null) {
    if (type === 'referentiel') {
      if (
        this.canViewMagistrat ||
        this.canViewGreffier
        //||this.canViewContractuel
      ) {
        this.subList = []
        const fnd = this.referentiel.find((o) => o.id === event[0])
        fnd?.childrens?.map((value) => this.subList.push(value.id))
        this.contentieuId = event[0]
        this.simulatorService.contentieuOrSubContentieuId.next([
          this.contentieuId as number,
        ])
        this.disabled = ''
        this.simulatorService.disabled.next(this.disabled)
      } else {
        alert(
          "Vos droits ne vous permettent pas d'exécuter une simulation, veuillez contacter un administrateur."
        )
      }
    } else if (type === 'subList') {
      this.subList = event
      const tmpRefLength = this.referentiel.find(
        (v) => v.id === this.contentieuId
      )

      if (!event.length) {
        this.disabled = 'disabled'
        this.simulatorService.disabled.next(this.disabled)
      } else {
        if (event.length === tmpRefLength?.childrens?.length)
          this.simulatorService.contentieuOrSubContentieuId.next([
            this.contentieuId as number,
          ])
        else
          this.simulatorService.contentieuOrSubContentieuId.next(this.subList)
        this.disabled = ''
        this.simulatorService.disabled.next(this.disabled)
      }
    } else if (type === 'dateStart') {
      this.dateStart = new Date(event)
      this.nbOfMonthWithinPeriod = monthDiffList(this.dateStart, this.dateStop)
      if (
        this.dateStart.getDate() !== this.today.getDate() ||
        this.dateStart.getMonth() !== this.today.getMonth() ||
        this.dateStart.getFullYear() !== this.today.getFullYear()
      )
        this.mooveClass = 'future'
      else if (this.dateStop === null) this.mooveClass = ''
      else this.mooveClass = 'present'
      this.disabled = 'disabled-date'
      this.simulatorService.disabled.next(this.disabled)

      this.simulatorService.dateStart.next(this.dateStart)
      this.startRealValue = findRealValue(this.dateStart)
    } else if (type === 'dateStop') {
      this.disabled = 'disabled-date'
      this.simulatorService.disabled.next(this.disabled)

      this.dateStop = new Date(event)
      if (
        this.dateStart.getDate() !== this.today.getDate() ||
        this.dateStart.getMonth() !== this.today.getMonth() ||
        this.dateStart.getFullYear() !== this.today.getFullYear()
      )
        this.mooveClass = 'future'
      else this.mooveClass = 'present'
      this.simulatorService.dateStop.next(this.dateStop)
      this.stopRealValue = findRealValue(this.dateStop)
      this.nbOfMonthWithinPeriod = monthDiffList(this.dateStart, this.dateStop)
    }
  }

  /**
   * Action lors de la selection d'une date simulateur à blanc
   */
  whiteDateSelector(type: string = '', event: any = null) {
    if (type === 'dateStart') {
      this.disabled = 'disabled-date'
      this.simulatorService.disabled.next(this.disabled)

      this.dateStart = new Date(event)
      this.startRealValue = findRealValue(this.dateStart)
      this.simulatorService.dateStart.next(this.dateStart)
    } else if (type === 'dateStop') {
      this.disabled = 'disabled-date'
      this.simulatorService.disabled.next(this.disabled)

      this.dateStop = new Date(event)
      this.stopRealValue = findRealValue(this.dateStop)
      this.simulatorService.dateStop.next(this.dateStop)
      this.whiteNbOfDays = nbOfDays(this.dateStart, this.dateStop)
    }
  }

  /**
   * Récupère un contentieux ou sous-contentieux grâce à son identifiant
   * @param id identifiant contentieux/sous-contentieux
   * @returns noeud du contentieux trouvé
   */
  getElementById(id: number | null) {
    return this.referentiel?.find((v) => v.id === id)
  }

  /**
   * Récupère la valeur d'un champs à afficher
   * @param param paramètre à afficher
   * @param data simulation
   * @param initialValue valeur initial
   * @param toCompute valeur calculé ou non
   * @returns valeur à afficher
   */
  getFieldValue(
    param: string,
    data: SimulatorInterface | SimulationInterface | null,
    initialValue = false,
    toCompute = false
  ): string {
    if (
      (this.simulatorService.situationActuelle.getValue() !== null &&
        this.subList.length) ||
      !this.getElementById(this.contentieuId)?.childrens?.length
    ) {
      return this.simulatorService.getFieldValue(
        param,
        data,
        initialValue,
        toCompute
      )
    }
    return ''
  }

  /**
   * Réinitalisation de simulation
   */
  resetParams(changeCategory = false) {
    this.contentieuId = null
    this.simulatorService.contentieuOrSubContentieuId.next(null)
    this.subList = []
    this.firstSituationData = null
    this.projectedSituationData = null
    this.dateStart = new Date()
    this.simulatorService.dateStart.next(this.dateStart)
    this.simulatorService.dateStop.next(new Date())
    this.simulatorService.situationProjected.next(null)
    this.dateStop = null
    this.startRealValue = ''
    this.stopRealValue = ''
    this.mooveClass = ''
    ;(this.documentation.path = this.documentationUrl.main),
      (this.toDisplaySimulation = false)
    //this.simulatorService.situationSimulated.next(null)
    document.getElementById('init-button')?.click()

    this.disabled = 'disabled'
    this.simulatorService.disabled.next(this.disabled)

    this.toDisplay = []
    this.toCalculate = []
    this.simulateButton = 'disabled'
    this.displayWhiteElements = false

    const initButton = document.getElementById('editable-sim-name')!
    if (initButton && !changeCategory) initButton.innerHTML = ''
  }

  /**
   *  Get minimum date you can select on the date picker
   */
  getMin(): Date {
    const date = new Date(this.dateStart)
    date.setDate(this.dateStart.getDate() + 1)
    return date
  }

  /**
   * Ouverture de popup avec le paramètre correspondant
   * @param button bouton clické
   */
  openPopupWithParams(button: any): void {
    this.buttonSelected = button
    let buttonToFind = button.id

    const treeToUse =
      this.categorySelected === 'MAGISTRAT'
        ? this.decisionTreeMag
        : this.decisionTreeFon

    const find = treeToUse.find((item: any) => item.label === buttonToFind)

    if (this.paramsToAjust.param1.input === 0) {
      this.currentNode = find
    }

    this.openPopup = true
  }

  /**
   * Conversion de l'arbre de décision pour les fonctionnaires
   * @returns arbre de décision
   */
  FonTree(): any {
    const originalMsg = JSON.stringify([...tree])
    let updatedMsg = this.replaceAll(originalMsg, etpMagTitle, etpFonTitle)
    updatedMsg = this.replaceAll(updatedMsg, etpMagToDefine, etpFonToDefine)
    updatedMsg = this.replaceAll(updatedMsg, etpMag, etpFon)
    return JSON.parse(updatedMsg)
  }

  /**
   * Remplace toutes les occurences de chaîne de caractère par une autre chaîne de caractère
   * @param string chaine de caractère à évaluer
   * @param search string recherchée
   * @param replace string venant en remplacement de celle recherchée
   * @returns chaine de caractère maj
   */
  replaceAll(string: string, search: string, replace: string) {
    return string.split(search).join(replace)
  }

  /**
   * Renseigne le paramètre à ajuster
   * @param volumeInput type d'input
   * @param inputField  input modifié
   * @param allButton liste de tous les boutons
   */
  setParamsToAjust(volumeInput: any, inputField: any, allButton: any): void {
    // get list of params to ajust from the currentNode selected
    const paramsToAjust =
      this.paramsToAjust.param1.input === 0 && this.currentNode
        ? this.currentNode.toAjust.map((x: any) => x.label)
        : null

    // if param comming from input type volume
    if (
      volumeInput &&
      (parseFloat(volumeInput) !== 0 ||
        (this.buttonSelected.id === 'lastStock' &&
          parseFloat(volumeInput) === 0) ||
        (this.buttonSelected.id === 'realDTESInMonths' &&
          parseFloat(volumeInput) === 0)) &&
      parseFloat(volumeInput) >= 0
    ) {
      // if param 1 not filled yet or if param 1 selected to be edited
      if (
        !this.paramsToAjust.param1.value ||
        this.paramsToAjust.param1.label === inputField.id
      ) {
        this.paramsToAjust.param1.value = volumeInput
        this.paramsToAjust.param1.label = inputField.id
        this.paramsToAjust.param1.input = 1
        this.paramsToAjust.param1.button = inputField
        this.paramsToAjust.param1.percentage = null
        this.disabled = 'disabled-only-date'
        this.simulatorService.disabled.next(this.disabled)

        //else edit param 2
      } else {
        this.paramsToAjust.param2.value = volumeInput
        this.paramsToAjust.param2.label = inputField.id
        this.paramsToAjust.param2.input = 1
        this.paramsToAjust.param2.button = inputField
        this.paramsToAjust.param2.percentage = null

        // disable all buttons excepted those already filled
        allButton.map((x: any) => {
          if (
            x.id !== this.paramsToAjust.param1.label &&
            x.id !== this.paramsToAjust.param2.label
          ) {
            x.classList.add('disable')
          }
        })
      }
      // if param comming from input type %
    } else if (this.valueToAjust.percentage !== '') {
      if (
        [
          'totalIn',
          'totalOut',
          'realCoverage',
          'magRealTimePerCase',
          'etpMag',
          'etpFon',
          'etpCont',
        ].includes(inputField.id) &&
        this.valueToAjust.percentage === null
      ) {
        alert('La valeur choisie ne peut pas être égale à 0')
        return
      }
      // if param 1 not filled yet or if param 1 selected to be edited
      if (
        this.paramsToAjust.param1.input === 0 ||
        this.paramsToAjust.param1.label === inputField.id
      ) {
        this.paramsToAjust.param1.value = this.valueToAjust.value
        this.paramsToAjust.param1.label = inputField.id
        this.paramsToAjust.param1.input = 2
        this.paramsToAjust.param1.button = inputField
        this.paramsToAjust.param1.percentage = this.valueToAjust.percentage
        this.disabled = 'disabled-only-date'
        this.simulatorService.disabled.next(this.disabled)

        //else edit param 2
      } else {
        this.paramsToAjust.param2.value = this.valueToAjust.value
        this.paramsToAjust.param2.label = inputField.id
        this.paramsToAjust.param2.input = 2
        this.paramsToAjust.param2.button = inputField
        this.paramsToAjust.param2.percentage = this.valueToAjust.percentage

        // disable all buttons excepted those already filled
        allButton.map((x: any) => {
          if (
            x.id !== this.paramsToAjust.param1.label &&
            x.id !== this.paramsToAjust.param2.label
          ) {
            x.classList.add('disable')
          }
        })
      }
      //else (no value filled in popup)
    } else {
      if (
        [
          'totalIn',
          'totalOut',
          'realCoverage',
          'magRealTimePerCase',
          'etpMag',
          'etpFon',
          'etpCont',
        ].includes(inputField.id) &&
        volumeInput === '0'
      ) {
        alert('La valeur choisie ne peut pas être égale à 0')
        return
      }
      // if param1 reset =>  reset all params
      if (inputField.id === this.paramsToAjust.param1.label) {
        this.paramsToAjust.param1.value = ''
        this.paramsToAjust.param1.label = ''
        this.paramsToAjust.param1.input = 0
        this.paramsToAjust.param1.percentage = null
        this.paramsToAjust.param2.value = ''
        this.paramsToAjust.param2.label = ''
        this.paramsToAjust.param2.input = 0
        this.paramsToAjust.param2.percentage = null
        allButton.map((x: any) => {
          x.classList.remove('disable')
        })
        this.paramsToAjust.param2.button.value = 'Ajuster'
        this.currentNode = undefined
        this.disabled = 'disabled-date'
        this.simulatorService.disabled.next(this.disabled)

        // else if param2 reset =>  reset only param2
      } else if (inputField.id === this.paramsToAjust.param2.label) {
        this.paramsToAjust.param2.value = ''
        this.paramsToAjust.param2.label = ''
        this.paramsToAjust.param2.input = 0
        this.paramsToAjust.param2.percentage = null
        const param1ToAjust = this.currentNode.toAjust.map((x: any) => x.label)

        allButton.map((x: any) => {
          if (param1ToAjust && param1ToAjust.includes(x.id))
            x.classList.remove('disable')
        })
      }
    }

    // get 1 result from inputs
    let result = -1
    if (volumeInput !== '')
      result =
        parseFloat(volumeInput) === 0
          ? this.buttonSelected.id === 'lastStock'
            ? 0
            : this.buttonSelected.id === 'realDTESInMonths'
            ? 0
            : -1
          : parseFloat(volumeInput) >= 0
          ? parseFloat(volumeInput)
          : -1
    else if (
      this.valueToAjust.value !== '' &&
      String(this.valueToAjust.value) !== 'NaN'
    )
      result = parseInt(this.valueToAjust.value)

    // if result
    if (result > -1) {
      // affect the value to the editable input
      if (
        inputField.id === 'magRealTimePerCase' &&
        !Number.isNaN(this.valueToAjust.value)
      ) {
        inputField.value = decimalToStringDate(
          Number(this.valueToAjust.value),
          ':'
        )
      } else if (inputField.id === 'magRealTimePerCase' && result) {
        inputField.value = decimalToStringDate(result, ':')
      } else if (inputField.id === 'realCoverage' && result)
        inputField.value = result + '%'
      else if (inputField.id === 'realDTESInMonths')
        inputField.value = result + ' mois'
      else inputField.value = result
      this.valueToAjust.value = ''

      allButton.map((x: any) => {
        if (
          paramsToAjust &&
          !paramsToAjust.includes(x.id) &&
          x.id !== inputField.id &&
          x.id !== paramsToAjust?.param1?.label &&
          x.id !== paramsToAjust?.param2?.label
        )
          x.classList.add('disable')
      })
    } else inputField.value = 'Ajuster'
    //close the popup
    this.openPopup = false

    this.valueToAjust = { value: '', percentage: null }
    if (
      this.paramsToAjust.param1.input !== 0 ||
      this.paramsToAjust.param2.input !== 0
    )
      this.simulateButton = ''
  }

  /**
   * Maj des paramètres à ajuster
   * @param event
   */
  onUpdateValueToAjust(event: any) {
    //only if percentage filled
    if (event.value === 0) {
      if (
        this.buttonSelected.id === 'lastStock' ||
        this.buttonSelected.id === 'realDTESInMonths'
      )
        this.valueToAjust = event
      else this.valueToAjust = { value: '', percentage: null }
    } else if (
      this.buttonSelected.id === 'magRealTimePerCase' &&
      event.percentage !== ''
    )
      this.valueToAjust = event
    else this.valueToAjust = event
  }

  /**
   * Sauvegarde de paramètre édité
   * @param input type de saisie
   * @returns valeur saisie
   */
  valueSaved(input: number): string {
    // if input type volume (quantity)
    if (input === 1) {
      if (this.buttonSelected.id === this.paramsToAjust.param1.label)
        return this.paramsToAjust.param1.input === 1
          ? this.paramsToAjust.param1.value
          : ''
      else
        return this.paramsToAjust.param2.input === 1
          ? this.paramsToAjust.param2.value
          : ''
      // if input type percentage (%)
    } else if (input === 2) {
      if (this.buttonSelected.id === this.paramsToAjust.param1.label)
        return this.paramsToAjust.param1.input === 2 &&
          this.paramsToAjust.param1.percentage !== null
          ? String(this.paramsToAjust.param1.percentage)
          : ''
      else
        return this.paramsToAjust.param2.input === 2 &&
          this.paramsToAjust.param2.percentage !== null
          ? String(this.paramsToAjust.param2.percentage)
          : ''
    }
    return ''
  }

  /**
   * Saisie de paramètre de type pourcentage
   * @param id nom du champs à éditer
   * @param projectedValue valeur projeté
   * @returns chaine de caractère de la valeur finale
   */
  percentageModifiedInputText(
    id: string,
    projectedValue: string | number | undefined
  ) {
    if (id === 'magRealTimePerCase' && projectedValue === -100) return ''
    if (
      id === 'realCoverage' &&
      this.paramsToAjust.param1.label === 'realCoverage'
    )
      return this.percantageWithSign(
        parseFloat(this.paramsToAjust.param1.value) -
          parseFloat(projectedValue as string)
      )
    if (
      id === 'realCoverage' &&
      this.paramsToAjust.param2.label === 'realCoverage'
    )
      return this.percantageWithSign(
        parseFloat(this.paramsToAjust.param2.value) -
          parseFloat(projectedValue as string)
      )

    return this.paramsToAjust.param1.label === id
      ? this.percantageWithSign(this.paramsToAjust.param1.percentage)
        ? this.percantageWithSign(this.paramsToAjust.param1.percentage)
        : this.ratio(this.paramsToAjust.param1.value, projectedValue as string)
      : this.percantageWithSign(this.paramsToAjust.param2.percentage)
      ? this.percantageWithSign(this.paramsToAjust.param2.percentage)
      : this.ratio(this.paramsToAjust.param2.value, projectedValue as string)
  }

  /**
   * Retourne une valeur avec le signe + ou -
   * @param value
   * @returns String contenant le chiffre ainsi que le signe + ou -
   */
  percantageWithSign(value: number | null) {
    if (value !== null && !isFinite(value)) return 'NA'
    return value && value >= 0 ? '+' + value : value
  }

  /**
   * Calcul la proportion d'une valeur par rapport à une autre
   * @param result numérateur
   * @param initialValue dénominateur
   * @returns Proportion de la valeur testé en %
   */
  ratio(result: string, initialValue: string) {
    const roundedValue =
      Math.round(
        (((parseFloat(result) - parseFloat(initialValue)) * 100) /
          parseFloat(initialValue as string)) *
          100
      ) / 100
    if (!isFinite(roundedValue)) return 'NA'
    return roundedValue >= 0 ? '+' + roundedValue : roundedValue
  }

  ratioStr(result: string, initialValue: string) {
    let res = this.ratio(result, initialValue)
    if (res === 'NA') return 'NA'
    else return res + '%'
  }
  /**
   * Soustrait 2 valeurs
   * @param value1
   * @param value2
   * @returns Résultat de la soustraction
   */
  calculCoverage(value1: number, value2: number) {
    return value1 - value2
  }

  /**
   * Cast une string en integer
   * @param value string
   * @returns integer
   */
  getReferenceValue(value: any, time = false) {
    if (time === true) {
      return stringToDecimalDate(value, ':')
    }
    return parseInt(value)
  }

  /**
   * Réinitialise l'ensemble des paramètres de la simulation
   * @param buttons bouton selecitonné
   */
  initParams(buttons: any) {
    this.initParamsToAjust()
    buttons.forEach((x: any) => {
      x.value = 'Ajuster'
      x.classList.remove('disable')
    })
    if (this.valuesToReinit) this.valuesToReinit = null
    //this.simulatorService.isValidatedWhiteSimu.next(false)
  }

  /**
   * Initialisation des paramètres à ajuster
   */
  initParamsToAjust() {
    this.toDisplaySimulation = false
    //this.simulatorService.situationSimulated.next(null)
    this.paramsToAjust = {
      param1: {
        label: '',
        value: '',
        percentage: null,
        input: 0,
        button: { value: '' },
      },
      param2: {
        label: '',
        value: '',
        percentage: null,
        input: 0,
        button: { value: '' },
      },
    }
    this.simulateButton = 'disabled'
    this.toDisplay = []
    this.toCalculate = []
    this.pickersParamsToLock = []
    this.paramsToLock = {
      param1: { label: '', value: '' },
      param2: { label: '', value: '' },
    }
  }

  /**
   * Retourne le titre complet d'un champs à éditer
   * @param label label correspondant à un input field (ex: etpMag)
   * @returns String correspondant au text associé au champs de saisi
   */
  getText(label: string): string {
    if (label === 'title') {
      if (
        this.buttonSelected.id === this.paramsToAjust.param1.label ||
        this.paramsToAjust.param1.input === 0
      )
        return this.currentNode.popupTitle
      else
        return this.currentNode.toAjust.find(
          (x: any) => x.label === this.buttonSelected.id
        ).popupTitle
    } else if (label === 'firstInput') {
      if (
        this.buttonSelected.id === this.paramsToAjust.param1.label ||
        this.paramsToAjust.param1.input === 0
      )
        return this.currentNode.toDefine[0]
      else
        return this.currentNode.toAjust.find(
          (x: any) => x.label === this.buttonSelected.id
        ).toDefine[0]
    } else if (label === 'secondInput') {
      if (
        this.buttonSelected.id === this.paramsToAjust.param1.label ||
        this.paramsToAjust.param1.input === 0
      )
        return this.currentNode.toDefine[1]
      else
        return this.currentNode.toAjust.find(
          (x: any) => x.label === this.buttonSelected.id
        ).toDefine[1]
    }
    return ''
  }

  /**
   * Retourne le nombre de paramètre à définir
   * @returns nombre de paramètre à définir
   */
  getNbOfParams(): number {
    if (
      this.buttonSelected.id === this.paramsToAjust.param1.label ||
      this.paramsToAjust.param1.input === 0
    )
      return this.currentNode.toDefine.length
    else
      return this.currentNode.toAjust.find(
        (x: any) => x.label === this.buttonSelected.id
      ).toDefine.length
  }

  /**
   * Edition du temps moyen par dossier cas particulier
   * @param button
   * @param event
   */
  valueChange(button: any, event: any) {
    if (this.buttonSelected.id === 'magRealTimePerCase' && event === 0)
      button.value = 'Ajuster'
    else button.value = event
  }

  /**
   * Générate simulation
   * @param allButton liste de tous les boutons clickables
   */
  simulate(allButton: any): void {
    this.paramsToLock = {
      param1: { label: '', value: '' },
      param2: { label: '', value: '' },
    }
    if (
      this.paramsToAjust.param1.input !== 0 &&
      this.paramsToAjust.param2.input !== 0
    ) {
      const find = this.currentNode.toAjust.find(
        (x: any) => x.label === this.paramsToAjust.param2.label
      ).toSimulate

      if (find.length > 1) {
        this.pickersParamsToLock = find.map((obj: any) => obj.locked)
        this.toSimulate = true
      } else {
        this.toSimulate = false
        this.toDisplaySimulation = true
        this.toDisplay = find[0].toDisplay
        this.toCalculate = find[0].toCalculate
        //compute ! no popup
        this.computeSimulation(allButton)
      }
    } else if (
      this.paramsToAjust.param1.input !== 0 &&
      this.paramsToAjust.param2.input === 0
    ) {
      if (this.currentNode.toSimulate.length > 1) {
        this.pickersParamsToLock = this.currentNode.toSimulate.map(
          (obj: any) => obj.locked
        )
        this.toSimulate = true
      } else {
        this.toSimulate = false
        this.toDisplaySimulation = true
        this.toDisplay = this.currentNode.toSimulate[0].toDisplay
        this.toCalculate = this.currentNode.toSimulate[0].toCalculate
        //compute ! no popup
        this.computeSimulation(allButton)
      }
    }
  }

  /**
   * Get the label of a field and return the full text name of the label
   * @param paramNumber
   * @returns text name of the label selected
   */
  getLockedParamLabel(paramNumber: number): string {
    if (this.pickersParamsToLock.length > 0)
      return this.simulatorService.getLabelTranslation(
        this.pickersParamsToLock[paramNumber]
      )
    return ''
  }

  /**
   * Run simulation
   * @param paramNumber index du paramètre à garder constant
   * @param allButton liste de tous les boutons clickables
   */
  selectParamToLock(paramNumber: number, allButton: any) {
    /** SI AUCUN PARAMETRE BLOQUE */
    if (this.paramsToLock.param1.label === '') {
      this.paramsToLock.param1.label = this.pickersParamsToLock[paramNumber]
      this.paramsToLock.param1.value = this.firstSituationData
        ? this.firstSituationData[this.pickersParamsToLock[paramNumber]]
        : ''

      /** SI 1 SEUL PARAMETRE AJUSTE */
      if (this.paramsToAjust.param2.input === 0) {
        const find = this.currentNode.toSimulate.find(
          (x: any) => x.locked === this.paramsToLock.param1.label
        )

        const objSecond =
          find && find.secondLocked
            ? find.secondLocked.map((obj: any) => obj.locked)
            : null

        if (objSecond !== null) {
          this.pickersParamsToLock = objSecond
        } else {
          this.toSimulate = false
          this.toDisplaySimulation = true
          this.toDisplay = find.toDisplay
          this.toCalculate = find.toCalculate
          this.computeSimulation(allButton)
        }

        /** SI 2 PARAMETRES A AJUSTER */
      } else {
        const find = this.currentNode.toAjust.find(
          (x: any) => x.label === this.paramsToAjust.param2.label
        )
        const objSecond =
          find && find.secondLocked
            ? find.secondLocked.map((obj: any) => obj.locked)
            : null

        if (objSecond !== null) {
          this.pickersParamsToLock = objSecond
        } else {
          const lastObj = find.toSimulate.find(
            (x: any) => x.locked === this.pickersParamsToLock[paramNumber]
          )
          this.toSimulate = false
          this.toDisplaySimulation = true
          this.toDisplay = lastObj.toDisplay
          this.toCalculate = lastObj.toCalculate
          this.computeSimulation(allButton)
        }
      }
      /** SI 1 PARAMETRE BLOQUE */
    } else if (this.paramsToLock.param2.label === '') {
      this.paramsToLock.param2.label = this.pickersParamsToLock[paramNumber]

      this.paramsToLock.param2.value = this.firstSituationData
        ? this.firstSituationData[this.pickersParamsToLock[paramNumber]]
        : ''

      this.toSimulate = false
      this.toDisplaySimulation = true
      if (
        this.paramsToAjust.param1.input !== 0 &&
        this.paramsToAjust.param2.input === 0
      ) {
        const find = this.currentNode.toSimulate.find(
          (x: any) => x.locked === this.paramsToLock.param1.label
        )
        const objSecond =
          find && find.secondLocked
            ? find.secondLocked.find(
                (obj: any) =>
                  obj.locked === this.pickersParamsToLock[paramNumber]
              )
            : null
        if (objSecond) {
          this.toDisplay = objSecond.toDisplay
          this.toCalculate = objSecond.toCalculate
          this.computeSimulation(allButton)
        } else {
          this.toDisplay = find.toDisplay
          this.toCalculate = find.toCalculate
          this.computeSimulation(allButton)
        }
      } else if (
        this.paramsToAjust.param1.input !== 0 &&
        this.paramsToAjust.param2.input !== 0
      ) {
        const find = this.currentNode.toAjust.find(
          (x: any) => x.label === this.paramsToAjust.param2.label
        )
        if (find && find.secondLocked) {
          const objSecond = find.secondLocked.find(
            (obj: any) => obj.locked === this.pickersParamsToLock[paramNumber]
          )
          this.toDisplay = objSecond.toDisplay
          this.toCalculate = objSecond.toCalculate
          this.computeSimulation(allButton)
        } else {
          this.toSimulate = false
          this.toDisplaySimulation = true
          this.toDisplay = find.toDisplay
          this.toCalculate = find.toCalculate
          this.computeSimulation(allButton)
        }
      }
    }
  }

  /**
   * Calcul de la simulation
   */
  computeSimulation(allButton: any) {
    const params = {
      beginSituation: this.firstSituationData,
      endSituation: this.projectedSituationData,
      lockedParams: this.paramsToLock,
      modifiedParams: this.paramsToAjust,
      toDisplay: this.toDisplay,
      toCalculate: this.toCalculate,
    }
    const simulation: SimulationInterface = {
      totalIn: null,
      totalOut: null,
      lastStock: null,
      etpMag: null,
      etpFon: null,
      etpCont: null,
      magRealTimePerCase: null,
      realDTESInMonths: null,
      realCoverage: null,
    }
    console.log('Launch simulation', params)
    if (this.hasNoNullValue(this.firstSituationData)) {
      this.toDisplaySimulation = true
      //this.simulateButton = 'disabled'
      allButton.map((x: any) => {
        x.classList.add('disable')
      })

      if (this.whiteSimulator) this.logRunWhiteSimulator(params)
      else this.logRunSimulator(params)

      this.simulatorService.toSimulate(params, simulation)
    } else {
      this.simulateButton = ''
      alert(
        'Les données en base ne permettent pas de calculer une simulation pour ce contentieux'
      )
    }
  }

  /**
   * Valider un paramètre lorsque la touche ENTREE est pressée
   * @param event
   * @param volumeInput
   * @param inputField
   * @param allButton
   */
  onKeypressEvent(
    event: any,
    volumeInput: any,
    inputField: any,
    allButton: any
  ) {
    if (event.which === 13) {
      this.setParamsToAjust(volumeInput, inputField, allButton)
    }
  }

  /**
   * Export pdf de simulation
   */
  async print() {
    if (this.commentaire.length <= 20000) {
      let contentieuLabel = this.referentiel
        .find((v) => v.id === this.contentieuId)
        ?.label.replace(' ', '_')
      const editableName = document.getElementById('editable-sim-name')

      const filename = `${
        editableName?.innerText === '' ? 'Simulation' : editableName?.innerText
      }${contentieuLabel ? '-' + contentieuLabel + '_' : '-A-JUST_'}par ${
        this.userService.user.getValue()!.firstName
      }_${this.userService.user.getValue()!.lastName!}_le ${new Date()
        .toJSON()
        .slice(0, 10)}.pdf`

      const title = document.getElementById('print-title')
      if (title) {
        title.classList.remove('display-none')
        title.style.display = 'flex'
      }

      const initButton = document.getElementById('main-init')
      if (initButton)
        //initButton.style.display = 'none'
        initButton.classList.add('display-none')

      const backButton = document.getElementById('main-back-menu')
      if (backButton) backButton.classList.add('display-none')

      const editButton = document.getElementById('editable-sim-name')
      if (editButton && editButton.innerHTML === '')
        editButton.style.display = 'none'
      else if (title) title.classList.add('display-none')

      const exportButton = document.getElementById('export-button')
      if (exportButton) {
        exportButton.classList.add('display-none')
      }

      const exportButton1 = document.getElementById('export-button-1')
      if (exportButton1) {
        exportButton1.classList.add('display-none')
      }

      const ajWrapper = document.getElementById('simu-wrapper')
      if (ajWrapper) ajWrapper?.classList.add('full-screen')

      const commentAreaCopy = document.getElementById('comment-area-copy')
      if (commentAreaCopy) commentAreaCopy.style.display = 'block'

      const commentArea = document.getElementById('comment-area')!
      if (commentArea) commentArea.classList.add('display-none')

      this.onPrint = true

      this.wrapper
        ?.exportAsPdf(filename, true, false, null, false /*true*/)
        .then(() => {
          title?.classList.add('display-none')

          this.onPrint = false
          ajWrapper?.classList.remove('full-screen')

          if (exportButton) exportButton.classList.remove('display-none')
          if (exportButton1) exportButton1.classList.remove('display-none')
          if (initButton) initButton.classList.remove('display-none')
          if (backButton) backButton.classList.remove('display-none')

          if (commentArea) {
            commentArea.style.display = 'block'
            commentArea.classList.remove('display-none')
            commentAreaCopy!.style.display = 'none'
          }

          if (editButton) {
            editButton!.style.display = 'block'
            editButton!.classList.remove('display-none')
          }
        })

      return new Promise((resolve, reject) => {
        setTimeout(() => resolve('Export done'), 200)
      })
    } else {
      alert(
        'Le commentaire que vous avez saisi comprend ' +
          this.commentaire.length +
          ' charactères. Il dépasse la limite de 20000 charactères autorisés.'
      )
      return new Promise((resolve, reject) => {
        setTimeout(() => reject('Comment too long'), 100)
      })
    }
  }

  /**
   * Changement de categorie selectionnée pour la simulation
   * @param category magistrat, fonctionnaire, greffier
   */
  changeCategorySelected(category: string | null) {
    if (
      this.humanResourceService.categories.getValue().length > 0 &&
      this.categorySelected !== category
    ) {
      this.categorySelected = category
      this.resetParams(true)
      this.contentieuId = null
      this.simulatorService.contentieuOrSubContentieuId.next(null)

      this.subList = []
      const findCategory =
        this.humanResourceService.categories
          .getValue()
          .find(
            (c: HRCategoryInterface) =>
              c.label.toUpperCase() === this.categorySelected?.toUpperCase()
          ) || null

      this.simulatorService.selectedCategory.next(findCategory)
      this.loadFunctions()
    }
  }

  /**
   * Chargement de la liste des fonctions
   */
  loadFunctions() {
    const finalList = this.humanResourceService.fonctions
      .getValue()
      .filter(
        (v) =>
          v.categoryId === this.simulatorService.selectedCategory.getValue()?.id
      )
      .map((f: HRFonctionInterface) => ({
        id: f.id,
        value: f.code,
      }))

    this.selectedFonctionsIds = finalList.map((a) => a.id)

    this.functionsList = finalList
    this.simulatorService.selectedFonctionsIds.next(this.selectedFonctionsIds)
  }

  /**
   * Selectionner une fonction
   * @param fonctionsId identifiant de la fonction choisie
   */
  onChangeFonctionsSelected(fonctionsId: string[] | number[]) {
    this.selectedFonctionsIds = fonctionsId.map((f) => +f)
    this.simulatorService.selectedFonctionsIds.next(this.selectedFonctionsIds)
  }

  /**
   * Verifie s'il n'y a pas de valeur null dans la simulation
   * @param obj
   * @returns
   */
  hasNoNullValue(obj: SimulatorInterface | null): boolean {
    if (obj && Object.values(obj).every((o) => o !== null)) return true
    else return false
  }

  /**
   * Indique le texte à renseigner dans le tooltip
   * @returns
   */
  getTooltipText() {
    return (
      'Evolution par rapport ' +
      (this.startRealValue !== '' ? 'au ' : 'à ') +
      (this.startRealValue || "aujourd'hui")
    )
  }

  /**
   * Troncage valeur numérique
   */
  trunc(
    param: string,
    data: SimulatorInterface | SimulationInterface | null,
    initialValue = false,
    toCompute = false
  ) {
    return (
      Math.trunc(
        Number(this.getFieldValue(param, data, initialValue, toCompute)) *
          100000
      ) / 100000
    )
  }

  /**
   * Set un commentaire
   * @param event
   */
  setComment(event: any) {
    this.commentaire = event.target.value
  }

  /**
   * Getter des parametres bloqués lors d'une simulation
   * @param index
   * @returns
   */
  getLockedResultedParams(index: number) {
    return index === 0
      ? this.simulatorService.getLabelTranslation(
          this.paramsToLock.param1.label
        )
      : this.simulatorService.getLabelTranslation(
          this.paramsToLock.param2.label
        )
  }

  /**
   * Bloque le champ de texte à 100 characters maximum
   * @param event
   * @returns
   */
  keyPress(event: any) {
    if (event.srcElement.innerHTML.length > 100) return false
    return true
  }

  /**
   * Prévenir dans le cas d'un ajustement de pourcentage induisant une division par 0 (mention du label NA à la place de la valeur en %)
   * @param id
   * @param projectedValue
   * @param ptsUnit
   * @returns
   */
  percentageModifiedInputTextStr(
    id: string,
    projectedValue: string | number | undefined,
    ptsUnit = false
  ) {
    let res = this.percentageModifiedInputText(id, projectedValue)
    if (ptsUnit) return res === 'NA' ? 'NA' : res + 'pts'
    return res === 'NA' ? 'NA' : res + '%'
  }

  canDeactivate(nextState: string) {
    if (this.toDisplaySimulation) {
      this.userAction.isLeaving = true
      this.nextState = nextState
      return this.forceDeactivate
    }
    return true
  }

  onReturn() {
    if (this.toDisplaySimulation) {
      this.onUserActionClick(this.action.return)
    } else {
      this.chooseScreen = true
      this.resetParams()
    }
  }

  onUserActionClick(button: string, paramsToInit?: any) {
    if (this.toDisplaySimulation) {
      this.printPopup = true
      if (paramsToInit) this.valuesToReinit = paramsToInit
      switch (button) {
        case this.action.reinit:
          {
            this.popupActionToUse = this.popupAction.reinit
            this.userAction.isResetingParams = true
          }
          break
        case this.action.reinitAll:
          {
            this.popupActionToUse = this.popupAction.reinit
            this.userAction.isReseting = true
          }
          break
        case this.action.return:
          {
            this.popupActionToUse = this.popupAction.leaving
            this.userAction.isComingBack = true
          }
          break
        case this.action.closeTab:
          {
            this.popupActionToUse = this.popupAction.closeTab
            this.userAction.isClosingTab = true
          }
          break
        case this.action.leave:
          {
            this.popupActionToUse = this.popupAction.leaving
            this.userAction.isLeaving = true
          }
          break
      }
    }
    return
  }

  onResetUserAction() {
    this.userAction.isLeaving = false
    this.userAction.isReseting = false
    this.userAction.isResetingParams = false
    this.userAction.isComingBack = false
    this.userAction.isClosingTab = false
  }

  async onPopupDetailAction(action: any) {
    if (this.userAction.isComingBack) {
      switch (action.id) {
        case 'leave':
          {
            this.printPopup = false
            this.onResetUserAction()
            this.resetParams()
            this.forceDeactivate = false
            this.chooseScreen = true
          }
          break
        case 'export':
          {
            this.printPopup = false
            this.onResetUserAction()
            this.forceDeactivate = true
            await this.print().then((res) => {
              this.resetParams()
              this.forceDeactivate = false
              this.chooseScreen = true
            })
          }
          break
      }
    } else if (this.userAction.isReseting) {
      switch (action.id) {
        case 'reseting':
          {
            this.printPopup = false
            this.onResetUserAction()
            this.resetParams()
          }
          break
        case 'export':
          {
            this.printPopup = false
            this.onResetUserAction()
            await this.print().then((res) => {
              this.resetParams()
            })
          }
          break
      }
    } else if (this.userAction.isResetingParams) {
      switch (action.id) {
        case 'reseting':
          {
            this.printPopup = false
            this.onResetUserAction()
            this.initParams(this.valuesToReinit)
          }
          break
        case 'export':
          {
            this.printPopup = false
            this.onResetUserAction()
            await this.print().then((res) => {
              this.initParams(this.valuesToReinit)
            })
          }
          break
      }
    } else if (this.userAction.isClosingTab) {
      switch (action.id) {
        case 'cancel':
          {
            this.printPopup = false
            this.onResetUserAction()
          }
          break
        case 'export':
          {
            this.printPopup = false
            this.onResetUserAction()
            this.print()
          }
          break
      }
    } else if (this.userAction.isLeaving) {
      switch (action.id) {
        case 'leave':
          {
            this.printPopup = false
            //this.forceDeactivate = true;
            this.onResetUserAction()
            this.resetParams()
            this.forceDeactivate = false
            if (this.nextState) {
              this.router.navigate([this.nextState])
            } else {
              this.onReloadAction = false
              this.chooseScreen = true
            }
          }
          break
        case 'export':
          {
            this.printPopup = false
            this.forceDeactivate = true
            this.onResetUserAction()
            await this.print().then(() => {
              this.resetParams()
              this.forceDeactivate = false
              if (this.nextState) {
                this.router.navigate([this.nextState])
              } else {
                this.onReloadAction = false
                this.chooseScreen = true
              }
            })
          }
          break
      }
    }
  }

  /**
   * Log du lancement d'une simulation
   */
  async logOpenWhiteSimulator() {
    history.pushState({}, 'simulateur', '/simulateur')
    await this.serverService
      .post('simulator/log-white-simulation')
      .then((r) => {
        return r.data
      })
  }

  /**
   * Log du lancement d'une simulation à blanc
   */
  async logOpenSimulator() {
    history.pushState({}, 'simulateur', '/simulateur')
    await this.serverService.post('simulator/log-simulation').then((r) => {
      return r.data
    })
  }

  /**
   * Log du lancement d'une simulation
   */
  async logRunWhiteSimulator(params: any) {
    await this.serverService
      .post('simulator/log-launch-white-simulation', { params })
      .then((r) => {
        return r.data
      })
  }

  /**
   * Log du lancement d'une simulation à blanc
   */
  async logRunSimulator(params: any) {
    await this.serverService
      .post('simulator/log-launch-simulation', { params })
      .then((r) => {
        return r.data
      })
  }

  /**
   * Demande de rechargement de la page
   */
  reloadPage() {
    if (this.toDisplaySimulation) {
      this.onUserActionClick(this.action.leave)
      this.onReloadAction = true
    } else {
      this.chooseScreen = true
      this.resetParams()
    }
  }

  /**
   * Récuperer le type de l'app
   */
  getInterfaceType() {
    return this.userService.interfaceType === 1
  }

  /**
   * Mapping des noms de contentieux selon l'interface
   * @param label
   * @returns
   */
  referentielMappingNameByInterface(label: string) {
    if (this.getInterfaceType() === true)
      return this.referentielCAMappingName(label)
    else return this.referentielMappingName(label)
  }

  /**
   * Changmenet de l'url de la documentation selon le simulateur sélectionnée
   * @param docUrl
   */
  setDocUrl(docUrl: string) {
    this.documentation.path = docUrl
  }
}
