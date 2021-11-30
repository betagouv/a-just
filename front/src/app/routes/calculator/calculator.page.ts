import { Component, OnDestroy, OnInit } from '@angular/core';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { MainClass } from 'src/app/libs/main-class';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';

@Component({
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
})
export class CalculatorPage extends MainClass implements OnDestroy, OnInit {
  referentiel: ContentieuReferentielInterface[] = [];

  constructor(private humanResourceService: HumanResourceService) {
    super();
  }

  ngOnInit() {
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c;
        this.onCalculate();
      })
    );
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onCalculate() {
    if (this.referentiel.length) {
      console.log(this.referentiel);
    }
  }
}
