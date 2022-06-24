import { Component, Input, OnInit } from '@angular/core'
import * as d3 from 'd3'

@Component({
  selector: 'aj-dtes-chart',
  templateUrl: './dtes-chart.component.html',
  styleUrls: ['./dtes-chart.component.scss'],
})
export class DtesChartComponent implements OnInit {
  @Input() dateStart: string = ''
  @Input() dateStop: string = ''
  @Input() valueProjected: string = ''
  @Input() valueSimulated: string = ''
  constructor() {}

  ngOnInit(): void {}
}
