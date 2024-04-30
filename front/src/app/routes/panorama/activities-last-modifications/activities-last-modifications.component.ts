import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivityInterface } from 'src/app/interfaces/activity'
import { BackupInterface } from 'src/app/interfaces/backup'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { UserInterface } from 'src/app/interfaces/user-interface'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { UserService } from 'src/app/services/user/user.service'

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
    private activitiesService: ActivitiesService,
    private userService: UserService) {
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

  /**
  * Récuperer le type de l'app
  */
  getInterfaceType() {
    return this.userService.interfaceType === 1
  }

  /**
   * Mapping couleurs référentiel
   * @param label 
   * @returns 
   */
  referentielMappingColorByInterface(label: string,opacity:number=1) {
    if (this.getInterfaceType() === true)
      return this.referentielMappingColor(label,opacity)
    else return this.referentielCAMappingColor(label,opacity)
  }


  /**
 * Mapping des noms de contentieux selon l'interface
 * @param label 
 * @returns 
 */
  referentielMappingNameByInterface(label: string) {
    if (this.getInterfaceType() === true)
      return this.referentielCAMappingName(label)
    else return this.referentielMappingName(label)
  }
}
