import { Component, ElementRef, Input, OnInit } from '@angular/core'
import * as d3 from 'd3'
import * as _ from 'lodash'

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
  elementRef: HTMLElement | undefined

  constructor(element: ElementRef<HTMLElement>) {
    this.elementRef = element.nativeElement
  }

  ngOnInit(): void {
    // set the dimensions and margins of the graph
    var margin = { top: 20, right: 25, bottom: 30, left: 40 },
      width = 800 - margin.left - margin.right,
      height = 200 - margin.top - margin.bottom

    // append the svg object to the body of the page
    var svg = d3
      .select('#dtes-chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    const data = _.range(1, 100, [(100 - 1) / 12])
    const yAxes = _.range(1, 100, [(100 - 1) / 12])

    // Create scale
    var scale = d3
      .scaleLinear()
      //  .domain([d3.min(data), d3.max(data)])
      .range([0, width - 100])

    // Add scales to axis
    //var x_axis = d3.axisBottom().scale(scale)

    //Append group and insert axis
    //svg.append('g').call(x_axis)
  }
}
