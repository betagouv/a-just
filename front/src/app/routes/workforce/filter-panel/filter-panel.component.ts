import { Output, EventEmitter, Component, Input, HostListener } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceSelectedInterface } from '../workforce.page'

export interface FilterPanelInterface {
  sort: string | null
  sortFunction: Function
  order: string | null
}

@Component({
  selector: 'filter-panel',
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss'],
})
export class FilterPanelComponent extends MainClass {
  @Output() update: EventEmitter<FilterPanelInterface> = new EventEmitter()
  @Output() close: EventEmitter<any> = new EventEmitter()
  sortList = [
    {
      id: 'name',
      label: 'Nom',
    },
    {
      id: 'function',
      label: 'Fonction',
    },
    {
      id: 'updateAt',
      label: 'Date de mise à jour',
    },
    {
      id: 'affected',
      label: "Taux d'affectation",
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
  @Input() sortValue: string | null = null
  @Input() orderValue: string | null = null

  @HostListener('click', ['$event'])
  onClick() {
    this.close.emit()
  }

  constructor() {
    super()
  }

  ngOnChanges() {
    if (!this.orderList.find((o) => o.id === this.orderValue)) {
      this.orderValue = this.orderList[0].id
    }
    if (!this.sortList.find((o) => o.id === this.sortValue)) {
      this.sortValue = this.sortList[1].id
    }
  }

  updateParams() {
    this.update.next({
      sort: this.sortValue,
      sortFunction: (list: HumanResourceSelectedInterface) => {
        console.log('test')

        return list
      },
      order: this.orderValue,
    })
  }
}
