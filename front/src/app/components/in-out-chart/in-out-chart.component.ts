import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core'
import { Chart, ChartItem, registerables } from 'chart.js'
import { SimulatorService } from 'src/app/services/simulator/simulator.service'
import annotationPlugin from 'chartjs-plugin-annotation'
import {
  findRealValue,
  getLongMonthString,
  getRangeOfMonths,
} from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'

@Component({
  selector: 'aj-in-out-chart',
  templateUrl: './in-out-chart.component.html',
  styleUrls: ['./in-out-chart.component.scss'],
})
export class InOutChartComponent implements OnDestroy {
  dateStart: Date = new Date()
  dateStop: Date | null = null
  startRealValue = ''
  stopRealValue = ''
  elementRef: HTMLElement | undefined
  myChart: any = null
  labels: string[] | null = null
  tooltip: any = { display: false }
  realSelectedMonth = ''
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
    private simulatorService: SimulatorService
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
        this.data.simulatedIn.values = simulatorService.generateData(
          value?.totalIn as number,
          this.labels.length
        )

        this.data.simulatedOut.values = simulatorService.generateData(
          value?.totalOut as number,
          this.labels.length
        )

        this.data.projectedOut.values = simulatorService.generateData(
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
    Chart.register(annotationPlugin)
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.myChart.destroy()
    this.dateStart = new Date()
    this.dateStop = null
    this.myChart = null
    this.labels = null
    this.tooltip = { display: false }

    this.data = {
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
  }
  ngAfterViewInit(): void {
    const labels = this.labels

    const data = {
      labels: labels,
      datasets: [
        {
          label: 'projectedIn',
          yAxisID: 'A',
          backgroundColor: '#FCC63A',
          borderColor: '#FCC63A',
          data: this.data.projectedIn.values,
          fill: false,
        },
        {
          label: 'simulatedIn',
          yAxisID: 'A',
          backgroundColor: '#CB9F2D',
          borderColor: '#CB9F2D',
          data: this.data.simulatedIn.values,
          fill: false,
        },
        {
          label: 'projectedOut',
          yAxisID: 'A',
          backgroundColor: '#60E0EB',
          borderColor: '#60E0EB',
          data: this.data.projectedOut.values,
          fill: false,
        },
        {
          yAxisID: 'A',
          label: 'simulatedOut',
          backgroundColor: '#49B6C0',
          borderColor: '#49B6C0',
          data: this.data.simulatedOut.values,
          fill: false,
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
        ctx.restore()
      },
    }

    const label = (context: any) => {
      let sufix = ''
      switch (context.dataset.label) {
        case 'simulatedOut':
          sufix = 'sorties (simul??)'
          break
        case 'projectedOut':
          sufix = 'sorties (projet??)'
          break
        case 'simulatedIn':
          sufix = 'entr??es (simul??)'
          break
        case 'projectedIn':
          sufix = 'entr??es (projet??)'
          break
      }

      let lbl =
        '  ' +
        Math.floor(parseFloat(context.formattedValue.replace(/\s/g, ''))) +
        ' ' +
        sufix
      return lbl
    }

    let $this = this

    const externalTooltipHandler = (context: any) => {
      const { chart, tooltip } = context

      const { offsetLeft: positionX, offsetTop: positionY } =
        $this.myChart.canvas

      $this.tooltip = {
        offsetLeft: positionX,
        offsetTop: positionY,
        ...$this.tooltip,
        ...tooltip,
      }
    }

    const config: any = {
      type: 'line',
      data: data,
      options: {
        onClick: function (e: any, items: any) {
          if (items.length == 0) return

          var firstPoint = items[0].index
          const projectedIn = e.chart.config._config.data.datasets.find(
            (x: any) => {
              return x.label === 'projectedIn'
            }
          )
          const simulatedIn = e.chart.config._config.data.datasets.find(
            (x: any) => {
              return x.label === 'simulatedIn'
            }
          )
          const projectedOut = e.chart.config._config.data.datasets.find(
            (x: any) => {
              return x.label === 'projectedOut'
            }
          )
          const simulatedOut = e.chart.config._config.data.datasets.find(
            (x: any) => {
              return x.label === 'simulatedOut'
            }
          )

          const tooltipEl = $this.myChart.canvas.parentNode.querySelector('div')

          const yValues = items.map((object: any) => {
            return object.element.y
          })

          const min = Math.min(...yValues)
          tooltipEl.style.opacity = 1
          tooltipEl.style.left = items[0].element.x + 'px'
          tooltipEl.style.top = min - 130 + 'px'

          $this.affectTooltipValues({
            projectedIn: projectedIn.data[firstPoint],
            simulatedIn: simulatedIn.data[firstPoint],
            projectedOut: projectedOut.data[firstPoint],
            simulatedOut: simulatedOut.data[firstPoint],
            x: items[0].element.x + 'px',
            y: min - 130 + 'px',
            pointIndex: firstPoint,
            selectedLabelValue: e.chart.data.labels[firstPoint],
            enableTooltip: false,
          })

          const colorArray = []

          if (
            e.chart.options.plugins.annotation.annotations.box1.content ===
            undefined
          ) {
            if (
              e.chart.options.plugins.annotation.annotations.box1.display ===
              false
            ) {
              e.chart.options.plugins.annotation.annotations.box1.display = true
              $this.updateAnnotationBox(true, 0, 0)
            }
            if (firstPoint === 0) {
              e.chart.options.plugins.annotation.annotations.box1.xMin = 0
              e.chart.options.plugins.annotation.annotations.box1.xMax = 0.5
              $this.updateAnnotationBox(true, 0, 0.5)
            } else if (firstPoint === e.chart.scales.x.max) {
              e.chart.options.plugins.annotation.annotations.box1.xMin =
                e.chart.scales.x.max - 0.5
              e.chart.options.plugins.annotation.annotations.box1.xMax =
                e.chart.scales.x.max
              $this.updateAnnotationBox(
                true,
                e.chart.scales.x.max - 0.5,
                e.chart.scales.x.max
              )
            } else {
              e.chart.options.plugins.annotation.annotations.box1.xMin =
                firstPoint - 0.5
              e.chart.options.plugins.annotation.annotations.box1.xMax =
                firstPoint + 0.5
              $this.updateAnnotationBox(
                true,
                firstPoint - 0.5,
                firstPoint + 0.5
              )
            }
            e.chart.options.plugins.annotation.annotations.box1.yMax =
              e.chart.scales.A.max
            for (let i = 0; i < e.chart.data.datasets[0].data.length; i++) {
              if (firstPoint === i) {
                colorArray.push('#0a76f6')
              } else {
                colorArray.push('rgb(109, 109, 109)')
              }
            }
          } else {
            $this.affectTooltipValues({
              pointIndex: null,
              enableTooltip: true,
            })
            for (let i = 0; i < e.chart.data.datasets[0].data.length; i++) {
              colorArray.push('rgb(109, 109, 109)')
            }
            e.chart.options.plugins.annotation.annotations.box1.content =
              undefined
            $this.updateAnnotationBox(false, 0, 0, undefined)
            tooltipEl.style.opacity = 0
          }
          e.chart.config.options.scales.x.ticks.color = colorArray
          e.chart.update()
        },
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
            ticks: {
              color: 'rgb(109, 109, 109)',
            },
            grid: {
              drawTicks: true,
              tickColor: 'white',
              offset: true, // middle labels
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
          autocolors: false,
          annotation: {
            click: function (e: any, items: any) {
              if (items.length == 0) return
              items.chart.options.plugins.annotation.annotations.box1.display =
                false
              e.chart.options.plugins.annotation.annotations.box1.content = ''
              items.chart.update()
              $this.updateAnnotationBox(false, undefined, undefined, '')
            },
            annotations: {
              box1: {
                display: false,
                type: 'box',
                yScaleID: 'A',
                xMin: 0,
                xMax: 1,
                yMin: 0,
                yMax: 5,
                backgroundColor: 'rgba(255, 99, 132, 0.25)',
              },
            },
          },
          corsair: {
            dash: [4, 4],
            color: '#1b1b35',
            width: 1,
          },
          filler: {
            propagate: true,
          },
          legend: {
            display: false,
          },
          tooltip: {
            external: externalTooltipHandler,
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
      plugins: [
        yScaleTextInOut,
        /**
        {
          id: 'corsair',
          afterInit: (chart: any) => {
            chart.corsair = {
              x: 0,
              y: 0,
            }
          },
          afterEvent: (chart: any, evt: any) => {
            const {
              chartArea: { top, bottom, left, right },
            } = chart
            const {
              event: { x, y },
            } = evt
            if (x < left || x > right || y < top || y > bottom) {
              chart.corsair = {
                x,
                y,
                draw: false,
              }
              chart.draw()
              return
            }

            chart.corsair = {
              x,
              y,
              draw: true,
            }

            chart.draw()
          },
          afterDatasetsDraw: (chart: any, _: any, opts: any) => {
            const {
              ctx,
              chartArea: { top, bottom, left, right },
            } = chart
            const { x, y, draw } = chart.corsair

            if (!draw) {
              return
            }

            ctx.lineWidth = opts.width || 0
            ctx.setLineDash(opts.dash || [])
            ctx.strokeStyle = opts.color || 'black'

            ctx.save()
            ctx.beginPath()
            ctx.moveTo(x, bottom)
            ctx.lineTo(x, top)
            ctx.moveTo(left, y)
            ctx.lineTo(right, y)
            ctx.stroke()
            ctx.restore()
          },
        },*/
      ],
    }
    this.myChart = new Chart(
      document.getElementById('in-out-chart') as ChartItem,
      config
    )

    this.simulatorService.chartAnnotationBox.subscribe((value) => {
      if (this.myChart !== null) {
        this.myChart.options.plugins.annotation.annotations.box1.yMax =
          this.myChart.scales.A.max
        this.myChart.options.plugins.annotation.annotations.box1.display =
          value.display
        this.myChart.options.plugins.annotation.annotations.box1.xMin =
          value.xMin
        this.myChart.options.plugins.annotation.annotations.box1.xMax =
          value.xMax
        this.myChart.options.plugins.annotation.annotations.box1.content =
          value.content

        this.myChart.options.plugins.tooltip.enabled = value.enableTooltip

        this.tooltip.projectedIn = value.projectedIn
        this.tooltip.simulatedIn = value.simulatedIn
        this.tooltip.projectedOut = value.projectedOut
        this.tooltip.simulatedOut = value.simulatedOut

        const tooltipEl = $this.myChart.canvas.parentNode.querySelector('div')
        const colorArray = []

        if (value.x) {
          this.myChart.tooltip.active = false
          this.realSelectedMonth = value.selectedLabelValue as string
          tooltipEl.style.opacity = 1
          tooltipEl.style.left = value.x
          tooltipEl.style.top = value.y
          this.tooltip.projectedIn =
            this.myChart.data.datasets[0].data[value.pointIndex as number]
          this.tooltip.simulatedIn =
            this.myChart.data.datasets[1].data[value.pointIndex as number]
          this.tooltip.projectedOut =
            this.myChart.data.datasets[2].data[value.pointIndex as number]
          this.tooltip.simulatedOut =
            this.myChart.data.datasets[3].data[value.pointIndex as number]
          for (let i = 0; i < this.myChart.data.datasets[0].data.length; i++) {
            if ((value.pointIndex as number) === i) {
              colorArray.push('#0a76f6')
            } else {
              colorArray.push('rgb(109, 109, 109)')
            }
          }
          this.myChart.config.options.scales.x.ticks.color = colorArray
        }
        if (value.display === false) {
          this.myChart.tooltip.active = true
          tooltipEl.style.opacity = 0
          for (let i = 0; i < this.myChart.data.datasets[0].data.length; i++) {
            colorArray.push('rgb(109, 109, 109)')
          }
          this.myChart.config.options.scales.x.ticks.color = colorArray
        }

        this.myChart.update()
      }
    })
  }

  display(event: any) {
    let index: number | undefined = undefined
    if (event.label === 'projectedIn') index = 0
    if (event.label === 'simulatedIn') index = 1
    if (event.label === 'projectedOut') index = 2
    if (event.label === 'simulatedOut') index = 3
    if (this.myChart !== null) {
      const isDataShown = this.myChart.isDatasetVisible(index)
      if (isDataShown === true) this.myChart.hide(index)
      else this.myChart.show(index)
    }
  }

  affectTooltipValues(obj: any) {
    this.simulatorService.chartAnnotationBox.next({
      ...this.simulatorService.chartAnnotationBox.getValue(),
      ...obj,
    })
  }

  updateAnnotationBox(
    display?: boolean,
    xMin?: number | undefined,
    xMax?: number,
    content?: any
  ) {
    this.simulatorService.chartAnnotationBox.next({
      ...this.simulatorService.chartAnnotationBox.getValue(),
      display,
      xMin,
      xMax,
      content,
    })
  }

  getDeltaInPercent(value1: number, value2: number): number {
    if (value1 !== undefined && value2 !== undefined) {
      return fixDecimal(((value1 - value2) / value2) * 100) as number
    }
    return 0
  }

  getRounded(value: number): number {
    return fixDecimal(value)
  }
  getRealMonth(month: string) {
    return getLongMonthString(month.split(' ')[0]) + ' 20' + month.split(' ')[1]
  }
}
