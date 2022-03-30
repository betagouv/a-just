import { Component, HostBinding, Input } from '@angular/core';
import { CalculatorInterface } from 'src/app/interfaces/calculator';
import { MainClass } from 'src/app/libs/main-class';
import { CalculatorService } from 'src/app/services/calculator/calculator.service';

@Component({
  selector: 'aj-referentiel-calculator',
  templateUrl: './referentiel-calculator.component.html',
  styleUrls: ['./referentiel-calculator.component.scss'],
})
export class ReferentielCalculatorComponent extends MainClass {
  @Input() calculator: CalculatorInterface | null = null;
  @Input() sortBy: string = '';
  @HostBinding('class.show-children') showChildren: boolean =
    (this.calculator && this.calculator.childIsVisible) || false;

  constructor(private calcultorService: CalculatorService) {
    super();
  }

  onToggleChildren() {
    if (this.calculator) {
      this.showChildren = !this.showChildren;
      this.calculator.childIsVisible = this.showChildren;

      if (this.showChildren) {
        this.calcultorService.loadChildren(this.calculator.contentieux.id);
      }
    }
  }
}
