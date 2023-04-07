import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MainClass } from 'src/app/libs/main-class';
import { JuridictionsService } from 'src/app/services/juridictions/juridictions.service';

@Component({
  templateUrl: './juridictions.page.html',
  styleUrls: ['./juridictions.page.scss'],
})
export class JuridictionsPage extends MainClass implements OnInit {
  displayedColumns: string[] = [
    'iElst',
    'label',
    'latitude',
    'longitude',
    'population',
    'enabled',
  ];
  dataSource = new MatTableDataSource();

  constructor(private juridictionsService: JuridictionsService) {
    super();
  }

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {
    this.juridictionsService.getAll().then((datas) => {
      this.dataSource.data = datas;
    });
  }

  onUpdate(node: string, element: any) {
    let getValue = null
    
    if(node !== 'enabled') {
      getValue = prompt("Remplacer le champ par", element[node] || '')
    } else {
      getValue = confirm('Activer ou non la juridiction ?')
    }    
    
    if(getValue !== null) {
      this.juridictionsService.updateJuridiction(node, getValue, element.id).then(() => this.onLoad())
    }
  }
}
