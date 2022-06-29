import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core'
import { Chart, ChartItem, registerables } from 'chart.js'
import { SimulatorService } from 'src/app/services/simulator/simulator.service'
import { findRealValue, getRangeOfMonths } from 'src/app/utils/dates'

@Component({
  selector: 'aj-etp-chart',
  templateUrl: './etp-chart.component.html',
  styleUrls: ['./etp-chart.component.scss'],
})
export class EtpChartComponent implements AfterViewInit {
  dateStart: Date = new Date()
  dateStop: Date | null = null
  startRealValue = ''
  stopRealValue = ''
  elementRef: HTMLElement | undefined
  myChart: any = null
  labels: string[] | null = null
  data = {
    projectedMag: {
      values: [0],
      dotColor: '#e07dd8',
      bgColor: '#fdc0f8',
    },
    simulatedMag: {
      values: [0],
      dotColor: '#fdc0f8',
      bgColor: '#e07dd8',
    },
    projectedGref: {
      values: [],
      dotColor: '#f083a0',
      bgColor: '#ffcade',
    },
    simulatedGref: {
      values: [],
      dotColor: '#ffcade',
      bgColor: '#f083a0',
    },
    projectedCont: {
      values: [],
      dotColor: '#fdbfb7',
      bgColor: '#fcd7d3',
    },
    simulatedCont: {
      values: [],
      dotColor: '#fcd7d3',
      bgColor: '#eba89f',
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
        this.data.simulatedMag.values = simulatorService.generateLinearData(
          value?.etpMag as number,
          value?.etpMag as number,
          this.labels.length
        )

        if (this.myChart !== null) {
          this.myChart.config.data.labels = this.labels
          this.myChart._metasets[0]._dataset.data =
            this.data.simulatedMag.values
          this.myChart.update()
        }
      }
      /**
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
        }  }
         */
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
          label: 'projectedMag',
          yAxisID: 'A',
          backgroundColor: this.data.projectedMag.bgColor,
          borderColor: this.data.projectedMag.bgColor,
          data: this.data.projectedMag.values,
        },
        {
          label: 'simulatedMag',
          yAxisID: 'A',
          backgroundColor: this.data.simulatedMag.bgColor,
          borderColor: this.data.simulatedMag.bgColor,
          data: this.data.simulatedMag.values,
        },
        {
          label: 'projectedGref',
          yAxisID: 'A',
          backgroundColor: this.data.projectedGref.bgColor,
          borderColor: this.data.projectedGref.bgColor,
          data: this.data.projectedGref.values,
        },
        {
          yAxisID: 'A',
          label: 'simulatedGref',
          backgroundColor: this.data.simulatedGref.bgColor,
          borderColor: this.data.simulatedGref.bgColor,
          data: this.data.simulatedGref.values,
        },
        {
          label: 'projectedCont',
          yAxisID: 'A',
          backgroundColor: this.data.projectedCont.bgColor,
          borderColor: this.data.projectedCont.bgColor,
          data: this.data.projectedCont.values,
        },
        {
          yAxisID: 'A',
          label: 'simulatedCont',
          backgroundColor: this.data.simulatedCont.bgColor,
          borderColor: this.data.simulatedCont.bgColor,
          data: this.data.simulatedCont.values,
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
        ctx.fillText('ETPT', -4, top - 2)
        ctx.restore()
      },
    }

    const label = (context: any) => {
      let sufix = ''
      switch (context.dataset.label) {
        case 'projectedMag':
          sufix = 'agents (simulé)'
          break
        case 'simulatedMag':
          sufix = 'agents (projeté)'
          break
        case 'projectedGref':
          sufix = 'agents (simulé)'
          break
        case 'simulatedGref':
          sufix = 'agents (projeté)'
          break
        case 'projectedCont':
          sufix = 'agents (simulé)'
          break
        case 'simulatedCont':
          sufix = 'agents (projeté)'
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
      plugins: [yScaleTextStock],
    }
    this.myChart = new Chart(
      document.getElementById('etp-chart') as ChartItem,
      config
    )
  }

  display(event: any) {
    let index: number | undefined = undefined
    if (event.label === 'projectedMag') index = 0
    if (event.label === 'simulatedMag') index = 1
    if (event.label === 'projectedGref') index = 2
    if (event.label === 'simulatedGref') index = 3
    if (event.label === 'projectedCont') index = 4
    if (event.label === 'simulatedCont') index = 5
    if (this.myChart !== null) {
      const isDataShown = this.myChart.isDatasetVisible(index)
      if (isDataShown === true) this.myChart.hide(index)
      else this.myChart.show(index)
    }
  }
}
