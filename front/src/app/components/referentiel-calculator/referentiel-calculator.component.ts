import { Component, HostBinding, Input } from '@angular/core'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { MainClass } from 'src/app/libs/main-class'

@Component({
  selector: 'aj-referentiel-calculator',
  templateUrl: './referentiel-calculator.component.html',
  styleUrls: ['./referentiel-calculator.component.scss'],
})
export class ReferentielCalculatorComponent extends MainClass {
  @Input() calculator: CalculatorInterface | null = null
  @Input() sortBy: string = ''
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
    if (decimal != null) {
      const strArray = String(decimal).split('.')
      let minute = strArray[1]
        ? String(Math.ceil((1 / 100) * +strArray[1] * 60))
        : '00'
      minute = minute.length === 1 ? '0' + minute : minute

      return strArray[0] + 'h' + minute
    }
    return
  }
}
