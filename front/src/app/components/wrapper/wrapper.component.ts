import {
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  TemplateRef,
  ViewChild,
} from '@angular/core'
import { Router } from '@angular/router'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import {
  CALCULATE_DOWNLOAD_URL,
  DOCUMENTATION_URL,
} from 'src/app/constants/documentation'
import { BackupInterface } from 'src/app/interfaces/backup'
import { DocumentationInterface } from 'src/app/interfaces/documentation'
import { UserInterface } from 'src/app/interfaces/user-interface'
import { MainClass } from 'src/app/libs/main-class'
import { AppService } from 'src/app/services/app/app.service'
import { AuthService } from 'src/app/services/auth/auth.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { UserService } from 'src/app/services/user/user.service'
import { environment } from 'src/environments/environment'

/**
 * Composent de mise en page en mode connecté
 */

@Component({
  selector: 'aj-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
})
export class WrapperComponent extends MainClass implements OnDestroy {
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
   * Paramétrage d'un ng-template pour les boutons
   */
  @Input() actionTemplate: TemplateRef<any> | undefined
  /**
   * Parmétrage d'un ng-template pour le titre et remplace le titre normal
   */
  @Input() titleTemplate: TemplateRef<any> | undefined
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
  @Input() documentation: DocumentationInterface | undefined | null
  /**
   * Doc d'aide à afficher
   */
  documentationToShow: DocumentationInterface | undefined
  /**
   * Popup open
   */
  popin= false
  /**
   * Dit si le paneau d'aide est visible ou non
   */
  panelHelper: boolean = false
  /**
   * Récupération du numéro de version de l'app
   */
  versionNumber: string = environment.version
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
   * URL de la nomenclature
   */
  NOMENCLATURE_DOWNLOAD_URL =
    '/assets/Nomenclature_A-JUST_20221019_utilisateurs.html'
  /**
   * Menu de gauche
   */
  menu = [
    {
      label: 'Panorama',
      path: 'dashboard',
    },
  ]

  /**
   * Constructeur
   * @param authService
   * @param router
   * @param userService
   * @param humanResourceService
   * @param appService
   */
  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private humanResourceService: HumanResourceService,
    private appService: AppService,
  ) {
    super()

    this.watch(
      this.userService.user.subscribe((u) => {
        this.updateMenu(u)
      })
    )

    this.watch(
      this.humanResourceService.backups.subscribe((backups) => {
        this.hrBackups = backups
        this.hrBackup = this.hrBackups.find((b) => b.id === this.hrBackupId)
      })
    )

    this.watch(
      this.humanResourceService.backupId.subscribe((backupId) => {
        this.hrBackupId = backupId
        this.hrBackup = this.hrBackups.find((b) => b.id === backupId)
      })
    )
  }

  /**
   * A la destruction du composant supprimer les watcher
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Bouton déconnecter
   */
  onDisconnect() {
    this.authService.onLogout().then(() => {
      this.router.navigate(['/'])
    })
  }

  onSelectAction(event:any){

      this.onDisconnect() 

  }

  /**
   * Mise à jour du menu qui affiche les pages accéssibles
   * @param user
   */
  updateMenu(user: UserInterface | null) {
    const menu = []

    if (user && user.access && user.access.indexOf(2) !== -1) {
      menu.push({
        label: 'Ventilateur',
        path: 'ventilations',
      })
    }
    if (user && user.access && user.access.indexOf(3) !== -1) {
      menu.push({
        label: "Données d'activité",
        path: 'donnees-d-activite',
      })
    }

    if (user && user.access && user.access.indexOf(4) !== -1) {
      menu.push({
        label: 'Temps moyens',
        path: 'temps-moyens',
      })
    }

    if (user && user.access && user.access.indexOf(5) !== -1) {
      menu.push({
        label: 'Calculateur',
        path: 'calculateur',
      })
    }

    if (user && user.access && user.access.indexOf(6) !== -1) {
      menu.push({
        label: 'Simulateur',
        path: 'simulateur',
      })
    }

    this.menu = menu
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
  }

  /**
   * Export PDF du contenu et aussi au besoin du header
   * @param filename
   * @param header
   * @returns
   */
  async exportAsPdf(filename: string, header: boolean = true): Promise<any> {
    this.duringPrint = true
    const element = this[header ? 'contener' : 'content']?.nativeElement

    if (!element) {
      return new Promise((resolve) => {
        resolve(true)
      })
    }
    document.body.classList.add('remove-height')
    document.body.classList.add('on-print')

    return new Promise((resolve) => {
      setTimeout(() => {
        html2canvas(element, {
          scale: 1.5,
        }).then((canvas) => {
          var width = canvas.width
          var height = canvas.height

          var doc = new jsPDF(
            width > height ? 'l' : 'p',
            'px',
            [width / 2, height / 2],
            true
          )
          doc.addImage(
            canvas.toDataURL('image/jpeg', 1),
            'JPEG',
            0,
            0,
            width / 2,
            height / 2,
            '',
            'FAST'
          )
          doc.save(filename)

          this.duringPrint = false
          document.body.classList.remove('remove-height')
          document.body.classList.remove('on-print')
          resolve(true)
        })
      })
    })
  }

  /**
   * Click de demande d'ouverture ou de fermeture de paneau d'aide
   */
  onTogglePanelHelper() {
    this.panelHelper = !this.panelHelper
    if (this.documentation && this.panelHelper) {
      this.onForcePanelHelperToShow(this.documentation)
    }
  }

  /**
   * Methode à disposition pour forcer l'ouverture du paneau, pratique pour un appel exterieur du composant
   * @param documentation
   */
  onForcePanelHelperToShow(documentation: DocumentationInterface) {
    this.documentationToShow = documentation
    this.panelHelper = true
  }

  /**
   * Demande de téléchargement du calculateur
   */
  onDownloadCalculator() {
    this.appService.alert.next({
      text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
    })
  }

  /**
   * Ouverture de la nomenclature dans un nouvel onglet
   */
  onDownloadNomenclature() {
    window.open(this.NOMENCLATURE_DOWNLOAD_URL)
  }
}
