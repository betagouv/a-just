import { Component, OnDestroy, OnInit } from '@angular/core'
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { MainClass } from '../../../libs/main-class'
import { OPACITY_20 } from '../../../constants/colors'
import { UserService } from '../../../services/user/user.service'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { ActivitiesService } from '../../../services/activities/activities.service'
import { BackupInterface } from '../../../interfaces/backup'
import { month } from '../../../utils/dates'

/**
 * Interface de tag de visualisation
 */
interface TagInterface {
  /** Date de début */
  dateStart: Date
  /** Date de fin */
  dateEnd: Date
  /** Indicateur de sélection */
  selected: boolean
  /** Label du tag */
  label: string
}

/**
 * Interface de contentieux sélectionné
 */
interface ContentieuxSelected extends ContentieuReferentielInterface {
  /** Date de la dernière date sans données */
  lastDateWhithoutData: Date
  /**
   * Enfants du contentieux
   */
  childrens?: ContentieuxSelected[]
}

/**
 * Date actuelle
 */
const now = new Date()
now.setDate(10)
const lastTwelve = new Date(now)
lastTwelve.setFullYear(lastTwelve.getFullYear() - 1)
lastTwelve.setDate(lastTwelve.getDate() + 1)
const lastTrimestre = new Date(now)
lastTrimestre.setMonth(lastTrimestre.getMonth() - 3)
lastTrimestre.setDate(lastTrimestre.getDate() + 1)
const lastMonth = new Date(now)
lastMonth.setMonth(lastMonth.getMonth() - 1)
lastMonth.setDate(lastMonth.getDate() + 1)

/**
 * Activités à completer
 */
@Component({
  selector: 'activities-to-complete',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activities-to-complete.component.html',
  styleUrls: ['./activities-to-complete.component.scss'],
})
export class ActivitiesToCompleteComponent extends MainClass implements OnInit, OnDestroy {
  /**
   * Liste des tag d'interface
   */
  tags: TagInterface[] = [
    {
      dateStart: lastTwelve,
      dateEnd: now,
      selected: true,
      label: 'Les 12 derniers mois disponible',
    },
    {
      dateStart: lastTrimestre,
      dateEnd: now,
      selected: false,
      label: 'Dernier trimestre disponible',
    },
    {
      dateStart: lastMonth,
      dateEnd: now,
      selected: false,
      label: 'Dernier mois',
    },
  ]
  /**
   * Liste des contentieux ayants un manque
   */
  list: ContentieuxSelected[] = []

  /**
   * Opacité background des contentieux
   */
  OPACITY = OPACITY_20

  /**
   * Constructor
   */
  constructor(
    public userService: UserService,
    private humanResourceService: HumanResourceService,
    private activitiesService: ActivitiesService,
  ) {
    super()
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  ngOnInit() {
    this.watch(
      this.humanResourceService.hrBackup.subscribe((hrBackup: BackupInterface | null) => {
        if (hrBackup) {
          this.activitiesService.getLastMonthActivities().then((date) => {
            let max = new Date()

            if (date !== null) {
              date = new Date(date ? date : '')
              max = month(date, 0, 'lastday') || new Date()
            }

            this.tags[this.tags.length - 1].label = `Dernier mois disponible : ${this.getShortMonthString(max)} ${max.getFullYear()}`
            this.tags[this.tags.length - 1].dateStart = month(date, 0) || new Date()
            this.tags[this.tags.length - 1].dateEnd = month(date, 0, 'lastday') || new Date()
            this.tags[0].dateEnd = month(date, 0, 'lastday') || new Date()
            this.tags[0].dateStart = month(this.tags[0].dateEnd, -11) || new Date()
            this.tags[0].label = `Les 12 derniers mois disponibles : ${this.getShortMonthString(
              this.tags[0].dateStart,
            )} ${this.tags[0].dateStart.getFullYear()} à ${this.getShortMonthString(this.tags[0].dateEnd)} ${this.tags[0].dateEnd.getFullYear()}`
            this.tags[1].dateEnd = month(date, 0, 'lastday') || new Date()
            this.tags[1].dateStart = month(this.tags[1].dateEnd, -2) || new Date()
            this.tags[1].label = `Dernier trimestre disponible : ${this.getShortMonthString(
              this.tags[1].dateStart,
            )} ${this.tags[1].dateStart.getFullYear()} à ${this.getShortMonthString(this.tags[1].dateEnd)} ${this.tags[1].dateEnd.getFullYear()}`

            this.onLoad()
          })
        }
      }),
    )
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Select tags and reload datas
   * @param tagIndex
   */
  onSelectedTag(tagIndex: number) {
    this.tags = this.tags.map((t, i) => ({ ...t, selected: tagIndex === i }))

    this.onLoad()
  }

  /**
   * Chargement de la liste des contentieux
   */
  onLoad() {
    const tagSelected = this.tags.filter((t) => t.selected)

    if (!tagSelected.length) {
      return
    }

    this.activitiesService.getNotCompleteActivities(tagSelected[0].dateStart, tagSelected[0].dateEnd).then((list) => {
      this.list = list
    })
  }
}
