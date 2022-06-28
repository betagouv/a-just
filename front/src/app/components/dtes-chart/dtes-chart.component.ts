import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core'
import { getShortMonthString } from 'src/app/utils/dates'
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
  @Input() valueProjected: string = ''
  @Input() valueSimulated: string = ''
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
      console.log('new dateStop', value)
      this.stopRealValue = findRealValue(value)
      this.dateStop = value
      this.labels = this.getRangeOfMonths(
        new Date(this.dateStart),
        new Date(this.dateStop)
      )
      console.log(this.labels)
    })
    simulatorService.dateStart.subscribe((value) => {
      console.log('new dateStart', value)
      this.startRealValue = findRealValue(value)
      this.dateStart = value
      if (this.dateStop !== null) {
        this.labels = this.getRangeOfMonths(
          new Date(this.dateStart),
          new Date(this.dateStop)
        )
      }
    })
    simulatorService.situationSimulated.subscribe((value) => {
      console.log(value)
      console.log(
        'valllll  stock=>',
        simulatorService.getFieldValue(
          'lastStock',
          simulatorService.situationActuelle.getValue()
        ),
        simulatorService.getFieldValue(
          'lastStock',
          simulatorService.situationProjected.getValue()
        ),
        value?.lastStock as number
      )

      console.log(
        'valllll  realDTESInMonths=>',
        simulatorService.situationActuelle.getValue()!
          .realDTESInMonths as number,
        simulatorService.getFieldValue(
          'realDTESInMonths',
          simulatorService.situationProjected.getValue()
        ),
        value?.realDTESInMonths as number
      )
      console.log('new situationSimulated')

      if (this.labels !== null) {
        console.log('in this.labels !== null')

        this.data.projectedStock.values = this.generateLinearData(
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
        this.data.simulatedStock.values = this.generateLinearData(
          simulatorService.getFieldValue(
            'lastStock',
            simulatorService.situationActuelle.getValue()
          ),
          value?.lastStock as number,
          this.labels.length
        )

        this.data.simulatedDTES.values = this.generateLinearData(
          simulatorService.situationActuelle.getValue()!
            .realDTESInMonths as number,
          value?.realDTESInMonths as number,
          this.labels.length
        )

        this.data.projectedDTES.values = this.generateLinearData(
          simulatorService.situationActuelle.getValue()!
            .realDTESInMonths as number,
          simulatorService.situationProjected.getValue()!
            .realDTESInMonths as number,
          this.labels.length
        )

        if (this.myChart !== null) {
          console.log('in this.myChart !== null')

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
        console.log('end nuw Simu')
      }
    })

    this.elementRef = element.nativeElement
    Chart.register(...registerables)
  }

  generateLinearData(value1: number, value2: number, step: number) {
    let v = null
    if (step === 1 || step === 2) {
      v = [value1, value2]
    } else if (step === 3) {
      v = [value1, (value1 + value2) / 2, value2]
    } else {
      v = _.range(value1, value2, (value2 - value1) / step)
      v.push(value2)
    }
    v = v.map((x) => {
      return Math.floor(x)
    })
    return v
  }

  getRangeOfMonths(startDate: Date, endDate: Date) {
    const dates = new Array<string>()
    const dateCounter = new Date(startDate)
    // avoids edge case where last month is skipped
    dateCounter.setDate(1)
    const modulo = dateCounter.getMonth()
    while (dateCounter < endDate) {
      if (dateCounter.getMonth() === modulo)
        dates.push(
          `${
            getShortMonthString(dateCounter) +
            ' ' +
            dateCounter.getFullYear().toString().slice(-2)
          }`
        )
      else dates.push(`${getShortMonthString(dateCounter)}`)

      dateCounter.setMonth(dateCounter.getMonth() + 1)
    }
    if (dates.length === 1) return [dates[0], dates[0]]
    return dates
  }

  ngOnChanges() {}
  ngAfterViewInit(): void {
    // a générer
    const labels = this.labels

    const data = {
      labels: labels,
      datasets: [
        {
          label: 'projectedStock', // a supprimer
          yAxisID: 'A',
          backgroundColor: '#c3fad5', //'rgb(255, 99, 132)',
          borderColor: '#c3fad5', //'rgb(255, 99, 132)',
          data: this.data.projectedStock.values, // a générer
        },
        {
          label: 'simulatedStock', // a supprimer
          yAxisID: 'A',
          backgroundColor: '#6fe49d', //'rgb(255, 99, 132)',
          borderColor: '#6fe49d', //'rgb(255, 99, 132)',
          data: this.data.simulatedStock.values, // a générer
        },
        {
          label: 'projectedDTES', // a supprimer
          yAxisID: 'B',
          backgroundColor: '#bfcdff', //'rgb(255, 99, 132)',
          borderColor: '#bfcdff', //'rgb(255, 99, 132)',
          data: this.data.projectedDTES.values, // a générer
        },
        {
          yAxisID: 'B',
          label: 'simulatedDTES', // a supprimer
          backgroundColor: '#7b99e4', //'rgb(255, 99, 132)',
          borderColor: '#7b99e4', //'rgb(255, 99, 132)',
          data: this.data.simulatedDTES.values, // a générer
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
      let lbl = '  ' + context.formattedValue + ' ' + sufix //context.label +
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
      document.getElementById('myChart') as ChartItem,
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
