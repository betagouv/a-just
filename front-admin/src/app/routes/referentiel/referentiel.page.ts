import { Component, inject, OnInit } from '@angular/core';
import { MainClass } from '../../libs/main-class';
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel';
import { QUALITY_LIST } from '../../constants/referentiels';
import { ReferentielService } from '../../services/referentiel/referentiel.service';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [WrapperComponent, FormsModule, CommonModule],
  templateUrl: './referentiel.page.html',
  styleUrls: ['./referentiel.page.scss'],
})
export class ReferentielPage extends MainClass implements OnInit {
  referentielService = inject(ReferentielService);
  referentiels: ContentieuReferentielInterface[] = [];
  QUALITY_LIST = QUALITY_LIST;

  constructor() {
    super();
  }

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {
    this.referentielService
      .getReferentiels(true)
      .then((list: ContentieuReferentielInterface[]) => {
        this.referentiels = list;
      });
  }

  onUpdateElement(id: number, node: string, value: any) {
    this.referentielService.update(id, node, value);
  }
}
