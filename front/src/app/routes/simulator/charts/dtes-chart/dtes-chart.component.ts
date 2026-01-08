import { Component, ElementRef, NgZone } from '@angular/core'
import * as _ from 'lodash'
import { Chart, ChartItem, registerables } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { SimulatorService } from '../../../../services/simulator/simulator.service'
import { findRealValue, getLongMonthString, getRangeOfMonths } from '../../../../utils/dates'
import { fixDecimal } from '../../../../utils/numbers'

import { LegendLabelComponent } from '../legend-label/legend-label.component'
/**
 * Composant graphique DTES simulateur
 */
@Component({
  selector: 'aj-dtes-chart',
  standalone: true,
  imports: [LegendLabelComponent],
  templateUrl: './dtes-chart.component.html',
  styleUrls: ['./dtes-chart.component.scss'],
})
export class DtesChartComponent {
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

        // Extraction des valeurs stock et DTES projetés depuis monthlyReport
        this.data.projectedStock.values = []
        this.data.projectedDTES.values = []


        if(this.simulatorService.isValidatedWhiteSimu.getValue()){

          this.data.simulatedStock.values = simulatorService.generateLinearData(
            simulatorService.getFieldValue('lastStock', simulatorService.situationActuelle.getValue()),
            value?.lastStock as number,
            this.labels.length,
            true,
          )
  
          this.data.simulatedDTES.values = simulatorService.generateLinearData(
            simulatorService.situationActuelle.getValue()!.realDTESInMonths as number,
            value?.realDTESInMonths as number,
            this.labels.length,
          )

          this.data.projectedStock.values = simulatorService.generateLinearData(
            simulatorService.getFieldValue('lastStock', simulatorService.situationActuelle.getValue()),
            simulatorService.getFieldValue('lastStock', simulatorService.situationProjected.getValue()),
            this.labels.length,
            true,
        )

        this.data.projectedDTES.values = simulatorService.generateLinearData(
          simulatorService.situationActuelle.getValue()!.realDTESInMonths as number,
          simulatorService.situationProjected.getValue()!.realDTESInMonths as number,
          this.labels.length,
        )
      }
      else {
        console.log('monthlyReportProjected', simulatorService.situationProjected.getValue())
        const monthlyReportProjected = simulatorService.situationProjected.getValue()?.monthlyReport
        const monthlyReportSimulated = simulatorService.situationSimulated.getValue()?.monthlyReport
        const selectedCategoryLabel = simulatorService.selectedCategory.getValue()?.label
        
        if (selectedCategoryLabel) {
          // Projeté
          if (monthlyReportProjected) {
            const categoryData = monthlyReportProjected.find((x: any) => x.name === selectedCategoryLabel)
            if (categoryData && categoryData.values) {
              const monthKeys = Object.keys(categoryData.values)
              this.data.projectedStock.values = monthKeys.map((key) => {
                const monthData = categoryData.values[key]
                return monthData.lastStock !== null && monthData.lastStock !== undefined ? monthData.lastStock : null
              })
              this.data.projectedDTES.values = monthKeys.map((key) => {
                const monthData = categoryData.values[key]
                if (monthData.DTES !== null && monthData.DTES !== undefined) {
                  return monthData.DTES < 0 ? 0 : monthData.DTES
                }
                return null
              })
            }
          }

          // Simulé
          if (monthlyReportSimulated) {
            const categoryDataSim = monthlyReportSimulated.find((x: any) => x.name === selectedCategoryLabel)
            if (categoryDataSim && categoryDataSim.values) {
              const monthKeys = Object.keys(categoryDataSim.values)
              this.data.simulatedStock.values = monthKeys.map((key) => {
                const monthData = categoryDataSim.values[key]
                return monthData.lastStock !== null && monthData.lastStock !== undefined ? monthData.lastStock : null
              })
              this.data.simulatedDTES.values = monthKeys.map((key) => {
                const monthData = categoryDataSim.values[key]
                if (monthData.DTES !== null && monthData.DTES !== undefined) {
                  return monthData.DTES < 0 ? 0 : monthData.DTES
                }
                return null
              })
            }
          }
        }
      }
        
        if (this.myChart !== null) {
          this.myChart.config.data.labels = this.labels
          this.myChart._metasets[0]._dataset.data = this.data.projectedStock.values
          this.myChart._metasets[1]._dataset.data = this.data.simulatedStock.values
          this.myChart._metasets[2]._dataset.data = this.data.projectedDTES.values
          this.myChart._metasets[3]._dataset.data = this.data.simulatedDTES.values
          this.myChart.update()
        }
        console.log('DATAS',this.data)
        console.log('isValidatedWhiteSimu',this.simulatorService.isValidatedWhiteSimu.getValue())
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
    this.simulatorService.chartAnnotationBox.next({ display: false })
    this.myChart.destroy()
    this.dateStart = new Date()
    this.dateStop = null
    this.myChart = null
    this.labels = null
    this.tooltip = { display: false }

