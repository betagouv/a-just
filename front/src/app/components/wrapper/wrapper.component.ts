import { Component, ElementRef, EventEmitter, HostBinding, inject, Input, OnDestroy, Output, TemplateRef, ViewChild } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { ActionsInterface, PopupComponent } from '../popup/popup.component'
import { Title } from '@angular/platform-browser'
import { NewsComponent } from './news/news.component'
import { MainClass } from '../../libs/main-class'
import { DocumentationInterface } from '../../interfaces/documentation'
import { DateSelectorinterface } from '../../interfaces/date'
import { BackupInterface } from '../../interfaces/backup'
import {
  CALCULATE_DOWNLOAD_URL,
  DATA_GITBOOK,
  DATA_GITBOOK_CA,
  DOCUMENTATION_URL,
  DOCUMENTATION_URL_CA,
  IMPORT_ETP_TEMPLATE,
  IMPORT_ETP_TEMPLATE_CA,
  NOMENCLATURE_DOWNLOAD_URL,
  NOMENCLATURE_DOWNLOAD_URL_CA,
  NOMENCLATURE_DROIT_LOCAL_DOWNLOAD_URL,
} from '../../constants/documentation'
import { UserService } from '../../services/user/user.service'
import { HumanResourceService } from '../../services/human-resource/human-resource.service'
import { AppService } from '../../services/app/app.service'
import { ServerService } from '../../services/http-server/server.service'
import { ActivitiesService } from '../../services/activities/activities.service'
import { UserInterface } from '../../interfaces/user-interface'
import { addHTML } from '../../utils/js-pdf'
import { downloadFile } from '../../utils/system'
import { MatIconModule } from '@angular/material/icon'
import { CommonModule } from '@angular/common'
import { TextEditorComponent } from '../text-editor/text-editor.component'
import { SanitizeResourceUrlPipe } from '../../pipes/sanitize-resource-url/sanitize-resource-url.pipe'
import { MatMenuModule } from '@angular/material/menu'
import { HelpButtonComponent } from '../help-button/help-button.component'
import { DateSelectComponent } from '../date-select/date-select.component'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { BackButtonComponent } from '../back-button/back-button.component'
import { ReferentielService } from '../../services/referentiel/referentiel.service'
import { ExcelService } from '../../services/excel/excel.service'
import { KPIService } from '../../services/kpi/kpi.service'
import { REQUEST_USER_MANUAL, REQUET_HELP_PAGE } from '../../constants/log-codes'

/**
 * Interface de génération d'un commentaire
 */
interface ExportPDFInterface {
  /**
   * Nom du fichier d'export
   */
  filename: string
  /**
   * Prend en compte le header pour l'export
   */
  header: boolean
  /**
   * Ajoute un text dans la page d'intro de l'export
   */
  exportName: string
  /**
   * Show hide popup
   */
  noPopup?: boolean
}

/**
 * Composent de mise en page en mode connecté
 */

@Component({
  selector: 'aj-wrapper',
  standalone: true,
  imports: [
    NewsComponent,
    MatIconModule,
    CommonModule,
    PopupComponent,
    TextEditorComponent,
    SanitizeResourceUrlPipe,
    MatMenuModule,
    RouterLink,
    HelpButtonComponent,
    DateSelectComponent,
    MatProgressBarModule,
    BackButtonComponent,
  ],
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
})
export class WrapperComponent extends MainClass implements OnDestroy {
  router = inject(Router)
  route = inject(ActivatedRoute)
  userService = inject(UserService)
  humanResourceService = inject(HumanResourceService)
  appService = inject(AppService)
  titlePlatform = inject(Title)
  activitiesService = inject(ActivitiesService)
  serverService = inject(ServerService)
  excelService = inject(ExcelService)
  /**
   * Service de log des KPIs
   */
  kPIService = inject(KPIService)
  /**
   * Service to referentiel
   */
  referentielService = inject(ReferentielService)

