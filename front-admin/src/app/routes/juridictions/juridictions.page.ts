import { Component, OnInit } from '@angular/core';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MainClass } from '../../libs/main-class';
import { JuridictionInterface } from '../../interfaces/juridiction';
import { JuridictionsService } from '../../services/juridictions/juridictions.service';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';
import { PopupComponent } from '../../components/popup/popup.component';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [WrapperComponent, PopupComponent, CommonModule, MatSortModule],
  templateUrl: './juridictions.page.html',
  styleUrls: ['./juridictions.page.scss'],
})
export class JuridictionsPage extends MainClass implements OnInit {
  datas: JuridictionInterface[] = [];
  datasSource: JuridictionInterface[] = [];
  selectedJuridiction: JuridictionInterface | null = null;

  constructor(private juridictionsService: JuridictionsService) {
    super();
  }

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {
    this.juridictionsService.getAll().then((datas) => {
      this.datas = datas;
      this.datasSource = this.datas.slice();
    });
  }

  onUpdate(node: string, element: any) {
    let getValue = null;

    if (node !== 'enabled') {
      getValue = prompt(
        `Remplacer le champ '${node}' par`,
        element[node] || ''
      );
    } else {
      getValue = confirm('Activer ou non la juridiction ?');
    }

    if (getValue !== null) {
      this.juridictionsService
        .updateJuridiction(node, getValue, element.id)
        .then(() => this.onLoad());
    }
  }

  sortData(sort: Sort) {
    const data = this.datas.slice();
    if (!sort.active || sort.direction === '') {
      this.datasSource = data;
      return;
    }

    this.datasSource = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      // @ts-ignore
      return compare(a[sort.active], b[sort.active], isAsc);
    });
  }
}
