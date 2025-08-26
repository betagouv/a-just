import { Component, ElementRef, NgZone, OnDestroy } from '@angular/core'
import { Chart, ChartItem, registerables } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { LegendLabelComponent } from '../legend-label/legend-label.component'
import { SimulatorService } from '../../../../services/simulator/simulator.service'
import { findRealValue, getLongMonthString, getRangeOfMonths } from '../../../../utils/dates'
import { fixDecimal } from '../../../../utils/numbers'

/**
 * Composant graphique entrée sortie simulateur
 */
@Component({
  selector: 'aj-in-out-chart',
  standalone: true,
  imports: [LegendLabelComponent],
  templateUrl: './in-out-chart.component.html',
  styleUrls: ['./in-out-chart.component.scss'],
})
export class InOutChartComponent implements OnDestroy {
  /**
   * Date début
   */
  dateStart: Date = new Date()
  /**
   * Date fin
   */
  dateStop: Date | null = null
  /**
   * Valeur de début
   */
  startRealValue = ''
  /**
   * Valeur de fin
   */
  stopRealValue = ''
  /**
   * Valeur de fin
   */
  elementRef: HTMLElement | undefined
  /**
   * Object Chart.js
   */
  myChart: any = null
  /**
   * Liste des mois en abscisse
   */
  labels: string[] | null = null
  /**
   * Affichage Tooltip element au survol de la souris
   */
  tooltip: any = { display: false }
  /**
   * Mois selectionné
   */
  realSelectedMonth = ''
  /**
   * Données graphiques
   */
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

  /**
   * Constructeur
   * @param element Element HTML
   * @param simulatorService Service simulateur
   */
  constructor(element: ElementRef<HTMLElement>, private simulatorService: SimulatorService, private ngZone: NgZone) {
    simulatorService.dateStop.subscribe((value) => {
      if (value !== undefined) {
        this.stopRealValue = findRealValue(value)
        this.dateStop = value
        this.labels = getRangeOfMonths(new Date(this.dateStart), new Date(this.dateStop))
      }
    })
    simulatorService.dateStart.subscribe((value) => {
      this.startRealValue = findRealValue(value)
      this.dateStart = value
      if (this.dateStop !== null) {
        this.labels = getRangeOfMonths(new Date(this.dateStart), new Date(this.dateStop))
      }
    })
    simulatorService.situationSimulated.subscribe((value) => {
      if (this.labels !== null) {
        this.data.projectedIn.values = simulatorService.generateLinearData(
          simulatorService.getFieldValue('totalIn', simulatorService.situationActuelle.getValue()),
          simulatorService.getFieldValue('totalIn', simulatorService.situationProjected.getValue()),
          this.labels.length,
        )
        this.data.simulatedIn.values = simulatorService.generateData(value?.totalIn as number, this.labels.length)

        this.data.simulatedOut.values = simulatorService.generateData(value?.totalOut as number, this.labels.length)

        this.data.projectedOut.values = simulatorService.generateData(simulatorService.situationProjected.getValue()!.totalOut as number, this.labels.length)

        if (this.myChart !== null) {
          this.myChart.config.data.labels = this.labels
          this.myChart._metasets[0]._dataset.data = this.data.projectedIn.values
          this.myChart._metasets[1]._dataset.data = this.data.simulatedIn.values
          this.myChart._metasets[2]._dataset.data = this.data.projectedOut.values
          this.myChart._metasets[3]._dataset.data = this.data.simulatedOut.values
          this.myChart.update()
        }
      }
    })

    this.elementRef = element.nativeElement
    Chart.register(...registerables)
    Chart.register(annotationPlugin)
  }

  /**
   * Réinitialisation lors de la destruction du composant
   */
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

  /**
   * Remplissage du graphique après l'initialisation du composant
   */
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

    function localeParseFloat(s: string, locale?: any) {
      // Get the thousands and decimal separator characters used in the locale.
      let [, thousandsSeparator, , , , decimalSeparator] = (1111.1).toLocaleString(locale)
      // Remove thousand separators, and put a point where the decimal separator occurs
      s = Array.from(s, (c) => (c === thousandsSeparator ? '' : c === decimalSeparator ? '.' : c)).join('')
      // Now it can be parsed
      return parseFloat(s)
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

      let lbl = '  ' + Math.floor(localeParseFloat(context.formattedValue.replace(/\s/g, ''))) + ' ' + sufix
      return lbl
    }

    let $this = this