  /**
   * DOM qui pointe sur le conteneur
   */
  @ViewChild('contener') contener: ElementRef<HTMLElement> | null = null
  /**
   * DOM qui pointe sur le content
   */
  @ViewChild('content') content: ElementRef<HTMLElement> | null = null
  /**
   * Attache de la css print pour formater la page quand elle est activé
   */
  @HostBinding('class.print') duringPrint: boolean = false
  /**
   * Class css dit sur c'est le mode dark
   */
  @Input() @HostBinding('class.dark-screen') isDarkScreen = false
  /**
   * Paramétrage d'un ng-template pour les boutons
   */
  @Input() actionTemplate: TemplateRef<any> | undefined
  /**
   * Paramétrage d'un ng-template pour les boutons (partie bottom du header)
   */
  @Input() actionTemplateBottom: TemplateRef<any> | undefined
  /**
   * Parmétrage d'un ng-template pour le titre et remplace le titre normal
   */
  @Input() titleTemplate: TemplateRef<any> | undefined
  /**
   * Parmétrage au niveau des boutons d'actions en haut à gauche
   */
  @Input() actionsLeftTemplate: TemplateRef<any> | undefined
  /**
   * Titre de page
   */
  @Input() title: string = ''
  /**
   * Sous titre de page
   */
  @Input() subtitle: string = ''
  /**
   * Nom complémentaire en sous titre
   */
  @Input() subtitleName: string = ''
  /**
   * Paramétrage d'un ng-template pour surcharger le sous titre
   */
  @Input() subtitleTemplate: TemplateRef<any> | undefined | null
  /**
   * Ajout d'un bouton "back" avec un url
   */
  @Input() backUrl: string = ''
  /**
   * Ajouter d'une ancre sur le lien de retour
   */
  @Input() backAnchor: string | undefined
  /**
   * Suppresion de la marge gauche
   */
  @Input() alignLeft: boolean | undefined
  /**
   * Affiche un loader ou non
   */
  @Input() isLoading: boolean = false
  /**
   * Affiche une bulle d'aide avec une doc derriere
   */
  @Input() documentation: DocumentationInterface | undefined | null
  /**
   * Affichage d'un calendreier pour choisir un mois de données à affihcer sur l'écran des données d'activités
   */
  @Input() dateSelector: DateSelectorinterface | undefined
  /**
   * Output pour recharger la page
   */
  @Output() pageSelected = new EventEmitter<string>()
  /**
   * Doc d'aide à afficher
   */
  documentationToShow: DocumentationInterface | undefined
  /**
   * Popup open
   */
  popin = false
  /**
   * Dit si le paneau d'aide est visible ou non
   */
  panelHelper: boolean = false
  /**
   * Récupération du numéro de version de l'app
   */
  versionNumber: string = import.meta.env.NG_APP_VERSION
  /**
   * Juridiction sélectionnée
   */
  hrBackup: BackupInterface | undefined
  /**
   * Id de juridiction sélectionnée
   */
  hrBackupId: number | null = null
  /**
   * Liste des juridictions à disposition de l'utilisateur
   */
  hrBackups: BackupInterface[] = []
  /**
   * URL de la documentation
   */
  DOCUMENTATION_URL = DOCUMENTATION_URL
  /**
   * URL de la doc de la calculatrice pour le calcul des ETP
   */
  CALCULATE_DOWNLOAD_URL = CALCULATE_DOWNLOAD_URL
  /**
   * Menu de gauche
   */
  menu: { label: string; path: string }[] = []
  /**
   * Answer of question
   */
  promptComment: boolean = false
  /**
   * Export PDF temp var
   */
  exportPDFTemp: ExportPDFInterface | null = null
  /**
   * Quill editor
   */
  quillEditor: any = null
  /**
   * Promise resolve export
   */
  exportAsPdfPromiseResolve: Function | null = null
  /**
   * Ouverture du menu
   */
  openTools: boolean = false
  /**
   * Constructeur
   * @param authService
   * @param router
   * @param userService
   * @param humanResourceService
   * @param appService
   * @param activitiesService
   */
  constructor() {
    super()
    this.appService.appLoading.next(true)
    this.watch(
      this.userService.user.subscribe((u) => {
        this.updateMenu(u)
      }),
    )

    this.watch(
      this.humanResourceService.backups.subscribe((backups) => {
        this.hrBackups = backups
        this.hrBackup = this.hrBackups.find((b) => b.id === this.hrBackupId)
        if (backups.length) this.appService.appLoading.next(false)
      }),
    )

    this.watch(
      this.humanResourceService.backupId.subscribe((backupId) => {
        this.hrBackupId = backupId
        this.hrBackup = this.hrBackups.find((b) => b.id === backupId)
      }),
    )

    if(this.route.snapshot.queryParams['b']) {
      this.backUrl = `/${this.route.snapshot.queryParams['b']}`
    }
  }

  /**
   * On Changes titles
   */
  ngOnChanges() {
    this.titlePlatform.setTitle((this.userService.isCa() ? 'A-Just CA | ' : 'A-Just TJ | ') + this.title)
  }

  /**
   * A la destruction du composant supprimer les watcher
   */
  ngOnDestroy() {
    this.appService.scrollPosition.set(0)
    this.watcherDestroy()
  }

