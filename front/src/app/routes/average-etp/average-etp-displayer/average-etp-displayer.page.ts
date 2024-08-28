import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import * as FileSaver from 'file-saver'
import { isNumber } from 'lodash'
import { dataInterface } from 'src/app/components/select/select.component'
import { BackupInterface } from 'src/app/interfaces/backup'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { UserService } from 'src/app/services/user/user.service'
import { findRealValue } from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'
import { userCanViewGreffier, userCanViewMagistrat } from 'src/app/utils/user'
import { Renderer } from 'xlsx-renderer'
import { IDeactivateComponent } from '../../canDeactivate-guard-service'

/**
 * Excel file extension
 */
const EXCEL_EXTENSION = '.xlsx'


@Component({
  templateUrl: './average-etp-displayer.page.html',
  styleUrls: ['./average-etp-displayer.page.scss']
})
export class AverageEtpDisplayerPage extends MainClass implements OnDestroy, OnInit, IDeactivateComponent {
  /**
   * Référentiel complet
   */
  referentiel: ContentieuReferentielInterface[] = []
  /**
   * Unité de mesure de saisi
   */
  perUnity: string = 'hour'
  /**
   * En cours de chargement
   */
  isLoading: boolean = false
  /**
   * Label du referentiel selectionné
   */
  refNameSelected: string | null = null
  /**
   * Titre de la page
   */
  subTitleDate: string = ''
  /**
   * Sous titre de la page
   */
  subTitleName: string = ''
  /**
   * Sous titre de la page 2
   */
  subTitleType: string = ''
  /**
   * Catégorie selectionné (MAGISTRATS, FONCTIONNAIRES), null temps que l'on ne charge pas les droits utilisateurs
   */
  categorySelected: string | null = null
  /**
   * Liste des sauvegardes
   */
  backups: BackupInterface[] = []
  /**
   * Liste des sauvegardes des temps mouens
   */
  selectedIds: any[] = []
  /**
   * Liste des sauvegardes formatés pour le menu roulant
   */
  formDatas: dataInterface[] = []
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
   * Juridiction sélectionnée
   */
  backup: BackupInterface | undefined
  /**
   * Mémorisation s'il y a eu une modificiation avant sauvegarde
   */
  optionsIsModify: boolean = false
  /**
   * Ouverture popup sauvegarder avant de quitter
   */
  savePopup: boolean = false
  /**
   * Lien de retour selectionné
   */
  nextState: string = ''

  /**
   * Constructeur
   * @param contentieuxOptionsService
   * @param humanResourceService
   * @param referentielService
   * @param userService
   */
  constructor(
    private route: ActivatedRoute,
    private contentieuxOptionsService: ContentieuxOptionsService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    public userService: UserService,
    private router: Router,
  ) {
    super()

    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)

