import { Component, Input } from '@angular/core'
import { DATA_GITBOOK, NOMENCLATURE_DOWNLOAD_URL } from 'src/app/constants/documentation'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { AppService } from 'src/app/services/app/app.service'

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
  @Input() referentiel: ContentieuReferentielInterface | null = null
  /**
   * Databook url
   */
  DATA_GITBOOK = DATA_GITBOOK
  /**
   * Nomeclature url
   */
  NOMENCLATURE_DOWNLOAD_URL = NOMENCLATURE_DOWNLOAD_URL

  /**
   * Constructeur
   * @param appService
   */
  constructor(private appService: AppService) {
    super()
  }
}
