import { Component, effect } from '@angular/core'
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

interface ActivityByHuman {
  contentieux: ContentieuReferentielInterface
  activity: ActivityInterface
  user: UserInterface
  history: {
    id: number
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
export class ActivitiesLastModificationsComponent extends MainClass {
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

    effect(() => {
      const backupId = this.humanResourceService.backupIdS()
      this.loadDatas(backupId)
    })
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  async loadDatas(backupId: number | null = null) {
    if (backupId !== null) {
      const list = await this.activitiesService.getLastUpdatedActivities()
      this.list = list || []
    } else {
      this.list = []
    }
  }
}
