import { Component, Input, OnChanges } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { listFormatedInterface } from '../../workforce/workforce.page'
import { sumBy } from 'lodash'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ucFirst } from 'src/app/utils/string'

/**
 * Interface pour agencer la page
 */
interface listFormatedWithDatasInterface extends listFormatedInterface {
  /**
   * Nombre d'agents de la categorie
   */
  nbPerson?: number
  /**
   * Total ETPT de la categorie
   */
  etpt?: number
  /**
   * Titre de la categorie
   */
  headerLabel?: string
  /**
   * Poste
   */
  poste?: {label: string, etpt: number, total: number}[]
}

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  selector: 'workforce-composition',
  templateUrl: './workforce-composition.component.html',
  styleUrls: ['./workforce-composition.component.scss'],
})
export class WorkforceCompositionComponent
  extends MainClass
  implements OnChanges
{
  /**
   * List des categories
   */
  @Input() listFormated: listFormatedWithDatasInterface[] = []

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

    this.listFormated = this.listFormated.map((category) => {
      const listAgent = category.hr || []
      let etpt = 0
      listAgent.map((a) => {
        const etp = a.etp
        const percent = sumBy(
          (a.currentActivities || []).filter((c) =>
            contentieux.includes(c.contentieux.id)
          ),
          'percent'
        ) / 100
        const indispo = a.hasIndisponibility

        let etptAgent = etp * percent - indispo
        if (etptAgent < 0) {
          etptAgent = 0
        }

        etpt += etptAgent
      })

      const poste: {label: string, etpt: number, total: number}[] = []
      if(category.categoryId <= 2) {
        let subTotalEtp: { [key: string]: {etpt: number, total: number} } = this.humanResourceService.calculateSubCategories(category?.hr || [])
        Object.entries(subTotalEtp).map((key) => {
          poste.push({
            label: ucFirst(key[1].total > 1 ? key[0] + 's' : key[0]),
            etpt: key[1].etpt,
            total: key[1].total,
          })
        })  
      }

      return {
        ...category,
        headerLabel: category.label && category.label.includes('Magistrat') ? 'Siège' : category.label,
        nbPerson: listAgent.length,
        etpt,
        poste,
      }
    })
  }
}
