import { Component, inject, Input, OnChanges, OnDestroy } from '@angular/core'
import { HumanResourceSelectedInterface } from '../../workforce/workforce.page'
import { sortBy } from 'lodash'
import { CommonModule } from '@angular/common'
import { MainClass } from '../../../libs/main-class'
import { UserService } from '../../../services/user/user.service'
import { today } from '../../../utils/dates'
import { MatIconModule } from '@angular/material/icon'
import { RouterLink } from '@angular/router'
import { NgxPaginationModule } from 'ngx-pagination'

interface categoryButtonsInterface {
  label: string
  isSelected: boolean
}

interface sortButtonsInterface {
  label: string
  isReverse: boolean
}

interface listToPrintInterface {
  category: string
  hr: HumanResourceSelectedInterface[]
}

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  selector: 'workforce-change',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, NgxPaginationModule],
  templateUrl: './workforce-change.component.html',
  styleUrls: ['./workforce-change.component.scss'],
})
export class WorkforceChangeComponent extends MainClass implements OnChanges, OnDestroy {
  userService = inject(UserService)
  @Input() listArrivals: HumanResourceSelectedInterface[] = []
  @Input() listDepartures: HumanResourceSelectedInterface[] = []
  @Input() listUnavailabilities: HumanResourceSelectedInterface[] = []
  @Input() totalWorkforce: number = 0
  /**
   * Page actuelle (pagination)
   */
  currentPage = 0
  /**
   * Bouttons de sélection des catégories (Arrivées, Départs, Indisponibiltiés) à afficher et leur statut (actif/non-actif)
   */
  categoryButtons: categoryButtonsInterface[] = [
    {
      label: 'Départs',
      isSelected: true,
    },
    {
      label: 'Arrivées',
      isSelected: false,
    },
    {
      label: 'Indisponibilités',
      isSelected: false,
    },
  ]
  /**
   * Bouttons de trie (Nom, Affectation, Départ, Début indispo, Fin indispo ) à afficher et leur statut (actif/non-actif)
   */
  sortButtonsStates: sortButtonsInterface[] = [
    {
      label: 'name',
      isReverse: false,
    },
    {
      label: 'assignment',
      isReverse: false,
    },
    {
      label: 'departures',
      isReverse: false,
    },
    {
      label: 'arrivals',
      isReverse: false,
    },
    {
      label: 'indispoStart',
      isReverse: false,
    },
    {
      label: 'indispoEnd',
      isReverse: false,
    },
  ]
  /**
   * Liste des effectifs à afficher sur le panorama
   */
  listToPrint: listToPrintInterface = {
    category: 'Départs',
    hr: [],
  }

  /**
   * Constructor
   */
  constructor() {
    super()
  }

  /**
   * Initialisation des datas au chargement de la page
   */
  ngOnChanges() {
    this.changeButtonsState(this.listToPrint.category)
  }

  /**
   * Changement de la liste à afficher selon la categorie (Arrivées, Départs, Indisponibiltiés) sélectionnée
   */
  changeButtonsState(label: string) {
    this.categoryButtons.map((button) => {
      if (button.label === label) {
        button.isSelected = true
      } else button.isSelected = false
    })

    switch (label) {
      case 'Arrivées':
        this.listToPrint.hr = this.listArrivals
        break
      case 'Indisponibilités':
        this.listToPrint.hr = this.listUnavailabilities
        break
      default:
        this.listToPrint.hr = this.listDepartures
        break
    }

    this.listToPrint.category = label

    this.currentPage = 0
  }

  /**
   * Evaluation d'une situation pour déterminer si elle est dans le future ou actuel
   */
  isSituationComing(date: Date | null) {
    const now = today()

    if (date && date > now) {
      return true
    }
    return false
  }

  /**
   * Trie de la liste à afficher selon le boutton de trie sélectionné
   */
  orderList(category: string) {
    let button: sortButtonsInterface | undefined = this.sortButtonsStates.find((button) => button.label === category)

    switch (category) {
      case 'name':
        if (button) {
          this.listToPrint.hr = sortBy(this.listToPrint.hr, [
            (h: HumanResourceSelectedInterface) => {
              return `${h.lastName} ${h.firstName}`.toLowerCase()
            },
          ])
        }
        break
      case 'assignment':
        if (button) {
          this.listToPrint.hr = sortBy(this.listToPrint.hr, [
            (h: HumanResourceSelectedInterface) => {
              // @ts-ignore
              return `${h.totalAffected}`
            },
          ])
        }
        break
      case 'departures':
        if (button) {
          this.listToPrint.hr = sortBy(this.listToPrint.hr, [
            (h: HumanResourceSelectedInterface) => {
              // @ts-ignore
              return new Date(`${h.dateEnd}`)
            },
          ])
        }
        break
      case 'arrivals':
        if (button) {
          this.listToPrint.hr = sortBy(this.listToPrint.hr, [
            (h: HumanResourceSelectedInterface) => {
              // @ts-ignore
              return new Date(`${h.situations[0].dateStart}`)
            },
          ])
        }
        break
      case 'indispoStart':
        if (button) {
          this.listToPrint.hr = sortBy(this.listToPrint.hr, [
            (h: HumanResourceSelectedInterface) => {
              // @ts-ignore
              return new Date(`${h.indisponibilities[0].dateStart}`)
            },
          ])
        }
        break
      case 'indispoEnd':
        if (button) {
          this.listToPrint.hr = sortBy(this.listToPrint.hr, [
            (h: HumanResourceSelectedInterface) => {
              // @ts-ignore
              return new Date(`${h.indisponibilities[0].dateStop}`)
            },
          ])
        }
        break
    }
    if (button) {
      if (button.isReverse) this.listToPrint.hr.reverse()
      button.isReverse = !button.isReverse
    }
    this.sortButtonsStates.map((button) => (button.label !== category ? (button.isReverse = false) : null))
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy() {}
}
