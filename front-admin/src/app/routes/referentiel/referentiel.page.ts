import { Component, OnInit } from '@angular/core';
import { QUALITY_LIST } from 'src/app/constants/referentiels';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { MainClass } from 'src/app/libs/main-class';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';

@Component({
  templateUrl: './referentiel.page.html',
  styleUrls: ['./referentiel.page.scss'],
})
export class ReferentielPage extends MainClass implements OnInit {
  referentiels: ContentieuReferentielInterface[] = [];
  QUALITY_LIST = QUALITY_LIST

  constructor(private referentielService: ReferentielService) {
    super();
  }

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {
    this.referentielService
      .getReferentiels()
      .then((list: ContentieuReferentielInterface[]) => {
        this.referentiels = list;
      });
  }

  onUpdateElement(id: number, node: string, value: any) {
    this.referentielService.update(id, node, value)
  }
}
