import {
  Output,
  EventEmitter,
  Component,
  Input,
  HostListener,
  ElementRef,
  AfterViewInit,
  OnChanges,
  ViewChild,
  OnInit,
} from '@angular/core'
import { orderBy, sortBy, sumBy } from 'lodash'
import { ItemInterface } from 'src/app/interfaces/item'
import { MainClass } from 'src/app/libs/main-class'
import { HRFonctionService } from 'src/app/services/hr-fonction/hr-function.service'
import { HumanResourceSelectedInterface } from '../workforce.page'

export interface FilterPanelInterface {
  sort: string | number | null
  sortName: string | null
  sortFunction: Function | null
  order: string | number | null
  orderIcon: string | null
  filterFunction: Function | null
  filterValues: (string | number)[] | null
  filterNames: string | null
}

@Component({
  selector: 'filter-panel',
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss'],
})
export class FilterPanelComponent
  extends MainClass
  implements AfterViewInit, OnChanges, OnInit
{
  @Output() update: EventEmitter<FilterPanelInterface> = new EventEmitter()
  @Output() close: EventEmitter<any> = new EventEmitter()
  sortList = [
    {
      id: 'name',
      label: 'Nom',
      sortFunction: (list: HumanResourceSelectedInterface[]) => {
        return sortBy(list, [
          (h: HumanResourceSelectedInterface) =>
            `${h.lastName} ${h.firstName}`.toLowerCase(),
        ])
      },
    },
    {
      id: 'function',
      label: 'Fonction',
      sortFunction: (list: HumanResourceSelectedInterface[]) =>
        sortBy(list, ['fonction.rank']),
    },
    {
      id: 'updateAt',
      label: 'Date de mise à jour',
      sortFunction: (list: HumanResourceSelectedInterface[]) =>
        sortBy(list, [
          (h: HumanResourceSelectedInterface) => h.updatedAt.getTime(),
        ]),
    },
    {
      id: 'affected',
      label: "Taux d'affectation",
      sortFunction: (list: HumanResourceSelectedInterface[]) => {
        return sortBy(list, [
          (h: HumanResourceSelectedInterface) => {
            const allMainActivities = (h.currentActivities || [])
            return sumBy(allMainActivities, 'percent') * (h.etp || 0)
          },
        ])
      },
    },
  ]
  orderList = [
    {
      id: 'asc',
      icon: 'sort-desc',
      label: 'Ordre ascendant',
    },
    {
      id: 'desc',
      icon: 'sort-asc',
      label: 'Ordre descendant',
    },
  ]
  @Input() filterValues: (string | number)[] | null = null
  @Input() sortValue: string | number | null = null
  @Input() orderValue: string | number | null = null
  @ViewChild('popin') popin: ElementRef<HTMLElement> | null = null
  leftPosition: number = 0
  topPosition: number = 0
  filterList: ItemInterface[] = []
  defaultFilterValues: (string | number)[] | null = null
  defaultSortValue: string | number | null = this.sortList[1].id
  defaultOrderValue: string | number | null = this.orderList[0].id

  @HostListener('click', ['$event'])
  onClick() {
    this.close.emit()
  }

  constructor(
    private hrFonctionService: HRFonctionService,
    private elementRef: ElementRef
  ) {
    super()
  }

  ngOnInit() {
    this.loadFonctions()
  }

  ngOnChanges() {
    if (!this.sortList.find((o) => o.id === this.sortValue)) {
      this.sortValue = this.sortList[1].id
    }
    if (!this.orderList.find((o) => o.id === this.orderValue)) {
      this.orderValue = this.orderList[0].id
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      let { x, y } =
        this.elementRef.nativeElement.parentNode.getBoundingClientRect()
      const bottomMargin = 100

      if (this.popin) {
        const popin = this.popin.nativeElement.getBoundingClientRect()
        const windowHeight = window.innerHeight

        if (y + popin.height + bottomMargin > windowHeight) {
          y = windowHeight - popin.height - bottomMargin
        }
      }

      this.leftPosition = x
      this.topPosition = y
    }, 0)
  }

  async loadFonctions() {
    const fonctions = await this.hrFonctionService.getAll()
    // tempory fix to load only Magistrat and Fonctionnaires fonctions
    const listUsedFunctions = orderBy([...fonctions], ['categoryId', 'rank']).filter(f => f.categoryId === 1 || f.categoryId === 2)

    this.filterList = listUsedFunctions.map(f => ({id: f.id, label: f.code || ''}))
    this.filterValues = this.filterValues === null ? listUsedFunctions.map(f => (f.id)) : this.filterValues
    this.defaultFilterValues = listUsedFunctions.map(f => (f.id))
  }

  updateParams() {
    const sortItem = this.sortList.find((o) => o.id === this.sortValue)
    const orderItem = this.orderList.find((o) => o.id === this.orderValue)
    let filterNames = '';
    if(this.filterValues && this.filterValues.length !== this.defaultFilterValues?.length) {
      const nbStringToAdd = 3
      let stringAdd = 0
      filterNames += this.filterList.reduce((acc, cur) => {
        if(this.filterValues && this.filterValues.indexOf(cur.id) !== -1 && stringAdd < nbStringToAdd) {
          if(stringAdd > 0) {
            acc += ', '
          }
          acc += cur.label
          stringAdd++
        }
        return acc
      }, '')

      if(this.filterValues.length > nbStringToAdd) {
        filterNames += ' ...'
      }
    }

    this.update.next({
      sort: this.sortValue,
      sortName: sortItem && sortItem.label && this.sortValue !== this.defaultSortValue ? sortItem.label : null,
      sortFunction:
        (sortItem && sortItem.sortFunction) ||
        ((l: HumanResourceSelectedInterface) => l),
      order: this.orderValue,
      orderIcon: orderItem && orderItem.icon ? orderItem.icon : null,
      filterValues: this.filterValues,
      filterFunction: (list: HumanResourceSelectedInterface[]) => {
        if(this.filterValues === null || this.filterValues.length === this.filterList.length) {
          return list
        } else {
          return list.filter(h => h.fonction && this.filterValues && this.filterValues.indexOf(h.fonction.id) !== -1)
        }
      },
      filterNames,
    })
  }
}