  /**
   * Bouton déconnecter
   */
  onDisconnect() {
    this.router.navigate(['/logout'])
  }

  onSelectAction(event: any) {
    this.onDisconnect()
  }

  /**
   * Mise à jour du menu qui affiche les pages accéssibles
   * @param user
   */
  updateMenu(user: UserInterface | null) {
    this.menu = user ? this.userService.getAllUserPageUrl(user) : []
  }

  /**
   * Retourne si un url est le même que celui de la page actuelle
   * @param item
   * @returns
   */
  isSelected(item: any) {
    return `/${item.path}` === window.location.pathname
  }

  /**
   * Changement de la juridiction
   * @param id
   */
  onChangeHRBackup(id: number) {
    this.humanResourceService.backupId.next(id)
    this.router.navigate(['/panorama'])
  }

  /**
   * Export PDF du contenu et aussi au besoin du header
   * @param filename
   * @param header
   * @returns
   */
  async exportAsPdf(
    filename: string,
    header: boolean = true,
    promptComment: boolean = false,
    exportName: string | null = null,
    noPopup: boolean = false,
  ): Promise<any> {
    this.exportPDFTemp = {
      filename,
      header,
      exportName: exportName || '',
      noPopup,
    }

    const newPro = new Promise((resolve) => {
      this.exportAsPdfPromiseResolve = resolve
    })

    if (promptComment) {
      this.promptComment = true
    } else {
      this.askExportAsPdf()
    }

    return newPro
  }

  /**
   * Export PDF du contenu et aussi au besoin du header
   * @param comment
   * @returns
   */
  async askExportAsPdf(comment?: string): Promise<any> {
    if (!this.exportPDFTemp || !this.exportAsPdfPromiseResolve) {
      return
    }

    const { header, filename, exportName, noPopup } = this.exportPDFTemp
    this.duringPrint = true

    const element = this[header ? 'contener' : 'content']?.nativeElement

    if (!element) {
      this.exportAsPdfPromiseResolve(true)
      return
    }

    document.body.classList.add('remove-height')
    document.body.classList.add('on-print')
    if (!noPopup)
      this.appService.alert.next({
        text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
      })

    setTimeout(() => {
      html2canvas(element, {
        scale: 1.5,
      }).then(async (canvas) => {
        var width = canvas.width
        var height = canvas.height
        var doc

        if (comment) {
          const mainHtmlContainer = document.createElement('div')
          mainHtmlContainer.style.position = 'absolute'
          mainHtmlContainer.style.left = '200%'
          mainHtmlContainer.style.width = '400px'

          const htmlContainer = document.createElement('div')
          htmlContainer.style.position = 'relative'
          htmlContainer.style.padding = '16px 32px 32px 32px'

          const logo = document.createElement('img')
          logo.src = '/assets/icons/logos/white-192x192.png'
          logo.style.width = '50px'
          logo.style.height = '50px'
          logo.style.position = 'absolute'
          logo.style.top = '20px'
          logo.style.left = '30px'

          const title = document.createElement('p')
          title.style.fontSize = '18px'
          title.style.textAlign = 'left'
          title.style.fontFamily = 'Helvetica'
          title.style.marginTop = '64px'
          title.style.fontWeight = 'bold'
          title.innerHTML = exportName || ''

          const pCom = document.createElement('p')
          pCom.style.marginTop = '32px'
          pCom.style.fontSize = '14px'
          pCom.style.textAlign = 'left'
          pCom.style.fontFamily = 'Helvetica'
          pCom.innerHTML = 'Commentaire :'

          const commentDom = document.createElement('p')
          commentDom.style.fontSize = '10px'
          commentDom.style.textAlign = 'left'
          commentDom.style.fontFamily = 'Helvetica'
          commentDom.classList.add('p-with-child-Helvetica')
          comment = comment || ''
          if (comment.includes('<ol>')) {
            comment = comment.replace(/<ol>/gm, '<ul>')
            comment = comment.replace(/<\/ol>/gm, '</ul>')
            comment = comment.replace(/<span class="ql-ui" contenteditable="false"><\/span>/gm, '')
            comment = comment.replace(/<li data-list="bullet">/gm, '<li>&nbsp;&nbsp;&nbsp; • ')
            for (let i = 1; i < 10; i++) {
              const newCheck = new RegExp(`<li([^>]*)ql-indent-${i}([^>]*)>`, 'gm')
              const nbspList = '&nbsp;'.repeat(i * 3)
              comment = comment.replace(newCheck, `<li style="margin-left:${i * 30}px">${nbspList} • `)
            }
          }
          commentDom.innerHTML = comment
          //console.log('comment', comment);

          htmlContainer.appendChild(logo)
          htmlContainer.appendChild(title)
          htmlContainer.appendChild(pCom)
          htmlContainer.appendChild(commentDom)
          mainHtmlContainer.appendChild(htmlContainer)
          document.body.appendChild(mainHtmlContainer)

          const { width: w, height: h } = mainHtmlContainer.getBoundingClientRect()
          doc = new jsPDF(w > h ? 'l' : 'p', 'px', [w, h + 50], true)
          await addHTML(doc, htmlContainer)
          mainHtmlContainer.remove()

          doc.addPage([width / 2, height / 2], width > height ? 'l' : 'p')
        } else {
          doc = new jsPDF(width > height ? 'l' : 'p', 'px', [width / 2, height / 2], true)
        }

        doc.addImage(canvas.toDataURL('image/jpeg', 1), 'JPEG', 0, 0, width / 2, height / 2, '', 'FAST')
        doc.save(filename)

        this.duringPrint = false
        document.body.classList.remove('remove-height')
        document.body.classList.remove('on-print')

        if (this.exportAsPdfPromiseResolve) {
          this.exportAsPdfPromiseResolve(true)
        }
      })
    })
  }

