import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivityInterface } from 'src/app/interfaces/activity'
import { BackupInterface } from 'src/app/interfaces/backup'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { UserInterface } from 'src/app/interfaces/user-interface'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'

interface ActivityByHuman {
  contentieux: ContentieuReferentielInterface;
  activity: ActivityInterface;
  user: UserInterface;
  history: {
    id: number;
    updatedAt: Date;  
  }
}

/**
 * Paneau des dernières activitiés
 */
@Component({
  selector: 'activities-last-modifications',
  templateUrl: './activities-last-modifications.component.html',
  styleUrls: ['./activities-last-modifications.component.scss'],
})
export class ActivitiesLastModificationsComponent extends MainClass implements OnInit, OnDestroy {
  list: ActivityByHuman[] = []

  /**
   * Constructor
   */
  constructor(private humanResourceService: HumanResourceService,
    private activitiesService: ActivitiesService) {
    super()
  }

   /**
   * Initialisation des datas au chargement de la page
   */
   ngOnInit() {
    this.watch(
      this.humanResourceService.hrBackup.subscribe(
        (hrBackup: BackupInterface | null) => {
          if (hrBackup) {
              this.activitiesService.getLastUpdatedActivities().then((l) => {
              this.list = l
            })
          } else {
            this.list = []
          }
        }
      )
    )
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }
}
