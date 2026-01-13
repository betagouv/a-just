import { Component, inject, Input, OnChanges, OnDestroy } from '@angular/core'
import { listFormatedInterface, HumanResourceSelectedInterface } from '../../workforce/workforce.page'
import { sumBy } from 'lodash'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { MainClass } from '../../../libs/main-class'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { fixDecimal } from '../../../utils/numbers'
import { today } from '../../../utils/dates'
import { MatIconModule } from '@angular/material/icon'

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
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './records-update.component.html',
  styleUrls: ['./records-update.component.scss'],
})
export class RecordsUpdateComponent extends MainClass implements OnChanges, OnDestroy {
  humanResourceService = inject(HumanResourceService)

  /**
   * Filter categories to view
   */
  @Input() categoriesFiltered: number[] | null = null
  /**
   * List des categories
   */
  @Input() listFormated: listFormatedWithDatasInterface[] = []
  /**
   * All agents list
   */
  @Input() allPersons: HumanResourceSelectedInterface[] = []
  /**
   * Liste filtré pour l'affichage
   */
  listFormatedFiltered: listFormatedWithDatasInterface[] = []

  /**
   * Constructor
   */
  constructor() {
    super()

    this.watcherList.push(
      this.humanResourceService.contentieuxReferentielOnly.subscribe(() => {
        this.onLoadDatas()
      }),
    )
  }

  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  ngOnChanges() {
    this.onLoadDatas()
  }

  onLoadDatas() {
    const contentieux = this.humanResourceService.contentieuxReferentielOnly.getValue().map((c) => c.id)

    // console.log('listFormated', this.listFormated);
    this.listFormatedFiltered = this.listFormated
      .filter((category) => this.categoriesFiltered === null || (this.categoriesFiltered && this.categoriesFiltered.indexOf(category.categoryId) !== -1))
      .map((category) => {
        const listAgent = category.hr || []
        let agentFullComplete = 0
        listAgent.map((a) => {
          const percent = Number(
            sumBy(
              (a.currentActivities || []).filter((c) => contentieux.includes(c.contentieux.id)),
              'percent',
            ).toFixed(2),
          )

          if (percent === 100) {
            agentFullComplete++
          }
        })

        return {
          ...category,
          headerLabel: category.label && category.label.includes('Magistrat') ? 'Siège' : category.label,
          fullComplete: fixDecimal(listAgent.length ? (agentFullComplete / listAgent.length) * 100 : 0),
          lastUpdated: listAgent.length
            ? new Date(
                Math.max(
                  // @ts-ignore
                  ...listAgent.map((hr) => today(hr.updatedAt).getTime()),
                ),
              )
            : undefined,
        }
      })

    // On filtre les agents par catégorie et on récupère la date de dernière mise à jour pour chaque catégorie
    const mag = this.allPersons.filter((hr) => hr.category?.id === 1)
    const greff = this.allPersons.filter((hr) => hr.category?.id === 2)
    const eam = this.allPersons.filter((hr) => hr.category?.id === 3)

    const lastUpdatedMag = mag.length ? new Date(Math.max(...mag.map((hr) => today(hr.updatedAt).getTime()))) : undefined
    const lastUpdatedGreffe = greff.length ? new Date(Math.max(...greff.map((hr) => today(hr.updatedAt).getTime()))) : undefined
    const lastUpdatedEAM = eam.length ? new Date(Math.max(...eam.map((hr) => today(hr.updatedAt).getTime()))) : undefined

    this.listFormatedFiltered.forEach((category) => {
      if (category.categoryId === 1) {
        category.lastUpdated = lastUpdatedMag
      } else if (category.categoryId === 2) {
        category.lastUpdated = lastUpdatedGreffe
      } else if (category.categoryId === 3) {
        category.lastUpdated = lastUpdatedEAM
      }
    })
  }
}