    this.data = {
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

      if (sufix.slice(0, 4) === 'mois') lbl = '  ' + fixDecimal(localeParseFloat(context.formattedValue.replace(/\s/g, ''))) + ' ' + sufix
      else {
        lbl = '  ' + Math.round(localeParseFloat(context.formattedValue.replace(/\s/g, ''))) + ' ' + sufix
      }
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
          const projectedStock = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'projectedStock'
          })
          const simulatedStock = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'simulatedStock'
          })

          const projectedDTES = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'projectedDTES'
          })
          const simulatedDTES = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'simulatedDTES'
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
            projectedStock: projectedStock.data[firstPoint],
            simulatedStock: simulatedStock.data[firstPoint],
            projectedDTES: projectedDTES.data[firstPoint],
            simulatedDTES: simulatedDTES.data[firstPoint],
            x: (items[0].element.x > 175 ? items[0].element.x : 175) + 'px',
            y: min - 130 + 'px',
            trianglex: items[0].element.x + 'px',
            tirnagley: min - 2.5 + 'px',
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
            var firstPoint = items[0].index
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
                $this.realSelectedMonth = $this.labels![i]
                $this.myChart.update()
                colorArray.push('#0a76f6')
              } else {
                colorArray.push('rgb(109, 109, 109)')
              }
            }
            e.chart.options.plugins.tooltip.enabled = false
          } else {
            e.chart.options.plugins.tooltip.enabled = true
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
          events: ['click'],
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
              callback: (value: any, index: any, values: any) => (index == values.length - 1 ? '' : value),
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
              labelOffset: 0,
              padding: 20,
              callback: (value: any, index: any, values: any) => (index == values.length - 1 ? '' : value),
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
      plugins: [yScaleTextStock, yScaleTextDTES],
    }

    this.ngZone.runOutsideAngular(() => {
      this.myChart = new Chart(document.getElementById('dtes-chart') as ChartItem, config)
    })

    this.simulatorService.chartAnnotationBox.subscribe((value) => {
      if (this.myChart !== null) {
        this.myChart.options.plugins.annotation.annotations.box1.yMax = this.myChart.scales.A.max
        this.myChart.options.plugins.annotation.annotations.box1.yMin = this.myChart.scales.A.min
        this.myChart.options.plugins.annotation.annotations.box1.display = value.display
        this.myChart.options.plugins.annotation.annotations.box1.xMin = value.xMin
        this.myChart.options.plugins.annotation.annotations.box1.xMax = value.xMax
        this.myChart.options.plugins.annotation.annotations.box1.content = value.content

        this.myChart.options.plugins.tooltip.enabled = value.enableTooltip

        this.tooltip.projectedStock = value.projectedStock
        this.tooltip.simulatedStock = value.simulatedStock

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
            higuerYPosition = higuerYPosition < 30 ? 30 : higuerYPosition
            higuerXPosition = this.myChart.getDatasetMeta(0).data[value.pointIndex as number].x | 0
          }

          this.myChart.tooltip.active = false
          this.realSelectedMonth = value.selectedLabelValue as string
          tooltipEl.style.opacity = 1
          tooltipEl.style.left = value.x
          tooltipEl.style.top = higuerYPosition - 130 + 'px'
          tooltipElTriangle.style.opacity = 1
          tooltipElTriangle.style.left = Number(String(higuerXPosition).replace('px', '')) + 4 + 'px'
          tooltipElTriangle.style.top = Number(String(higuerYPosition - 130 + 'px').replace('px', '')) + 128 + 'px' //68

          this.tooltip.projectedStock = this.myChart.data.datasets[0].data[value.pointIndex as number]
          this.tooltip.simulatedStock = this.myChart.data.datasets[1].data[value.pointIndex as number]
          this.tooltip.projectedDTES = this.myChart.data.datasets[2].data[value.pointIndex as number]
          this.tooltip.simulatedDTES = this.myChart.data.datasets[3].data[value.pointIndex as number]

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
    if (event.label === 'projectedStock') index = 0
    if (event.label === 'simulatedStock') index = 1
    if (event.label === 'projectedDTES') index = 2
    if (event.label === 'simulatedDTES') index = 3
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
  getRounded(value: number, integer = false): number {
    if (integer) return Math.round(value)
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

  /**
   * Retourne la plus petite valeur
   * @param a
   * @param b
   * @returns
   */
  getMinValue(a: number, b: number): number {
    return a < b ? a : b
  }
}
