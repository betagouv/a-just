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
} from '@angular/core'
import { sortBy, sumBy } from 'lodash'
import { MainClass } from 'src/app/libs/main-class'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
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
export class FilterPanelComponent
  extends MainClass
  implements AfterViewInit, OnChanges
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
            const allMainActivities = h.currentActivities.filter(
              (c) =>
                this.referentielService.mainActivitiesId.indexOf(
                  c.contentieux.id
                ) !== -1
            )
            return sumBy(allMainActivities, 'percent')
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
  @Input() sortValue: string | null = null
  @Input() orderValue: string | null = null
  @ViewChild('popin') popin: ElementRef<HTMLElement> | null = null
  leftPosition: number = 0
  topPosition: number = 0

  @HostListener('click', ['$event'])
  onClick() {
    this.close.emit()
  }

  constructor(
    private referentielService: ReferentielService,
    private elementRef: ElementRef
  ) {
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

  updateParams() {
    const sortItem = this.sortList.find((o) => o.id === this.sortValue)

    this.update.next({
      sort: this.sortValue,
      sortFunction:
        (sortItem && sortItem.sortFunction) ||
        ((l: HumanResourceSelectedInterface) => l),
      order: this.orderValue,
    })
  }
}
