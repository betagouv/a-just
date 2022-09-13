import { Component, HostBinding, Input } from '@angular/core'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { MainClass } from 'src/app/libs/main-class'
import { fixDecimal } from 'src/app/utils/numbers'

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
      decimal = fixDecimal(decimal)

      const strArray = String(decimal).split('.')

      let extractedMinute = strArray[1] ? strArray[1] : 0

      let minute =
        String(extractedMinute).length === 1
          ? extractedMinute + '0'
          : extractedMinute

      minute =
        extractedMinute !== 0
          ? String(Math.ceil((1 / 100) * +Number(minute) * 60))
          : '00'

      minute = minute.length === 1 ? '0' + minute : minute

      return strArray[0] + 'h' + minute
    }
    return
  }
}
