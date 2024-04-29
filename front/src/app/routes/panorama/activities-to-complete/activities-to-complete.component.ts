import { Component, OnDestroy, OnInit } from '@angular/core'
import { BackupInterface } from 'src/app/interfaces/backup';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { UserService } from 'src/app/services/user/user.service';
import { month } from 'src/app/utils/dates';

interface TagInterface {
  dateStart: Date;
  dateEnd: Date;
  selected: boolean;
  label: string;
}

interface ContentieuxSelected extends ContentieuReferentielInterface {
  lastDateWhithoutData: Date;
  childrens?: ContentieuxSelected[]
}

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
  templateUrl: './activities-to-complete.component.html',
  styleUrls: ['./activities-to-complete.component.scss'],
})
export class ActivitiesToCompleteComponent extends MainClass implements OnInit, OnDestroy {
  /**
   * Liste des tag d'interface
   */
  tags: TagInterface[] = [{
    dateStart: lastTwelve,
    dateEnd: now,
    selected: true,
    label: 'Les 12 derniers mois disponible'
  }, {
    dateStart: lastTrimestre,
    dateEnd: now,
    selected: false,
    label: 'Dernier trimestre disponible'
  }, {
    dateStart: lastMonth,
    dateEnd: now,
    selected: false,
    label: 'Dernier mois'
  }]
  /**
   * Liste des contentieux ayants un manque
   */
  list: ContentieuxSelected[] = []


  /**
   * Constructor
   */
  constructor(private userService: UserService, private humanResourceService: HumanResourceService, private activitiesService: ActivitiesService) {
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
            this.activitiesService.getLastMonthActivities().then((date) => {
              let max = new Date()

              if (date !== null) {
                date = new Date(date ? date : '')
                max = month(date, 0, 'lastday')
              }

              this.tags[this.tags.length - 1].label = `Dernier mois disponible : ${this.getShortMonthString(max)} ${max.getFullYear()}`
              this.tags[this.tags.length - 1].dateStart = month(date, 0)
              this.tags[this.tags.length - 1].dateEnd = month(date, 0, 'lastday')
              this.tags[0].dateEnd = month(date, 0, 'lastday')
              this.tags[0].dateStart = month(this.tags[0].dateEnd, -11)
              this.tags[0].label = `Les 12 derniers mois disponibles : ${this.getShortMonthString(this.tags[0].dateStart)} ${this.tags[0].dateStart.getFullYear()} à ${this.getShortMonthString(this.tags[0].dateEnd)} ${this.tags[0].dateEnd.getFullYear()}`
              this.tags[1].dateEnd = month(date, 0, 'lastday')
              this.tags[1].dateStart = month(this.tags[1].dateEnd, -2)
              this.tags[1].label = `Dernier trimestre disponible : ${this.getShortMonthString(this.tags[1].dateStart)} ${this.tags[1].dateStart.getFullYear()} à ${this.getShortMonthString(this.tags[1].dateEnd)} ${this.tags[1].dateEnd.getFullYear()}`

              this.onLoad()
            })
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
    const tagSelected = this.tags.filter(t => t.selected)

    if (!tagSelected.length) {
      return
    }

    this.activitiesService.getNotCompleteActivities(tagSelected[0].dateStart, tagSelected[0].dateEnd).then(list => {
      this.list = list
    })
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
  referentielMappingColorByInterface(label: string, opacity: number = 1) {
    if (this.getInterfaceType() === true)
      return this.referentielMappingColor(label, opacity)
    else return this.referentielCAMappingColor(label, opacity)
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
