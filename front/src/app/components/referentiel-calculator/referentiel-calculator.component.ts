import { Component, HostBinding, Input } from '@angular/core';
import { CalculatorInterface } from 'src/app/interfaces/calculator';
import { MainClass } from 'src/app/libs/main-class';

@Component({
  selector: 'aj-referentiel-calculator',
  templateUrl: './referentiel-calculator.component.html',
  styleUrls: ['./referentiel-calculator.component.scss'],
})
export class ReferentielCalculatorComponent extends MainClass {
  @Input() calculator: CalculatorInterface | null = null;
  @Input() sortBy: string = '';
  @HostBinding('class.show-children') showChildren: boolean = false;

  constructor() {
    super();
  }
}
