import { Component, OnDestroy, OnInit } from '@angular/core'
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel'
import { ActivityInterface } from '../../../interfaces/activity'
import { UserInterface } from '../../../interfaces/user-interface'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { MainClass } from '../../../libs/main-class'
import { OPACITY_20 } from '../../../constants/colors'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { ActivitiesService } from '../../../services/activities/activities.service'
import { UserService } from '../../../services/user/user.service'
import { BackupInterface } from '../../../interfaces/backup'

/**
 * Interface de l'activité par human
 */
interface ActivityByHuman {
  /**
   * Contentieux
   */
  contentieux: ContentieuReferentielInterface
  /**
   * Activité
   */
  activity: ActivityInterface
  /**
   * Utilisateur
   */
  user: UserInterface
  /**
   * Historique
   */
  history: {
    /**
     * ID de l'historique
     */
    id: number
    /**
     * Date de la dernière modification
     */
    updatedAt: Date
  }
}

/**
 * Paneau des dernières activitiés
 */
@Component({
  selector: 'activities-last-modifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activities-last-modifications.component.html',
  styleUrls: ['./activities-last-modifications.component.scss'],
})
export class ActivitiesLastModificationsComponent extends MainClass implements OnInit, OnDestroy {
  /**
   * Liste des activités par human
   */
  list: ActivityByHuman[] = []
  /**
   * Opacité background des contentieux
   */
  OPACITY = OPACITY_20

  /**
   * Constructor
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private activitiesService: ActivitiesService,
    public userService: UserService,
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
          this.activitiesService.getLastUpdatedActivities().then((l) => {
            this.list = l
          })
        } else {
          this.list = []
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
}
