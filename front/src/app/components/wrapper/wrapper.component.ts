import {
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
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

@Component({
  selector: 'aj-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
})
export class WrapperComponent extends MainClass implements OnInit, OnDestroy {
  @ViewChild('contener') contener: ElementRef<HTMLElement> | null = null
  @ViewChild('content') content: ElementRef<HTMLElement> | null = null
  @HostBinding('class.print') duringPrint: boolean = false
  @Input() actionTemplate: TemplateRef<any> | undefined
  @Input() titleTemplate: TemplateRef<any> | undefined
  @Input() title: string = ''
  @Input() subtitle: string = ''
  @Input() subtitleTemplate: TemplateRef<any> | undefined | null
  @Input() backUrl: string = ''
  @Input() backAnchor: string | undefined
  @Input() alignLeft: boolean | undefined
  @Input() isLoading: boolean = false
  @Input() documentation: DocumentationInterface | undefined
  panelHelper: boolean = false
  versionNumber: string = environment.version
  hrBackup: BackupInterface | undefined
  hrBackupId: number | null = null
  hrBackups: BackupInterface[] = []
  DOCUMENTATION_URL = DOCUMENTATION_URL
  CALCULATE_DOWNLOAD_URL = CALCULATE_DOWNLOAD_URL
  menu = [
    {
      label: 'Panorama',
      path: 'dashboard',
    },
  ]

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private humanResourceService: HumanResourceService,
    private appService: AppService
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

  ngOnInit() {}

  ngOnDestroy() {
    this.watcherDestroy()
  }



  onDisconnect() {
    this.authService.onLogout().then(() => {
      this.router.navigate(['/'])
    })
  }

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

  isSelected(item: any) {
    return `/${item.path}` === window.location.pathname
  }

  onChangeHRBackup(id: number) {
    if (
      this.humanResourceService.hrIsModify.getValue() &&
      !confirm('Vous avez des modifications en cours. Supprimer ?')
    ) {
      return
    }
    this.humanResourceService.backupId.next(id)
  }

  async exportAsPdf(filename: string, header: boolean = true): Promise<any> {
    this.duringPrint = true
    const element = this[header ? 'contener' : 'content']?.nativeElement

    if (!element) {
      return new Promise((resolve) => {
        resolve(true)
      })
    }
    document.body.classList.add('remove-height')

    return new Promise((resolve) => {
      html2canvas(element, {
        scale: 1.5,
      }).then((canvas) => {
        var width = element.offsetWidth
        var height = element.offsetHeight

        var doc = new jsPDF(
          'p',
          'px',
          [width / 2, element.scrollHeight / 2],
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
        resolve(true)
      })
    })
  }

  onTogglePanelHelper() {
    this.panelHelper = !this.panelHelper
  }

  onDownloadCalculator() {
    this.appService.alert.next({
      text: 'Le téléchargement va démarrer dans quelques secondes.',
      delay: 5,
    })
  }
}
