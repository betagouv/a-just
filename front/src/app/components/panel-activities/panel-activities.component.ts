import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, inject } from '@angular/core'
import { cloneDeep, groupBy, sumBy, uniqBy } from 'lodash'
import { ProgressionBarComponent } from './progression-bar/progression-bar.component'
import { MainClass } from '../../libs/main-class'
import { RHActivityInterface } from '../../interfaces/rh-activity'
import { HRCategoryInterface } from '../../interfaces/hr-category'
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel'
import {
  DDG_REFERENTIELS_EAM,
  DDG_REFERENTIELS_EAM_CA,
  DDG_REFERENTIELS_GREFFE,
  DDG_REFERENTIELS_GREFFE_CA,
  DDG_REFERENTIELS_MAG,
  DDG_REFERENTIELS_MAG_CA,
  getReferentielCADetail,
  getReferentielDetail,
  REFERENTIELS_CANT_UPDATED,
} from '../../constants/referentiel'
import { OPACITY_20 } from '../../constants/colors'
import { HumanResourceService } from '../../services/human-resource/human-resource.service'
import { UserService } from '../../services/user/user.service'
import { importedVentillation } from '../../routes/human-resource/add-ventilation/add-ventilation.component'
import { fixDecimal } from '../../utils/numbers'
import { CommonModule } from '@angular/common'
import { BackupInterface } from '../../interfaces/backup'

/**
 * Interface pour les référentiels avec les pourcentages filtrés
 */
interface ContentieuReferentielInterfaceWithPercentFiltered extends ContentieuReferentielInterface {
  /**
   * Pourcentage filtré
   */
  percentFiltered?: number
  /**
   * Liste des sous référentiels avec les pourcentages filtrés
   */
  childrens?: ContentieuReferentielInterfaceWithPercentFiltered[]
}

/**
 * Composant d'affichage de la liste des ventilations en grilles
 */

@Component({
  selector: 'panel-activities',
  standalone: true,
  imports: [ProgressionBarComponent, CommonModule],
  templateUrl: './panel-activities.component.html',
  styleUrls: ['./panel-activities.component.scss'],
})
export class PanelActivitiesComponent extends MainClass implements OnChanges, OnDestroy {
  /**
   * Service de gestion des ressources humaines
   */
  humanResourceService = inject(HumanResourceService)
  /**
   * Service de gestion des utilisateurs
   */
  userService = inject(UserService)
  /**
   * ID de la fiche
   */
  @Input() id: number | null = null
  /**
   * Valeure de l'ETP
   */
  @Input() etp: number = 1
  /**
   * Liste des activités à trier
   */
  @Input() activities: RHActivityInterface[] = []
  /**
   * Affichage du panneau des sous contentieux ou non
   */
  @Input() selected: boolean = false
  /**
   * Affichage du header ou non
   */
  @Input() header: boolean = true
  /**
   * Autorise ou non la mise à jour du parent dès le premir chagement
   */
  @Input() updateRefentielOnLoad: boolean = true
  /**
   * Authorise la modification des % sélectionné
   */
  @Input() canSelectedTopReferentiel: boolean = false
  /**
   * Force pour afficher les sous contentieux
   */
  @Input() forceToShowContentieuxDetail: boolean = false
  /**
   * Show to place holder whihout information
   */
  @Input() showPlaceHolder: boolean = false
  /**
   * Show to place holder whihout information
   */
  @Input() indexSituation: number | null = null
  /**
   * Categorie courante
   */
  @Input() category: HRCategoryInterface | null = null
  /**
   * Permet de savoir si le panel est en cours d'édition
   */
  @Input() isEdited: boolean = false
  /**
   * Permet de savoir si le panel est en lecture seule
   */
  @Input() readonly: boolean = false
  /**
   * Permet de savoir si le panel doit afficher les sous backups
   */
  @Input() showSubBackups: boolean = true
  /**
   * Id du backup sélectionné
   */
  @Input() filterBackupId: number | null = null
  /**
   * Force l'erreur sur l'élément en cours d'édition
   */
  @Input() forceErrorOnEditElement: string | null = null
  /**
   * Informe le parent d'une modification
   */
  @Output() referentielChange: EventEmitter<ContentieuReferentielInterface[]> = new EventEmitter()
  /**
   * Informe le parent d'une modification des activités
   */
  @Output() activitiesChange: EventEmitter<RHActivityInterface[]> = new EventEmitter()
  /**
   * Liste du référentiel
   */
  referentiel: ContentieuReferentielInterfaceWithPercentFiltered[] = []
  /**
   * Liste des activités filtrées par backup
   */
  filteredActivites: RHActivityInterface[] = []
  /**
   * Total pourcent affecté
   */
  percentAffected: number = 0
  /**
   * Contientieux sélectionné
   */
  refIndexSelected: number = -1
  /**
   * Réfentiels que l'on ne peut pas modifier
   */
  REFERENTIELS_CANT_UPDATED = REFERENTIELS_CANT_UPDATED
  /**
   * État de la souris si elle hover un sous-référentiel du contentieux 'Autres Activités'
   */
  mouseHovering: boolean = false
  /**
   * Nom du sous-rérérentiel du contentieux 'Autres Activités' survolé
   */
  hoveredReferentielLabel: string | null = null
  /**
   * Detail du référentiel survolé
   */
  hoveredReferentielDetail: string | null = null
  /**
   * Opacité du background des contentieux
   */
  OPACITY = OPACITY_20
  /**
   * Current backups
   */
  currentBackups: BackupInterface[] = []

