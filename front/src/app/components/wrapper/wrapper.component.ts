import { Component, Input, OnInit, TemplateRef } from '@angular/core';

@Component({
  selector: 'aj-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
})
export class WrapperComponent implements OnInit {
  @Input() actionTemplate: TemplateRef<any> | undefined;
  @Input() title: string = "";
  menu = [
    {
      label: 'Effectifs',
      path: 'effectifs',
    },
    {
      label: 'Indicateurs',
      path: 'indicateurs',
    },
    {
      label: 'Simulateurs',
      path: 'simulateurs',
    },
    {
      label: 'Rapports',
      path: 'rapports',
    },
    {
      label: 'Paramètres',
      path: 'parametres',
    },
    {
      label: 'Aides',
      path: 'aides',
    },
  ];
  constructor() {}

  ngOnInit() {}
}
