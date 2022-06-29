import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core'
import { getRangeOfMonths, getShortMonthString } from 'src/app/utils/dates'
import * as _ from 'lodash'
import { Chart, ChartItem, registerables } from 'chart.js'
import { findRealValue } from 'src/app/utils/dates'
import { SimulatorService } from 'src/app/services/simulator/simulator.service'

@Component({
  selector: 'aj-dtes-chart',
  templateUrl: './dtes-chart.component.html',
  styleUrls: ['./dtes-chart.component.scss'],
})
export class DtesChartComponent implements AfterViewInit {
  dateStart: Date = new Date()
  dateStop: Date | null = null
  startRealValue = ''
  stopRealValue = ''
  elementRef: HTMLElement | undefined
  myChart: any = null
  labels: string[] | null = null
  data = {
    projectedStock: {
      values: [0],
    },
    simulatedStock: {
      values: [0],
    },
    projectedDTES: {
      values: [0],
    },
    simulatedDTES: {
      values: [0],
    },
  }

  constructor(
    element: ElementRef<HTMLElement>,
    simulatorService: SimulatorService
  ) {
    simulatorService.dateStop.subscribe((value) => {
      this.stopRealValue = findRealValue(value)
      this.dateStop = value
      this.labels = getRangeOfMonths(
        new Date(this.dateStart),
        new Date(this.dateStop)
      )
    })
    simulatorService.dateStart.subscribe((value) => {
      this.startRealValue = findRealValue(value)
      this.dateStart = value
      if (this.dateStop !== null) {
        this.labels = getRangeOfMonths(
          new Date(this.dateStart),
          new Date(this.dateStop)
        )
      }
    })
    simulatorService.situationSimulated.subscribe((value) => {
      if (this.labels !== null) {
        this.data.projectedStock.values = simulatorService.generateLinearData(
          simulatorService.getFieldValue(
            'lastStock',
            simulatorService.situationActuelle.getValue()
          ),
          simulatorService.getFieldValue(
            'lastStock',
            simulatorService.situationProjected.getValue()
          ),
          this.labels.length
        )
        this.data.simulatedStock.values = simulatorService.generateLinearData(
          simulatorService.getFieldValue(
            'lastStock',
            simulatorService.situationActuelle.getValue()
          ),
          value?.lastStock as number,
          this.labels.length
        )

        this.data.simulatedDTES.values = simulatorService.generateLinearData(
          simulatorService.situationActuelle.getValue()!
            .realDTESInMonths as number,
          value?.realDTESInMonths as number,
          this.labels.length
        )

        this.data.projectedDTES.values = simulatorService.generateLinearData(
          simulatorService.situationActuelle.getValue()!
            .realDTESInMonths as number,
          simulatorService.situationProjected.getValue()!
            .realDTESInMonths as number,
          this.labels.length
        )

        if (this.myChart !== null) {
          this.myChart.config.data.labels = this.labels
          this.myChart._metasets[0]._dataset.data =
            this.data.projectedStock.values
          this.myChart._metasets[1]._dataset.data =
            this.data.simulatedStock.values
          this.myChart._metasets[2]._dataset.data =
            this.data.projectedDTES.values
          this.myChart._metasets[3]._dataset.data =
            this.data.simulatedDTES.values
          this.myChart.update()
        }
      }
    })

    this.elementRef = element.nativeElement
    Chart.register(...registerables)
  }