  /**
   * Constructeur
   * @param humanResourceService
   */
  constructor() {
    super()

    this.watch(
      this.humanResourceService.importedSituation.subscribe((referentiel) => {
        this.activities = []
        if (referentiel?.index === this.indexSituation && referentiel?.index !== null) {
          referentiel?.ventillation.map((elem: importedVentillation) => {
            this.onChangePercentWithoutTotalComputation(elem.referentiel, elem.percent || 0)
          })
        }
      }),
    )

    this.referentiel = cloneDeep(this.humanResourceService.contentieuxReferentielOnly.getValue())
  }

  ngOnInit() {}

  /**
   * Détection d'un changement et génération des données du rendu
   */
  ngOnChanges() {
    if (this.etp < 0) {
      this.etp = 0
    }

    // copy list of activities
    this.activities = JSON.parse(JSON.stringify(this.activities)) as RHActivityInterface[]

    const localBackups = groupBy(
      this.activities.filter((a) => a.backup),
      'backup.id',
    )
    this.currentBackups = uniqBy(
      Object.values(localBackups)
        .map((activities) => activities[0].backup)
        .filter((backup): backup is BackupInterface => backup !== undefined),
      'id',
    )

    this.updateFilteredActivites()
  }

  /**
   * Destruction des watcher
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Met à jour la liste des activités filtrées
   */
  updateFilteredActivites() {
    this.filteredActivites = this.filterBackupId ? this.activities.filter((ca) => ca.backup?.id === this.filterBackupId) : this.activities

    this.cleanFilteredActivites()

    this.onLoadReferentiel()
  }

  /**
   * Total de la ventilation affectée
   * @param ref
   * @returns
   */
  getPercentAffected(ref: ContentieuReferentielInterface, activities: RHActivityInterface[] = this.activities) {
    const filterActivities = activities.filter((a) => (a.contentieux ? a.contentieux.id === ref.id : a.referentielId === ref.id))
    const percent = fixDecimal(sumBy(filterActivities, 'percent'))

    return {
      percent,
      totalAffected: (this.etp * (percent || 0)) / 100,
    }
  }

  /**
   * Chargement du référentiel et calcul des pourcents
   */
  onLoadReferentiel() {
    this.referentiel = this.referentiel.map((ref) => {
      const { percent, totalAffected } = this.getPercentAffected(ref)
      ref.percent = percent
      ref.totalAffected = totalAffected

      const { percent: percentFiltered } = this.getPercentAffected(ref, this.filteredActivites)
      ref.percentFiltered = percentFiltered

      ref.childrens = (ref.childrens || []).map((c) => {
        const { percent, totalAffected } = this.getPercentAffected(c)
        c.percent = percent
        c.totalAffected = totalAffected

        const { percent: percentFiltered } = this.getPercentAffected(c, this.filteredActivites)
        c.percentFiltered = percentFiltered

        return c
      })
      return ref
    })

    if (this.updateRefentielOnLoad) {
      this.referentielChange.emit(this.referentiel)
    }
    this.onTotalAffected()
  }

  /**
   * Conversion de la somme des réferentiel en pourcent
   */
  onTotalAffected() {
    this.percentAffected = fixDecimal(sumBy(this.referentiel, 'percent'), 1000)
  }

  /**
   * Ouverture et fermeture du paneau des sous contentieux
   * @param index
   */
  onTogglePanel(index: number) {
    if (index !== this.refIndexSelected) {
      this.refIndexSelected = index
    } else {
      this.refIndexSelected = -1
    }
  }

