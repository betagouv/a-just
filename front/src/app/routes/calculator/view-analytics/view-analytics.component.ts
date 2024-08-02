import { Component, Input, OnDestroy, OnInit } from '@angular/core'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'

/**
 * Composant de la page en vue analytique
 */

@Component({
  selector: 'aj-view-analytics',
  templateUrl: './view-analytics.component.html',
  styleUrls: ['./view-analytics.component.scss'],
})
export class ViewAnalyticsComponent extends MainClass implements OnInit, OnDestroy {
  /**
   * Référentiel
   */
  referentiel: ContentieuReferentielInterface[] = []

  /**
   * Constructor
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService
  ) {
    super()
  }

  ngOnInit() {
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.id) === -1
        )
      })
    )
  }

  /**
   * Suppresion des observables lors de la suppression du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }
}
