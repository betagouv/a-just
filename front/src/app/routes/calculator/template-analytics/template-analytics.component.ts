import { Component, Input, OnDestroy, OnInit } from '@angular/core'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'

export interface AnalyticsLine {
  title: string
  description?: string
  type: string
  values?: number[][]
  lineMax: number
  variations: {
    label: string
    isOption?: boolean
    values: (number | string | null)[]
    subTitle?: string
    showArrow?: boolean
    type?: string
    dateStart?: Date
    dateStop?: Date
    graph?: {
      type: string
      dateStart: Date
      dateStop: Date
      color: string
    }
  }[]
  optionsVisibles?: boolean
}

/**
 * Composant de la page en vue analytique
 */

@Component({
  selector: 'aj-template-analytics',
  templateUrl: './template-analytics.component.html',
  styleUrls: ['./template-analytics.component.scss'],
})
export class TemplateAnalyticsComponent
  extends MainClass
  implements OnInit, OnDestroy
{
  /**
   * Référentiel
   */
  referentiel: ContentieuReferentielInterface[] = []
  /**
   * Templates
   */
  @Input() lines: AnalyticsLine[] = []

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

  ngOnChanges() {}

  getOptionsToShow(line: AnalyticsLine) {
    const options = line.variations || []
    return line.optionsVisibles
      ? options.filter((o) => o.isOption === true || o.isOption === undefined)
      : options.filter((o) => o.isOption === false || o.isOption === undefined)
  }

  hasOption(line: AnalyticsLine) {
    const options = line.variations || []
    return options.filter((o) => o.isOption === true).length
  }

  getGraphs(
    line: AnalyticsLine
  ): { type: string; dateStart: Date; dateStop: Date; color: string }[] {
    // @ts-ignore
    return this.getOptionsToShow(line)
      .filter((o) => o.graph)
      .map((o) => o.graph)
  }
}
