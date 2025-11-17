import { AfterViewInit, Component } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { CommonModule, Location } from '@angular/common'
import { orderBy } from 'lodash'
import { MainClass } from '../../libs/main-class'
import { WrapperComponent } from '../../components/wrapper/wrapper.component'
import { PopupComponent } from '../../components/popup/popup.component'
import { FormsModule } from '@angular/forms'
import { CheckboxComponent } from '../../components/checkbox/checkbox.component'
import { DocumentationInterface } from '../../interfaces/documentation'
import { BackupInterface } from '../../interfaces/backup'
import { UserService } from '../../services/user/user.service'
import { ContentieuxOptionsService } from '../../services/contentieux-options/contentieux-options.service'
import { userCanViewGreffier, userCanViewMagistrat } from '../../utils/user'
import { findRealValueCustom, getTime } from '../../utils/dates'
import { DateAgoPipe } from '../../pipes/date-ago/date-ago.pipe'

/**
 * Page des temps moyens par dossier
 */
@Component({
  standalone: true,
  imports: [CommonModule, WrapperComponent, PopupComponent, FormsModule, CheckboxComponent, DateAgoPipe],
  templateUrl: './average-etp.page.html',
  styleUrls: ['./average-etp.page.scss'],
})
export class AverageEtpPage extends MainClass implements AfterViewInit {
  /**
   * Lien de la doc
   */
  documentation: DocumentationInterface = {
    title: 'Référentiels de temps moyens :',
    path: '',
    printSubTitle: true,
  }
  /**
   * Peux voir l'interface magistrat
   */
  canViewMagistrat: boolean = false
  /**
   * Peux voir l'interface greffier
   */
  canViewGreffier: boolean = false
  /**
   * id de la juridiction
   */
  backupId: number | null = null
  /**
   * Liste des sauvegardes
   */
  backups: BackupInterface[] = []
  /**
   * Check list
   */
  checkList: boolean[] = []
  /**
   * Création demandée
   */
  onCreation: boolean = false
  /**
   * Suppression demandée
   */
  onDelete: boolean = false
  /**
   * Upload demandée
   */
  onUpload: boolean = false
  /**
   * Longueur du nom saisi
   */
  nameLength: number = 0
  /**
   * Ouverture provenant du cockpit
   */
  openedFromCockpit: boolean = false
  /**
   * Activer le bouton
   */
  enableImport: boolean = false

