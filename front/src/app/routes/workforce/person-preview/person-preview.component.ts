import { Component, Input, OnDestroy, OnInit } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceSelectedInterface } from '../workforce.page'
import { FilterPanelInterface } from '../filter-panel/filter-panel.component'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'

/**
 * Paneau d'une fiche magistrat / fonctionnaire / contractuel
 */
@Component({
  selector: 'person-preview',
  templateUrl: './person-preview.component.html',
  styleUrls: ['./person-preview.component.scss'],
})
export class PersonPreviewComponent
  extends MainClass
  implements OnInit, OnDestroy
{
  /**
   * Fiche
   */
  @Input() hr: HumanResourceSelectedInterface = {
    opacity: 1,
    etpLabel: '',
    hasIndisponibility: 0,
    currentActivities: [],
    etp: 1,
    category: null,
    fonction: null,
    currentSituation: null,
    id: 0,
    situations: [],
    indisponibilities: [],
    updatedAt: new Date(),
  }
  /**
   * Filtre utilisateur
   */
  @Input() filterParams: FilterPanelInterface | null = null
  /**
   * Categorie text color
   */
  @Input() textColor: string = ''
  /**
   * Show component is visible
   */
  @Input() showComponent: boolean = false

  /**
   * Constructeur
   */
  constructor(private humanResourceService: HumanResourceService) {
    super()
  }

  /**
   * After DOM is create fetch event
   */
  ngOnInit() {
    this.watch(
      this.humanResourceService.componentIdsCanBeView.subscribe((s) => {
        this.showComponent = s.includes(this.hr.id)

        if (this.showComponent) {
          this.watcherDestroy()
        }
      })
    )

    this.humanResourceService.needIdToLoad(this.hr.id)
  }

  /**
   * Remove listenner
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }
}
