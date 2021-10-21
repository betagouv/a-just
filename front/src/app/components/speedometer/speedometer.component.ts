import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'aj-speedometer',
  templateUrl: './speedometer.component.html',
  styleUrls: ['./speedometer.component.scss'],
})
export class SpeedometerComponent implements OnInit {
  @Input() persent: number = 20;
  @Input() in: number = 100;
  @Input() out: number = 20;
  constructor() {}

  ngOnInit() {}
}