  /**
   * Constructor
   * @param userService
   */
  constructor(
    public userService: UserService,
    private contentieuxOptionsService: ContentieuxOptionsService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
  ) {
    super()

    // Vérification des droits
    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
      }),
    )

    // Chargement des référentiels
    this.watch(
      this.contentieuxOptionsService.backups.subscribe((b) => {
        console.log(b)
        this.backups = orderBy(
          b,
          [
            (val) => {
              const date = val.update?.date || val.date
              return getTime(date)
            },
          ],
          ['desc'],
        )
        this.backups = this.backups.filter((x) => {
          if (x.type === 'GREFFE' && this.canViewGreffier) return true
          if (x.type === 'SIEGE' && this.canViewMagistrat) return true
          else return false
        })
        this.backups.map(() => this.checkList.push(false))
      }),
    )

    this.userService.isCa()
      ? (this.documentation.path = 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/gerer-ses-referentiels-de-temps-moyens')
      : (this.documentation.path = 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/cockpit/gerer-ses-referentiels-de-temps-moyens')
  }

  ngAfterViewInit() {
    this.watch(
      this.route.params.subscribe((params) => {
        if (params['datestart'] && params['datestop'] && params['category']) {
          this.openedFromCockpit = true
          this.location.replaceState('/temps-moyens')
          this.onCreation = true

          setTimeout(() => {
            let elem = document.getElementById('type') as HTMLButtonElement
            if (elem) {
              const label = this.route.snapshot.params['category'] === 'magistrats' ? 'SIEGE' : 'GREFFE'
              elem.value = label
              elem.name = label
            }
          }, 100)
        }
      }),
    )
  }
  /**
   * Renvoi la date à un format d'affichage
   * @param date
   * @returns
   */
  realValue(date: Date) {
    return findRealValueCustom(new Date(date))
  }

  /**
   * Duplique un référentiel par ID
   * @param backupId
   * @param type
   */
  duplicate(backupId: number, type: string) {
    this.contentieuxOptionsService.duplicateBackupById(backupId, type)
  }

  /**
   * Demande de renommage de la sauvegarde
   */
  rename(backupId: number) {
    this.contentieuxOptionsService.renameBackupById(backupId)
  }

  /**
   * Suppression d'un backup
   */
  remove() {
    this.contentieuxOptionsService.removeBackupByIds(this.getSelectedBackups()).then(() => {
      setTimeout(() => {
        this.checkList = this.backups.map(() => false)
        this.onDelete = false
      }, 100)
    })
  }

  /**
   * Demande de suppresion d'une sauvegarde
   */
  onRemove() {
    if (this.getSelectedBackups().length) this.onDelete = true
  }

  /**
   * Récupère les backup selectionnées
   * @returns
   */
  getSelectedBackups() {
    return this.checkList
      .map((value, index) => {
        if (value === true) {
          return this.backups[index].id
        }
        return
      })
      .filter((x) => x !== undefined)
  }

  /**
   * Demande de création d'une sauvegarde vide
   */
  create(name: any, type: any) {
    if (name.length === 0) alert('Vous devez saisir un nom !')
    else if (name.length > 0 && type.length > 0) {
      this.contentieuxOptionsService.createEmpy(false, name, 'Local', type).then((data) => {
        this.onCreation = false
        this.nameLength = 0
        if (this.openedFromCockpit === true) {
          this.contentieuxOptionsService.openedFromCockpit.next({
            value: true,
            dateStart: new Date(this.route.snapshot.params['datestart']),
            dateStop: new Date(this.route.snapshot.params['datestop']),
            category: this.route.snapshot.params['category'],
          })
          setTimeout(() => {
            this.goTo(data)
          }, 100)
        } else
          this.contentieuxOptionsService.openedFromCockpit.next({
            value: false,
            dateStart: null,
            dateStop: null,
            category: null,
          })
        if (data)
          setTimeout(() => {
            this.goTo(data)
          }, 100)
      })
    }
  }

  /**
   * Selectionne tous les référentiels
   * @param value
   * @returns
   */
  checkAll(value?: boolean) {
    if (value !== undefined) this.checkList = this.backups.map(() => value)
    else if (this.checkList.length) {
      return this.checkList.reduce((accumulator, currentValue) => currentValue && accumulator)
    }
    return false
  }

  /**
   * Compte la taille d'une string
   * @param text
   */
  countLen(text: string) {
    this.nameLength = text.length
  }

  /**
   * Navigation vers un référentiel
   * @param id
   */
  goTo(id: number) {
    this.router.navigate(['/referentiel-de-temps', id])
  }

  /**
   * Envoie du fichier d'import
   * @param elem
   */
  async onSendAllActivity(elem: any) {
    try {
      await this.contentieuxOptionsService.onSendAllActivity(elem)
      this.enableImport = true
    } catch (e) {
      let form = document.getElementById('form') as HTMLFormElement
      form?.reset()
      alert("Le fichier n'est pas au bon format, veuillez vous assurer que le fichier correspond bien à la dernière version du template A-JUST.")
      throw e
    }
  }

  /**
   * Ouvre le selecteur de fichier
   */
  openFilePicker() {
    document.getElementById('filePicker')!.click()
  }

  /**
   * Import d'un référentiel
   */
  async import() {
    let form = document.getElementById('form') as HTMLFormElement
    let name = (document.getElementById('name') as HTMLTextAreaElement)?.value || ''
    let type = (document.getElementById('type') as HTMLButtonElement)?.name
    const file = form['file'].files[0]
    if (name.length === 0) alert('Vous devez saisir un nom !')
    else if (!file) {
      alert('Vous devez saisir une fichier !')
    } else if (name.length > 0 && type.length > 0) {
      this.enableImport = true
      await this.contentieuxOptionsService.createEmpy(false, name, 'Importé', type)
      this.contentieuxOptionsService.onSaveDatas(false, type).then(() => {
        const backupId = this.contentieuxOptionsService.backupId.getValue()
        if (backupId)
          setTimeout(() => {
            ;(this.goTo(backupId), 200)
          })
      })

      form.reset()
    }
  }

  /**
   * Téléchargement du template
   */
  downloadAsset() {
    this.contentieuxOptionsService.downloadTemplate(true)
  }

  /**
   * Get status bg color
   * @param status
   * @returns
   */
  getBackgroundColor(status: string) {
    switch (status) {
      case 'Importé':
        return '#c3fad5'
      case 'Local':
        return '#dee5fd'
      case 'Enregistré':
        return 'rgb(254, 246, 227)'
    }
    return '#c3fad5'
  }

  /**
   * Get status bg color
   * @param status
   * @returns
   */
  getColor(status: string) {
    switch (status) {
      case 'Importé':
        return '#00a95f'
      case 'Local':
        return '#465f9d'
      case 'Enregistré':
        return 'rgb(121, 104, 48)'
    }
    return '#c3fad5'
  }
}