  ngAfterViewInit(): void {
    const labels = this.labels

    const data = {
      labels: labels,
      datasets: [
        {
          label: 'projectedStock',
          yAxisID: 'A',
          backgroundColor: '#c3fad5',
          borderColor: '#c3fad5',
          data: this.data.projectedStock.values,
        },
        {
          label: 'simulatedStock',
          yAxisID: 'A',
          backgroundColor: '#6fe49d',
          borderColor: '#6fe49d',
          data: this.data.simulatedStock.values,
        },
        {
          label: 'projectedDTES',
          yAxisID: 'B',
          backgroundColor: '#bfcdff',
          borderColor: '#bfcdff',
          data: this.data.projectedDTES.values,
        },
        {
          yAxisID: 'B',
          label: 'simulatedDTES',
          backgroundColor: '#7b99e4',
          borderColor: '#7b99e4',
          data: this.data.simulatedDTES.values,
        },
      ],
    }

    const yScaleTextStock = {
      id: 'yScaleTextStock',
      afterDraw(chart: any, args: any, options: any) {
        const ctx = chart.ctx
        const top = chart.chartArea.top
        ctx.save()
        ctx.font = '14px Arial'
        ctx.fillStyle = '#666'
        ctx.fillText('Stock', 1, top - 2)
        ctx.restore()
      },
    }

    const yScaleTextDTES = {
      id: 'yScaleTextDTES',
      afterDraw(chart: any, args: any, options: any) {
        const ctx = chart.ctx
        const top = chart.chartArea.top
        const right = chart.chartArea.right
        ctx.save()
        ctx.font = '14px Arial'
        ctx.fillStyle = '#666'
        ctx.fillText('DTES', right - 40, top - 2)
        ctx.restore()
      },
    }

    const footer = (tooltipItems: any) => {
      let sum = 0

      tooltipItems.forEach(function (tooltipItem: any) {
        sum += tooltipItem.parsed.y
      })
      return 'Sum: ' + sum
    }

    const label = (context: any) => {
      let sufix = ''
      switch (context.dataset.label) {
        case 'simulatedStock':
          sufix = 'affaires (simulé)'
          break
        case 'projectedStock':
          sufix = 'affaires (projeté)'
          break
        case 'simulatedDTES':
          sufix = 'mois (simulé)'
          break
        case 'projectedDTES':
          sufix = 'mois (projeté)'
          break
      }
      let lbl = ''

      if (sufix.slice(0, 4) === 'mois')
        lbl = '  ' + context.formattedValue + ' ' + sufix //context.label +
      else
        lbl =
          '  ' + Math.floor(parseFloat(context.formattedValue)) + ' ' + sufix
      return lbl
    }

    const config: any = {
      type: 'line',
      data: data,
      options: {
        tooltips: {
          callbacks: {
            title: function (tooltipItem: any, data: any) {
              return data['labels'][tooltipItem[0]['index']]
            },
            label: function (tooltipItem: any, data: any) {
              return data['datasets'][0]['data'][tooltipItem['index']]
            },
            afterLabel: function (tooltipItem: any, data: any) {
              var dataset = data['datasets'][0]
              var percent = Math.round(
                (dataset['data'][tooltipItem['index']] /
                  dataset['_meta'][0]['total']) *
                  100
              )
              return '(' + percent + '%)'
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        animation: {
          interaction: {
            intersect: false,
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 20, left: 20, right: 20 },
        },
        scales: {
          x: {
            grid: {
              drawTicks: true,
              tickColor: 'white',
            },
          },
          A: {
            beginAtZero: true,
            type: 'linear',
            position: 'left',
            ticks: {
              display: true,
              min: 0,
              max: 100,
              stepSize: 10,
              callback: (value: any, index: any, values: any) =>
                index == values.length - 1 ? '' : value,
            },
            grid: {
              drawTicks: false,
              display: true,
            },
          },
          B: {
            beginAtZero: true,
            type: 'linear',
            position: 'right',
            grid: { display: false },
            ticks: {
              showLabelBackdrop: false,
              z: 1,
              display: true,
              mirror: true,
              labelOffset: -15,
              padding: -3,
              callback: (value: any, index: any, values: any) =>
                index == values.length - 1 ? '' : value,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            usePointStyle: true,
            boxWidth: 15,
            position: 'nearest',
            displaycolors: false,
            backgroundColor: 'white',
            borderColor: 'rgba(94, 92, 92, 0.316)',
            borderWidth: 0.5,
            padding: { top: 18, left: 12, right: 10, bottom: 18 },
            boxPadding: 10,
            bodyFont: {
              size: 14,
              style: 'normal',
              family: 'Marianne',
              lineHeight: 1.5,
            },
            callbacks: {
              title: function () {
                return null
              },
              labelTextColor: (content: any) => {
                return 'black'
              },
              label: label,
            },
          },
        },
      },
      plugins: [yScaleTextStock, yScaleTextDTES],
    }
    this.myChart = new Chart(
      document.getElementById('dtes-chart') as ChartItem,
      config
    )
  }

  display(event: any) {
    let index: number | undefined = undefined
    if (event.label === 'projectedStock') index = 0
    if (event.label === 'simulatedStock') index = 1
    if (event.label === 'projectedDTES') index = 2
    if (event.label === 'simulatedDTES') index = 3
    const isDataShown = this.myChart.isDatasetVisible(index)
    if (isDataShown === true) this.myChart.hide(index)
    else this.myChart.show(index)
  }
}
