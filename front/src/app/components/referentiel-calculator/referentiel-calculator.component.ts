import { Component, Input, OnInit } from '@angular/core';
import { MainClass } from 'src/app/libs/main-class';

@Component({
  selector: 'aj-referentiel-calculator',
  templateUrl: './referentiel-calculator.component.html',
  styleUrls: ['./referentiel-calculator.component.scss'],
})
export class ReferentielCalculatorComponent extends MainClass implements OnInit {
  @Input() referentielId: number | null = null;
  @Input() dateStart: Date | null = null;
  @Input() dateStop: Date | null = null;

  constructor() {
    super();
  }

  ngOnInit() {
    console.log(this.referentielId, this.dateStart, this.dateStop)
  }
}
