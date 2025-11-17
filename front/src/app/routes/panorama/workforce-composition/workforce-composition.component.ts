import { Component, Input, OnChanges } from '@angular/core'
import { listFormatedInterface } from '../../workforce/workforce.page'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { MainClass } from '../../../libs/main-class'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { ServerService } from '../../../services/http-server/server.service'
import { sortDates, today } from '../../../utils/dates'
import { ucFirst } from '../../../utils/string'
import { fixDecimal } from '../../../utils/numbers'

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
  juridiction_id: number
  category_id: number
  value: number
}

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  selector: 'workforce-composition',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workforce-composition.component.html',
  styleUrls: ['./workforce-composition.component.scss'],
})
export class WorkforceCompositionComponent extends MainClass implements OnChanges {
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
   * on add delay to time out
   */
  onTimeoutLoad: any[] = [null, null, null]

  /**
   * Constructor
   */
  constructor(private humanResourceService: HumanResourceService, private serverService: ServerService) {
    super()
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  ngOnChanges() {
    if (this.backupId) {
      this.getAllCle()
      this.humanResourceService
        .onFilterList(this.humanResourceService.backupId.getValue() || 0, today(), null, null, [1, 2, 3])
        .then(({ list, allPersons }) => {
          const listReturn: listFormatedInterface[] = list
          this.listFormatedFiltered = listReturn
            .filter(
              (category: any) => this.categoriesFiltered === null || (this.categoriesFiltered && this.categoriesFiltered.indexOf(category.categoryId) !== -1),
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

              // Ajout des personnes qui n'ont pas de ventilation
              allPersons
                .filter(
                  (person: any) =>
                    !person.isIn &&
                    person.dateStart &&
                    sortDates(today(person.dateStart), today(), false) <= 0 &&
                    person.situations &&
                    person.situations.length &&
                    person.situations[person.situations.length - 1].dateStart &&
                    sortDates(today(person.situations[person.situations.length - 1].dateStart), today(), false) > 0 &&
                    person.category,
                )
                .map((person: any) => {
                  if (category.categoryId === person.category?.id && !listAgent.find((h: any) => h.id === person.id)) {
                    console.log('agent add by force', person)
                    listAgent.push(person)
                  }
                })

              const poste: { label: string; etpt: number; total: number }[] = []
              if (category.categoryId <= 2) {
                let subTotalEtp: {
                  [key: string]: { etpt: number; total: number }
                } = this.humanResourceService.calculateSubCategories(category?.hr || [])
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
                etpt: fixDecimal(etpt),
                poste,
              }
            })
        })
    }
  }

  saveCLE(value: EventTarget | null, category: listFormatedWithDatasInterface, index: number) {
    if (this.onTimeoutLoad && this.onTimeoutLoad[index]) {
      clearTimeout(this.onTimeoutLoad[index])
    }

    if (value) {
      const value = (document.getElementById('cle-' + category.categoryId) as HTMLInputElement).value
      this.onTimeoutLoad[index] = setTimeout(() => {
        this.onTimeoutLoad[index] = null
        const res = this.serverService
          .put('juridictions-details/update-cle', {
            juridictionId: this.humanResourceService.backupId.getValue(),
            categoryId: category.categoryId,
            value: (document.getElementById('cle-' + category.categoryId) as HTMLInputElement).value,
          })
          .then((r) => {
            return r.data
          })
      }, 500)
    }
  }

  getCLE(category: listFormatedWithDatasInterface) {
    if (this.humanResourceService.backupId.getValue()) {
      let res = null
      this.cleByCategory?.map((x) => {
        if (x.category_id === category.categoryId) res = x.value
      })
      return res
    }

    return ''
  }

  async getAllCle() {
    this.cleByCategory = await this.serverService
      .post('juridictions-details/get-cle', {
        juridictionId: this.humanResourceService.backupId.getValue(),
      })
      .then((r) => {
        return r.data
      })
  }
}
