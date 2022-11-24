import { Component, HostBinding, Input } from '@angular/core'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { MainClass } from 'src/app/libs/main-class'
import { decimalToStringDate } from 'src/app/utils/dates'

@Component({
  selector: 'aj-referentiel-calculator',
  templateUrl: './referentiel-calculator.component.html',
  styleUrls: ['./referentiel-calculator.component.scss'],
})
export class ReferentielCalculatorComponent extends MainClass {
  @Input() calculator: CalculatorInterface | null = null
  @Input() sortBy: string = ''
  @Input() categorySelected: string = ''
  @Input() forceToShowChildren: boolean = false
  @HostBinding('class.show-children') showChildren: boolean =
    (this.calculator && this.calculator.childIsVisible) || false

  constructor() {
    super()
  }

  onToggleChildren() {
    if (this.calculator) {
      this.showChildren = !this.showChildren
      this.calculator.childIsVisible = this.showChildren
    }
  }

  decimalToStringDate(decimal: number | null) {
    return decimalToStringDate(decimal)
  }
}
