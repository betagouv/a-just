import { Component, Input, OnChanges } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { listFormatedInterface } from '../../workforce/workforce.page'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { sumBy } from 'lodash'
import { today } from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'

/**
 * Interface pour agencer la page
 */
interface listFormatedWithDatasInterface extends listFormatedInterface {
  /**
   * Pourcentage des fiches 100% ventilés
   */
  fullComplete?: number
  /**
   * Date de dernière mise à jours de la categorie
   */
  lastUpdated?: Date
  /**
   * Titre de la categorie
   */
  headerLabel?: string
}

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  selector: 'records-update',
  templateUrl: './records-update.component.html',
  styleUrls: ['./records-update.component.scss'],
})
export class RecordsUpdateComponent extends MainClass implements OnChanges {
  /**
   * Filter categories to view
   */
  @Input() categoriesFiltered: number[] | null = null
  /**
   * List des categories
   */
  @Input() listFormated: listFormatedWithDatasInterface[] = []
  /**
   * Liste filtré pour l'affichage
   */
  listFormatedFiltered: listFormatedWithDatasInterface[] = []

  /**
   * Constructor
   */
  constructor(private humanResourceService: HumanResourceService) {
    super()
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  ngOnChanges() {
    const contentieux = this.humanResourceService.contentieuxReferentielOnly
      .getValue()
      .map((c) => c.id)

    this.listFormatedFiltered = this.listFormated
      .filter(
        (category) =>
          this.categoriesFiltered === null ||
          (this.categoriesFiltered &&
            this.categoriesFiltered.indexOf(category.categoryId) !== -1)
      )
      .map((category) => {
        const listAgent = category.hr || []
        let agentFullComplete = 0
        listAgent.map((a) => {
          const percent = sumBy(
            (a.currentActivities || []).filter((c) =>
              contentieux.includes(c.contentieux.id)
            ),
            'percent'
          )

          if (percent === 100) {
            agentFullComplete++
          }
        })

        return {
          ...category,
          headerLabel:
            category.label && category.label.includes('Magistrat')
              ? 'Siège'
              : category.label,
          fullComplete: fixDecimal(
            listAgent.length ? (agentFullComplete / listAgent.length) * 100 : 0
          ),
          lastUpdated: listAgent.length
            ? new Date(
                Math.max(
                  ...listAgent.map((hr) => today(hr.updatedAt).getTime())
                )
              )
            : undefined,
        }
      })
  }
}
