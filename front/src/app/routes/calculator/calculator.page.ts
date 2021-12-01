import { Component, OnDestroy, OnInit } from '@angular/core';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { MainClass } from 'src/app/libs/main-class';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';

const now = new Date(2021, 10);
const end = new Date(2021, 10, 30);

@Component({
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
})
export class CalculatorPage extends MainClass implements OnDestroy, OnInit {
  referentiel: ContentieuReferentielInterface[] = [];
  referentielIds: number[] = [];
  dateStart: Date = new Date(now);
  dateStop: Date = new Date(end);

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
      // TODO this.referentielIds = this.referentiel.map(r => (r.id));
      this.referentielIds = this.referentiel.map(r => (r.id)).slice(0, 1);
    }
  }

  trackBy(index: number, item: any) {
    return item;
  }
}
