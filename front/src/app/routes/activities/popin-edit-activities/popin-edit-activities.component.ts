import { Component, Input } from '@angular/core'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'

/**
 * Composant page activité
 */
@Component({
  selector: 'aj-popin-edit-activities',
  templateUrl: './popin-edit-activities.component.html',
  styleUrls: ['./popin-edit-activities.component.scss'],
})
export class PopinEditActivitiesComponent extends MainClass {
  /**
   * Référentiel
   */
  @Input() referentiel: ContentieuReferentielInterface | null = null

  /**
   * Constructeur
   * @param activitiesService
   * @param humanResourceService
   * @param referentielService
   * @param userService
   */
  constructor(
  ) {
    super()
  }
}