  /**
   * onActionComment
   */
  onActionComment(action: ActionsInterface, htmlComment?: string) {
    switch (action.id) {
      case 'export':
        this.askExportAsPdf()
        break
      case 'export-with-comment':
        this.askExportAsPdf(htmlComment)
        break
      default:
        if (this.exportAsPdfPromiseResolve) {
          this.exportAsPdfPromiseResolve(true)
        }
        break
    }

    this.promptComment = false
  }

  /**
   * Click de demande d'ouverture ou de fermeture de paneau d'aide
   */
  onTogglePanelHelper() {
    this.panelHelper = !this.panelHelper
    if (this.documentation && this.panelHelper) {
      this.kPIService.register(REQUET_HELP_PAGE, this.documentation.path)
      this.onForcePanelHelperToShow(this.documentation)
    }
  }

  /**
   * Methode à disposition pour forcer l'ouverture du paneau, pratique pour un appel exterieur du composant
   * @param documentation
   */
  onForcePanelHelperToShow(documentation: DocumentationInterface | null, opened: boolean = true) {
    if (documentation) this.documentationToShow = documentation
    this.panelHelper = opened
  }

  /**
   * Demande de téléchargement du calculateur
   */
  onDownloadCalculator() {
    this.appService.alert.next({
      text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
    })
  }

  onSelect(path: string) {
    this.pageSelected.emit(path)
  }

  async downloadAsset(type: string, download = false) {
    this.kPIService.register(REQUEST_USER_MANUAL, type)

    let url = null
    if (type === 'guide-utilisateur') {
      url = this.userService.isCa() ? DOCUMENTATION_URL_CA : DOCUMENTATION_URL
    } else if (type === 'data-book') {
      if (this.userService.isCa()) {
        url = DATA_GITBOOK_CA
      } else {
        url = DATA_GITBOOK
      }
    } else if (type === 'nomenclature') {
      if (this.userService.isCa()) {
        url = NOMENCLATURE_DOWNLOAD_URL_CA
      } else {
        if (this.referentielService.isDroitLocal()) {
          url = NOMENCLATURE_DROIT_LOCAL_DOWNLOAD_URL
        } else {
          url = NOMENCLATURE_DOWNLOAD_URL
        }
      }
    } else if (type === 'calculatrice') url = this.CALCULATE_DOWNLOAD_URL
    else if (type === 'fiche-agent') {
      this.excelService.generateAgentFile()
      await this.serverService.post('centre-d-aide/log-documentation-link', {
        value: this.userService.isCa() ? IMPORT_ETP_TEMPLATE_CA : IMPORT_ETP_TEMPLATE,
      })
    }

    if (url) {
      await this.serverService.post('centre-d-aide/log-documentation-link', {
        value: url,
      })
      if (download) {
        downloadFile(url)
      } else {
        window.open(url)
      }
    }
  }

  /**
   * Changement de la date via le selecteur
   * @param date
   */
  changeMonth(date: Date) {
    this.activitiesService.activityMonth.next(date)
  }

  /**
   * Resize le wrapper lorsqu'il n'y a plus de news active
   * @param elem
   */
  refreshHeight(elem: any) {
    elem.style['padding-top'] = '0px'
  }

  /**
   * Save scroll position
   * @param event
   */
  onScroll(event: any) {
    this.appService.scrollPosition.set(event.target.scrollTop)
  }
}
