import { Component } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'

@Component({
  selector: 'filter-panel',
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss'],
})
export class FilterPanelComponent extends MainClass {
  sortList = [{
    id: 'name',
    label: 'Nom'
  },{
    id: 'function',
    label: 'Fonction'
  },{
    id: 'updateAt',
    label: 'Date de mise à jour'
  },{
    id: 'affected',
    label: 'Taux d\'affectation'
  }]
  orderList = [{
    id: 'asc',
    icon: 'edit',
    label: 'Ordre ascendant'
  },{
    id: 'desc',
    icon: 'edit',
    label: 'Ordre descendant'
  }]
  constructor() {
    super()
  }
}
