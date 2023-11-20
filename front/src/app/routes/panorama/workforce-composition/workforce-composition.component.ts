import { Component, Input, OnChanges } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { listFormatedInterface } from '../../workforce/workforce.page'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ucFirst } from 'src/app/utils/string'
import { fixDecimal } from 'src/app/utils/numbers'
import { today } from 'src/app/utils/dates'
import { ServerService } from 'src/app/services/http-server/server.service'

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
  poste?: { label: string; etpt: number; total: number }[]
}

interface cleInterface {
  juridiction_id: number,
  category_id: number,
  value: number
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
  implements OnChanges {
  /**
   * Filter categories to view
   */
  @Input() categoriesFiltered: number[] | null = null
  /**
   * List des categories
   */
  @Input() backupId: number | null = null
  /**
   * Liste filtré pour l'affichage
   */
  listFormatedFiltered: listFormatedWithDatasInterface[] = []
  /**
   * Cle
   */
  cleByCategory: cleInterface[] | null = null

  /**
   * Constructor
   */
  constructor(private humanResourceService: HumanResourceService,
    private serverService: ServerService
  ) {
    super()
    this.getAllCle()
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  ngOnChanges() {
    if (this.backupId) {
      this.getAllCle()
      this.humanResourceService
        .onFilterList(
          this.humanResourceService.backupId.getValue() || 0,
          today(),
          null,
          [1, 2, 3]
        )
        .then(({ list }) => {
          const listReturn: listFormatedInterface[] = list
          this.listFormatedFiltered = listReturn
            .filter(
              (category: any) =>
                this.categoriesFiltered === null ||
                (this.categoriesFiltered &&
                  this.categoriesFiltered.indexOf(category.categoryId) !== -1)
            )
            .map((category: any) => {
              const listAgent = category.hr || []
              let etpt = 0
              listAgent.map((a: any) => {
                const etp = a.etp
                const indispo = a.hasIndisponibility

                let etptAgent = etp - indispo
                if (etptAgent < 0) {
                  etptAgent = 0
                }

                etpt += etptAgent
              })

              const poste: { label: string; etpt: number; total: number }[] = []
              if (category.categoryId <= 2) {
                let subTotalEtp: {
                  [key: string]: { etpt: number; total: number }
                } = this.humanResourceService.calculateSubCategories(
                  category?.hr || []
                )
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
                headerLabel:
                  category.label && category.label.includes('Magistrat')
                    ? 'Siège'
                    : category.label,
                nbPerson: listAgent.length,
                etpt: fixDecimal(etpt),
                poste,
              }
            })
        })
    }
  }

  saveCLE(value: EventTarget | null, category: listFormatedWithDatasInterface) {
    if (value) {
      const value = (document.getElementById("cle-" + category.categoryId) as HTMLInputElement).value
      console.log(value)
      const res = this.serverService
        .put('juridictions-details/update-cle',
          {
            juridictionId: this.humanResourceService.backupId.getValue(),
            categoryId: category.categoryId,
            value: ((document.getElementById("cle-" + category.categoryId) as HTMLInputElement).value)
          })
        .then((r) => {
          return r.data
        })
    }
  }

  getCLE(category: listFormatedWithDatasInterface) {
    if (this.humanResourceService.backupId.getValue()) {
      let res = null
      this.cleByCategory?.map(x => {
        if (x.category_id === category.categoryId) res = x.value
      })
      return res
    }

    return ''
  }

  async getAllCle() {
    this.cleByCategory = await this.serverService
      .post('juridictions-details/get-cle',
        {
          juridictionId: this.humanResourceService.backupId.getValue(),
        })
      .then((r) => {
        return r.data
      })
  }
}
