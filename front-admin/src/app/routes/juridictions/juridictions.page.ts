import { Component, OnInit } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { JuridictionInterface } from 'src/app/interfaces/juridiction';
import { MainClass } from 'src/app/libs/main-class';
import { JuridictionsService } from 'src/app/services/juridictions/juridictions.service';
import { compare } from 'src/app/utils/array';

@Component({
  templateUrl: './juridictions.page.html',
  styleUrls: ['./juridictions.page.scss'],
})
export class JuridictionsPage extends MainClass implements OnInit {
  datas: JuridictionInterface[] = []
  datasSource: JuridictionInterface[] = [];

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
    let getValue = null
    
    if(node !== 'enabled') {
      getValue = prompt(`Remplacer le champ '${node}' par`, element[node] || '')
    } else {
      getValue = confirm('Activer ou non la juridiction ?')
    }    
    
    if(getValue !== null) {
      this.juridictionsService.updateJuridiction(node, getValue, element.id).then(() => this.onLoad())
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
      return compare(a[sort.active], b[sort.active], isAsc)
    });
  }
}
