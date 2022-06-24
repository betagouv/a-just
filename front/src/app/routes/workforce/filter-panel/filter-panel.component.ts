import { Component } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'

@Component({
  selector: 'filter-panel',
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss'],
})
export class FilterPanelComponent extends MainClass {
  constructor() {
    super()
  }
}