        // FILTRER BACKUPS AVEC LES DROITS
        if (this.canViewMagistrat) {
          this.categorySelected = 'MAGISTRATS'
        } else if (this.canViewGreffier) {
          this.categorySelected = 'FONCTIONNAIRES'
        } else {
          this.categorySelected = null
        }
      })
    )

    this.watch(
      this.contentieuxOptionsService.backups.subscribe((b) => {
        this.backups = b
        let id = this.contentieuxOptionsService.backupId.getValue()
        if (isNumber(id)) {
          this.backup = this.backups.find((value) => value.id === id)
          this.subTitleType = this.backup?.type || ''
        }
      })
    )



    this.watch(
      this.contentieuxOptionsService.initValue.subscribe((b) => {
        if (b === true) {
          this.referentiel.map((v) => {
            v.isModified = false
            v.averageProcessingTime = v.defaultValue
            if (v.childrens !== undefined) {
              v.childrens.map((child) => {
                if (child.isModified === true) {
                  child.isModified = false
                  child.averageProcessingTime = child.defaultValue
                }
              })
            }
          })
        }
      })
    )

    this.watch(
      this.contentieuxOptionsService.backupId.subscribe((backupId) => {
        console.log(backupId)
        if (backupId !== null) {
          this.onLoad(backupId)
          this.contentieuxOptionsService.getLastUpdate()
          this.referentiel.map((v) => {
            v.isModified = false
          })
        }
      })
    )

    this.watch(
      this.contentieuxOptionsService.contentieuxLastUpdate.subscribe(
        (lastUpdate) => {
          if (lastUpdate !== null && lastUpdate !== undefined) {
            const res =
              this.contentieuxOptionsService.contentieuxLastUpdate.getValue()
            if (res !== undefined && res.date) {
              let strDate = findRealValue(new Date(res.date))
              strDate = strDate === '' ? " aujourd'hui" : ' le ' + strDate
              this.subTitleDate = 'Mis à jour' + strDate + ', par '
              this.subTitleName = res.user.firstName + ' ' + res.user.lastName

            }
          } else {
            this.subTitleDate = ''
            this.subTitleName = ''
          }
        }
      )
    )

    this.watch(
      this.contentieuxOptionsService.optionsIsModify.subscribe(
        (b) => (this.optionsIsModify = b)
      )
    )

    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((b) => {
        let id = this.contentieuxOptionsService.backupId.getValue()
        if (id) {
          this.onLoad(id)
          this.backup = this.backups.find((value) => value.id === id)
          this.subTitleType = this.backup?.type || ''
        }
      }))

  }

  ngOnInit() {
    this.watch(
      this.route.params.subscribe((params) => {
        if (params['id']) {
          const id = +this.route.snapshot.params['id']
          this.contentieuxOptionsService.backupId.next(id)
          this.backup = this.backups.find((value) => value.id === id)
          console.log(this.backup)
          this.subTitleType = this.backup?.type || ''
        }
      })
    )
  }

  /**
   * Destruction des observables
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Fonction bloquage data non sauvegardé
   * @param nextState 
   * @returns 
   */
  canDeactivate(nextState: string) {
    if (this.contentieuxOptionsService.optionsIsModify.getValue() === true) {
      this.nextState = nextState
      this.savePopup = true
      return false
    }
    else
      return true
  }

  /**
   * Chargement des temps moyens par dossier
   * @param backupId
   */
  onLoad(backupId: number) {
    this.isLoading = true
    this.contentieuxOptionsService.loadDetails(backupId).then((options) => {
      this.contentieuxOptionsService.contentieuxOptions.next(options)
      const referentiels = [
        ...this.humanResourceService.contentieuxReferentiel.getValue(),
      ].filter(
        (r) =>
          this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
          this.referentielService.idsSoutien.indexOf(r.id) === -1
      )

      if (this.backup)
        this.referentiel = referentiels.map((ref) => {
          const getOption = options.find((a) => a.contentieux.id === ref.id)
          ref.averageProcessingTime =
            (getOption && getOption.averageProcessingTime) || null

          ref.defaultValue = ref.averageProcessingTime
          ref.isModified = false

          ref.childrens = (ref.childrens || []).map((c) => {
            const getOptionActivity = options.find(
              (a) => a.contentieux.id === c.id
            )
            c.averageProcessingTime =
              (getOptionActivity && getOptionActivity.averageProcessingTime) ||
              null

            c.defaultValue = c.averageProcessingTime
            c.isModified = false

            return c
          })

          return ref
        })


      this.contentieuxOptionsService.referentiel.next(this.referentiel)

      this.isLoading = false
    })
  }

  /**
   * Modification d'un temps moyen
   * @param referentiel
   * @param value
   * @param unit
   */
  onUpdateOptions(
    referentiel: ContentieuReferentielInterface,
    value: number,
    unit: string
  ) {
    console.log('update from displayer')
    if (
      value !== null &&
      fixDecimal(
        this.getInputValue(referentiel.averageProcessingTime, unit),
        100
      ) !== value
    ) {
      referentiel.averageProcessingTime = this.getInputValue(value, unit)
      this.contentieuxOptionsService.updateOptions({
        ...referentiel,
        averageProcessingTime: referentiel.averageProcessingTime,
      })
      referentiel.isModified = true
    }
  }

  /**
   * Change l'unité de mesure
   * @param unit
   */
  changeUnity(unit: string) {
    this.perUnity = unit
  }

  /**
   * Change les catégories
   * @param category
   */
  changeCategorySelected(category: string) {
    this.categorySelected = category
  }

  /**
   * Retourne le temps de traitement d'un point de vue humain
   * @param avgProcessTime
   * @param unit
   * @returns
   */
  getInputValue(avgProcessTime: any, unit: string, category?: string | null) {
    if (this.backup && this.backup.type)
      switch (this.backup.type) {
        case 'SIEGE':
          if (unit === 'hour') {
            return avgProcessTime
          } else if (unit === 'nbPerDay') {
            return 8 / avgProcessTime
          } else if (unit === 'nbPerMonth') {
            return (8 / avgProcessTime) * (208 / 12)
          }
          break
        case 'GREFFE':
          if (unit === 'hour') {
            return avgProcessTime
          } else if (unit === 'nbPerDay') {
            return 7 / avgProcessTime
          } else if (unit === 'nbPerMonth') {
            return (7 / avgProcessTime) * (229.57 / 12)
          }
          break
      }
    return '0'
  }

  /**
   * Modife le champs d'un temps mouens
   * @param referentiel
   * @param event
   * @param unit
   */
  getField(
    referentiel: ContentieuReferentielInterface,
    event: any,
    unit: string
  ) {
    event.target.blur()
    if (
      event.target.value !== '' &&
      fixDecimal(
        this.getInputValue(referentiel.averageProcessingTime, unit),
        100
      ) !== parseFloat(event.target.value)
    ) {
      this.onUpdateOptions(referentiel, event.target.value, unit)
      referentiel.isModified = true
    }
  }

  /**
   * Extraction des référentiels au format Excel
   */
  extractionExcel() {
    const tmpList = this.generateFlateList()
    this.refNameSelected = this.backup?.label || ''
    const viewModel = { referentiels: tmpList }

    fetch('/assets/template2.xlsx')
      // 2. Get template as ArrayBuffer.
      .then((response) => response.arrayBuffer())
      // 3. Fill the template with data (generate a report).
      .then((buffer) => {
        return new Renderer().renderFromArrayBuffer(buffer, viewModel)
      })
      // 4. Get a report as buffer.
      .then(async (report) => {
        return report.xlsx.writeBuffer()
      })
      // 5. Use `saveAs` to download on browser site.
      .then((buffer) => {
        const filename = this.contentieuxOptionsService.getFileName(this.refNameSelected)
        return FileSaver.saveAs(new Blob([buffer]), filename + EXCEL_EXTENSION)
      })
      .catch((err) => console.log('Error writing excel export', err))
  }

  /**
   * Génère un objet contenant l'ensemble des valeurs d'un référentiel
   * @returns 
   */
  generateFlateList() {
    const flatList = new Array()
    this.referentiel.map((x) => {
      flatList.push({
        ...this.getFileValues(x),
        ...x,
      })
      if (x.childrens) {
        x.childrens.map((y) => {
          flatList.push({
            ...this.getFileValues(y),
            ...y,
          })
        })
      }
    })
    return flatList
  }

  /**
   * Calcul les valeurs par jour et pas moi via la valeur de référence en heure
   * @param ref 
   * @returns 
   */
  getFileValues(ref: any) {
    return {
      id: Number(ref.id), nbPerDay: this.getInputValue(
        ref.averageProcessingTime,
        'nbPerDay',
      ),
      nbPerMonth: this.getInputValue(
        ref.averageProcessingTime,
        'nbPerMonth',
      )
    }
  }

  /**
   * Demande de réinitilisation des données de bases
   */
  onBackBackup() {
    this.contentieuxOptionsService.setInitValue()
  }

  /**
   * Popup de sauvegarde, action à effectuer
   */
  actionPopup(event: any) {
    if (event.id === 'cancel')
      this.savePopup = false
    else if (event.id === 'save') {
      this.contentieuxOptionsService.optionsIsModify.next(false)
      this.router.navigate([this.nextState])
      this.saveHR()
    }
  }

  /**
 * Demande de sauvegarde des nouvelles données saisies
 * @param isCopy 
 */
  saveHR() {
    this.contentieuxOptionsService.onSaveDatas(false)
  }
}