  /**
   * Changement du pourcentage d'une activitié
   * @param referentiel
   * @param percent
   */
  onChangePercent(referentiel: ContentieuReferentielInterface, percent: number, parentReferentiel: ContentieuReferentielInterface | null = null) {
    const sameBackup = (activity: RHActivityInterface) => !this.filterBackupId || activity.backup?.id === this.filterBackupId
    const backup = this.filterBackupId ? { id: this.filterBackupId } : undefined

    const activity = this.activities.find((a) => a.contentieux.id === referentiel.id && sameBackup(a))
    if (activity) {
      activity.percent = percent
    } else {
      this.activities.push({
        id: -1,
        contentieux: {
          id: referentiel.id,
          label: '',
          averageProcessingTime: 0,
        },
        backup,
        referentielId: referentiel.id,
        percent,
      })
    }

    if (parentReferentiel) {
      const childId = (parentReferentiel.childrens || []).map((r) => r.id)
      const childActivities = this.activities.filter((a) => childId.indexOf(a.contentieux.id) !== -1 && sameBackup(a))
      const mainPercent = sumBy(childActivities, 'percent')
      const mainActivity = this.activities.find((a) => a.contentieux.id === parentReferentiel.id && sameBackup(a))
      if (mainActivity) {
        mainActivity.percent = mainPercent
      } else {
        this.activities.push({
          id: -1,
          contentieux: {
            id: parentReferentiel.id,
            label: '',
            averageProcessingTime: 0,
          },
          backup,
          referentielId: parentReferentiel.id,
          percent: mainPercent,
        })
      }
    } else {
      const childId = (referentiel.childrens || []).map((r) => r.id)
      this.activities = this.activities.filter((a) => childId.indexOf(a.contentieux.id) === -1 || !sameBackup(a))
    }

    this.activities = this.activities.filter((a) => a.percent)

    this.updateFilteredActivites()
    this.referentielChange.emit(this.referentiel)
    this.activitiesChange.emit(this.activities)
    this.onTotalAffected()
  }

  /**
   * Changement du pourcentage d'une activitié sans recalcul du total
   * @param referentiel
   * @param percent
   * @param parentReferentiel
   */
  onChangePercentWithoutTotalComputation(referentiel: ContentieuReferentielInterface, percent: number) {
    // memorise list
    const activity = this.activities.find((a) => a.contentieux.id === referentiel.id)
    if (activity) {
      activity.percent = percent
    } else {
      this.activities.push({
        id: -1,
        contentieux: {
          id: referentiel.id,
          label: '',
          averageProcessingTime: 0,
        },
        referentielId: referentiel.id,
        percent,
      })
    }

    this.onLoadReferentiel()
    this.referentielChange.emit(this.referentiel)
    this.onTotalAffected()
  }
  /**
   * Accélaration du rendu de la liste
   * @param index
   * @param item
   * @returns
   */
  trackById(index: number, item: any) {
    return item.id
  }

  /**
   * Compte le nombre de sous contentieux avec une valeure
   * @param referentiel
   * @returns
   */
  countNbSubItem(referentiel: ContentieuReferentielInterface) {
    return (referentiel.childrens || []).filter((r) => r.percent).length
  }
  /**
   * Change l'état de mouseHovering lorsque la souris hover un sous référentiel du contentieux 'Autres Activités'
   */
  setMouseHovering(label?: string) {
    if (label) {
      this.hoveredReferentielDetail = this.userService.isCa() ? getReferentielCADetail(label) : getReferentielDetail(label)
      if (this.hoveredReferentielDetail) this.hoveredReferentielLabel = label
      else this.hoveredReferentielLabel = null
    }
    this.mouseHovering = !this.mouseHovering
  }

  /**
   * Indique si le contentieux est un contentieux à saisir pour les DDG ou non
   */
  isDdgContentieux(label: string) {
    if (this.category?.label === 'Magistrat')
      if (this.userService.isCa()) return DDG_REFERENTIELS_MAG_CA.includes(label.toUpperCase())
      else return DDG_REFERENTIELS_MAG.includes(label.toUpperCase())
    if (this.category?.label === 'Greffe')
      if (this.userService.isCa()) return DDG_REFERENTIELS_GREFFE_CA.includes(label.toUpperCase())
      else return DDG_REFERENTIELS_GREFFE.includes(label.toUpperCase())
    if (this.category?.label === 'Autour du magistrat')
      if (this.userService.isCa()) return DDG_REFERENTIELS_EAM_CA.includes(label.toUpperCase())
      else return DDG_REFERENTIELS_EAM.includes(label.toUpperCase())
    return false
  }

  /**
   * Récuperer le type de l'app
   */
  getInterfaceType() {
    return this.userService.interfaceType === 1
  }

  /**
   * Check quel contentieux est survolé
   * @param label
   * @returns
   */
  checkHoveredRef(label: string) {
    const labelMapping = this.getInterfaceType() === true ? this.referentielCAMappingName(label) : this.referentielMappingName(label)
    return this.hoveredReferentielLabel === labelMapping
  }

  /**
   * cleanFilteredActivites
   */
  cleanFilteredActivites() {
    // on s'assure que le niveau 4 ait un parent
  }
}