    const externalTooltipHandler = (context: any) => {
      const { chart, tooltip } = context

      const { offsetLeft: positionX, offsetTop: positionY } = $this.myChart.canvas

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
          const projectedIn = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'projectedIn'
          })
          const simulatedIn = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'simulatedIn'
          })
          const projectedOut = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'projectedOut'
          })
          const simulatedOut = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'simulatedOut'
          })

          const tooltipEl = $this.myChart.canvas.parentNode.querySelector('#chartjs-tooltip')
          const tooltipElTriangle = $this.myChart.canvas.parentNode.querySelector('#chartjs-tooltip-triangle')

          const yValues = items.map((object: any) => {
            return object.element.y
          })

          const min = Math.min(...yValues)
          tooltipEl.style.opacity = 1

          tooltipEl.style.left = (items[0].element.x > 175 ? items[0].element.x : 175) + 'px'
          tooltipEl.style.top = min - 130 + 'px'

          tooltipElTriangle.style.opacity = 1
          tooltipElTriangle.style.left = items[0].element.x + 4 + 'px'
          tooltipElTriangle.style.top = min + 'px'

          $this.affectTooltipValues({
            projectedIn: projectedIn.data[firstPoint],
            simulatedIn: simulatedIn.data[firstPoint],
            projectedOut: projectedOut.data[firstPoint],
            simulatedOut: simulatedOut.data[firstPoint],
            x: (items[0].element.x > 175 ? items[0].element.x : 175) + 'px',
            y: min - 130 + 'px',
            trianglex: items[0].element.x + 4 + 'px',
            tirnagley: min + 'px',
            pointIndex: firstPoint,
            selectedLabelValue: e.chart.data.labels[firstPoint],
            enableTooltip: false,
          })

          const colorArray = []

          if (e.chart.options.plugins.annotation.annotations.box1.content === undefined) {
            if (e.chart.options.plugins.annotation.annotations.box1.display === false) {
              e.chart.options.plugins.annotation.annotations.box1.display = true
              $this.updateAnnotationBox(true, 0, 0)
            }
            if (firstPoint === 0) {
              e.chart.options.plugins.annotation.annotations.box1.xMin = 0
              e.chart.options.plugins.annotation.annotations.box1.xMax = 0.5
              $this.updateAnnotationBox(true, 0, 0.5)
            } else if (firstPoint === e.chart.scales.x.max) {
              e.chart.options.plugins.annotation.annotations.box1.xMin = e.chart.scales.x.max - 0.5
              e.chart.options.plugins.annotation.annotations.box1.xMax = e.chart.scales.x.max
              $this.updateAnnotationBox(true, e.chart.scales.x.max - 0.5, e.chart.scales.x.max)
            } else {
              e.chart.options.plugins.annotation.annotations.box1.xMin = firstPoint - 0.5
              e.chart.options.plugins.annotation.annotations.box1.xMax = firstPoint + 0.5
              $this.updateAnnotationBox(true, firstPoint - 0.5, firstPoint + 0.5)
            }
            e.chart.options.plugins.annotation.annotations.box1.yMax = e.chart.scales.A.max
            for (let i = 0; i < e.chart.data.datasets[0].data.length; i++) {
              if (firstPoint === i) {
                $this.myChart.update()
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
            e.chart.options.plugins.annotation.annotations.box1.content = undefined
            $this.updateAnnotationBox(false, 0, 0, undefined)
            tooltipEl.style.opacity = 0
            tooltipElTriangle.style.opacity = 0
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
              var percent = Math.round((dataset['data'][tooltipItem['index']] / dataset['_meta'][0]['total']) * 100)
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
              callback: (value: any, index: any, values: any) => (index == values.length - 1 ? '' : value),
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
              items.chart.options.plugins.annotation.annotations.box1.display = false
              e.chart.options.plugins.annotation.annotations.box1.content = ''
              $this.updateAnnotationBox(false, undefined, undefined, '')
              items.chart.update()
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
      plugins: [yScaleTextInOut],
    }

    this.ngZone.runOutsideAngular(() => {
      this.myChart = new Chart(document.getElementById('in-out-chart') as ChartItem, config)
    })

    this.simulatorService.chartAnnotationBox.subscribe((value) => {
      if (this.myChart !== null) {
        this.myChart.options.plugins.annotation.annotations.box1.yMax = this.myChart.scales.A.max
        this.myChart.options.plugins.annotation.annotations.box1.display = value.display
        this.myChart.options.plugins.annotation.annotations.box1.xMin = value.xMin
        this.myChart.options.plugins.annotation.annotations.box1.xMax = value.xMax
        this.myChart.options.plugins.annotation.annotations.box1.content = value.content

        this.myChart.options.plugins.tooltip.enabled = value.enableTooltip

        this.tooltip.projectedIn = value.projectedIn
        this.tooltip.simulatedIn = value.simulatedIn
        this.tooltip.projectedOut = value.projectedOut
        this.tooltip.simulatedOut = value.simulatedOut

        const tooltipEl = $this.myChart.canvas.parentNode.querySelector('#chartjs-tooltip')
        const tooltipElTriangle = $this.myChart.canvas.parentNode.querySelector('#chartjs-tooltip-triangle')
        const colorArray = []

        if (value.x) {
          let higuerYPosition = value.y ? value.y : 0
          let higuerXPosition = value.x ? value.x : 0

          if (value.pointIndex !== null) {
            // xScale.top
            higuerYPosition = Math.min(
              this.myChart.getDatasetMeta(0).data[value.pointIndex as number].y | 0,
              this.myChart.getDatasetMeta(1).data[value.pointIndex as number].y | 0,
              this.myChart.getDatasetMeta(2).data[value.pointIndex as number].y | 0,
              this.myChart.getDatasetMeta(3).data[value.pointIndex as number].y | 0,
            )
            higuerYPosition = higuerYPosition < 20 ? 20 : higuerYPosition
            higuerXPosition = this.myChart.getDatasetMeta(0).data[value.pointIndex as number].x | 0
          }

          this.myChart.tooltip.active = false
          this.realSelectedMonth = value.selectedLabelValue as string
          tooltipEl.style.opacity = 1
          tooltipEl.style.left = value.x
          tooltipEl.style.top = higuerYPosition - 130 + 'px'
          tooltipElTriangle.style.opacity = 1
          tooltipElTriangle.style.left = Number(String(higuerXPosition).replace('px', '')) + 10 + 'px'
          tooltipElTriangle.style.top = Number(String(higuerYPosition - 130 + 'px').replace('px', '')) + 128 + 'px'
          this.tooltip.projectedIn = this.myChart.data.datasets[0].data[value.pointIndex as number]
          this.tooltip.simulatedIn = this.myChart.data.datasets[1].data[value.pointIndex as number]
          this.tooltip.projectedOut = this.myChart.data.datasets[2].data[value.pointIndex as number]
          this.tooltip.simulatedOut = this.myChart.data.datasets[3].data[value.pointIndex as number]
          for (let i = 0; i < this.myChart.data.datasets[0].data.length; i++) {
            if ((value.pointIndex as number) === i) {
              colorArray.push('#0a76f6')
            } else {
              colorArray.push('rgb(109, 109, 109)')
            }
          }
          this.myChart.config.options.scales.x.ticks.color = colorArray
        }
        this.myChart.update()
        this.ngZone.run(() => {
          this.myChart.update()
        })
        if (value.display === false) {
          this.myChart.tooltip.active = true
          tooltipEl.style.opacity = 0
          tooltipElTriangle.style.opacity = 0

          for (let i = 0; i < this.myChart.data.datasets[0].data.length; i++) {
            colorArray.push('rgb(109, 109, 109)')
          }
          this.myChart.config.options.scales.x.ticks.color = colorArray
        }

        this.myChart.update()
      }
    })
  }

  /**
   * Afficher/Masquer une courbe
   * @param event Evenement toogle d'affichage d'une courbe
   */
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

  /**
   * Synchronisation des tooltip sur les graphiques
   * @param obj Tooltip values
   */
  affectTooltipValues(obj: any) {
    this.simulatorService.chartAnnotationBox.next({
      ...this.simulatorService.chartAnnotationBox.getValue(),
      ...obj,
    })
  }

  /**
   * Maj de la popin
   * @param display Affichage de la popin
   * @param xMin Abscisse min popin
   * @param xMax Abscisse max popin
   * @param content Contenue de la popin
   */
  updateAnnotationBox(display?: boolean, xMin?: number | undefined, xMax?: number, content?: any) {
    this.simulatorService.chartAnnotationBox.next({
      ...this.simulatorService.chartAnnotationBox.getValue(),
      display,
      xMin,
      xMax,
      content,
    })
  }

  /**
   * Calcul de pourcentage
   * @param value1 Numérateur
   * @param value2 Dénominateur
   * @returns
   */
  getDeltaInPercent(value1: number, value2: number): number {
    if (value1 !== undefined && value2 !== undefined) {
      return fixDecimal(((value1 - value2) / value2) * 100) as number
    }
    return 0
  }

  /**
   * Calcul l'arrondi d'un nombre
   * @param value Nombre
   * @returns Retourne l'arrondi d'un nombre
   */
  getRounded(value: number): number {
    return fixDecimal(value)
  }
  /**
   * Récupération du label MOIS
   * @param month chaine de caractère MOIS
   * @returns Retourne le nom de mois entier
   */
  getRealMonth(month: string) {
    return getLongMonthString(month.split(' ')[0]) + ' 20' + month.split(' ')[1]
  }
}
