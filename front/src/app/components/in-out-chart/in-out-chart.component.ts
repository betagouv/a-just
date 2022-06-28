import { Component, ElementRef, OnInit } from '@angular/core'
import { Chart, ChartItem, registerables } from 'chart.js'
import { SimulatorService } from 'src/app/services/simulator/simulator.service'
import { findRealValue, getRangeOfMonths } from 'src/app/utils/dates'

@Component({
  selector: 'aj-in-out-chart',
  templateUrl: './in-out-chart.component.html',
  styleUrls: ['./in-out-chart.component.scss'],
})
export class InOutChartComponent implements OnInit {
  dateStart: Date = new Date()
  dateStop: Date | null = null
  startRealValue = ''
  stopRealValue = ''
  elementRef: HTMLElement | undefined
  myChart: any = null
  labels: string[] | null = null
  data = {
    projectedIn: {
      values: [0],
    },
    simulatedIn: {
      values: [0],
    },
    projectedOut: {
      values: [0],
    },
    simulatedOut: {
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
        this.data.projectedIn.values = simulatorService.generateLinearData(
          simulatorService.getFieldValue(
            'totalIn',
            simulatorService.situationActuelle.getValue()
          ),
          simulatorService.getFieldValue(
            'totalIn',
            simulatorService.situationProjected.getValue()
          ),
          this.labels.length
        )
        this.data.simulatedIn.values = simulatorService.generateLinearData(
          simulatorService.getFieldValue(
            'totalIn',
            simulatorService.situationActuelle.getValue()
          ),
          value?.totalIn as number,
          this.labels.length
        )

        this.data.simulatedOut.values = simulatorService.generateLinearData(
          simulatorService.situationActuelle.getValue()!.totalOut as number,
          value?.totalOut as number,
          this.labels.length
        )

        this.data.projectedOut.values = simulatorService.generateLinearData(
          simulatorService.situationActuelle.getValue()!.totalOut as number,
          simulatorService.situationProjected.getValue()!.totalOut as number,
          this.labels.length
        )

        if (this.myChart !== null) {
          this.myChart.config.data.labels = this.labels
          this.myChart._metasets[0]._dataset.data = this.data.projectedIn.values
          this.myChart._metasets[1]._dataset.data = this.data.simulatedIn.values
          this.myChart._metasets[2]._dataset.data =
            this.data.projectedOut.values
          this.myChart._metasets[3]._dataset.data =
            this.data.simulatedOut.values
          this.myChart.update()
        }
      }
    })

    this.elementRef = element.nativeElement
    Chart.register(...registerables)
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const labels = this.labels

    const data = {
      labels: labels,
      datasets: [
        {
          label: 'projectedIn',
          yAxisID: 'A',

          backgroundColor: 'rgba(254, 235, 208, 0.5)', //claire
          borderColor: 'rgba(254, 235, 208, 0.5)', //'#feebd0',
          data: this.data.projectedIn.values,
          fill: true,
        },
        {
          label: 'simulatedIn',
          yAxisID: 'A',
          backgroundColor: 'rgba(252, 198, 58, 0.7)', //fonce
          borderColor: 'rgba(252, 198, 58, 0.7)', //'#fcc63a',
          data: this.data.simulatedIn.values,
          fill: '-1',
        },
        {
          label: 'projectedOut',
          yAxisID: 'A',
          backgroundColor: 'rgba(199, 246, 252, 0.5)',
          borderColor: 'rgba(199, 246, 252, 0.5)', //'#60e0eb', // fonce rgba(96, 224, 235, 1)
          data: this.data.projectedOut.values,
          fill: '-1',
        },
        {
          yAxisID: 'A',
          label: 'simulatedOut',
          backgroundColor: 'rgba(96, 224, 235, 0.7)', //claire //'#c7f6fc', // claire rgba(199, 246, 252, 1)
          borderColor: 'rgba(96, 224, 235, 0.7)',
          data: this.data.simulatedOut.values,
          fill: '-1',
        },
      ],
    }

    const yScaleTextInOut = {
      id: 'yScaleTextInOut',
      afterDraw(chart: any, args: any, options: any) {
        const ctx = chart.ctx
        const top = chart.chartArea.top
        ctx.save()
        ctx.font = '14px Arial'
        ctx.fillStyle = '#666'
        //ctx.fillText('Stock', 1, top - 2)
        ctx.restore()
      },
    }

    const label = (context: any) => {
      let sufix = ''
      switch (context.dataset.label) {
        case 'simulatedOut':
          sufix = 'sorties (simulé)'
          break
        case 'projectedOut':
          sufix = 'sorties (projeté)'
          break
        case 'simulatedIn':
          sufix = 'entrées (simulé)'
          break
        case 'projectedIn':
          sufix = 'entrées (projeté)'
          break
      }
      let lbl = '  ' + context.formattedValue + ' ' + sufix
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
        },
        plugins: {
          filler: {
            propagate: true,
          },
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
      plugins: [yScaleTextInOut],
    }
    this.myChart = new Chart(
      document.getElementById('in-out-chart') as ChartItem,
      config
    )
  }

  display(event: any) {
    let index: number | undefined = undefined
    if (event.label === 'projectedIn') index = 0
    if (event.label === 'simulatedIn') index = 1
    if (event.label === 'projectedOut') index = 2
    if (event.label === 'simulatedOut') index = 3
    const isDataShown = this.myChart.isDatasetVisible(index)
    if (isDataShown === true) this.myChart.hide(index)
    else this.myChart.show(index)
  }
}
