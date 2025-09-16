import { CommonModule } from '@angular/common'
import { AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy } from '@angular/core'
import { Chart, ChartItem, registerables } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { LegendLabelComponent } from '../legend-label/legend-label.component'
import { SimulatorService } from '../../../../services/simulator/simulator.service'
import { findRealValue, findRealValueCustom, getLongMonthString, getRangeOfMonths } from '../../../../utils/dates'
import { fixDecimal } from '../../../../utils/numbers'

/**
 * Composant graphique etp du simulateur
 */
@Component({
  selector: 'aj-etp-chart',
  standalone: true,
  imports: [CommonModule, LegendLabelComponent],
  templateUrl: './etp-chart.component.html',
  styleUrls: ['./etp-chart.component.scss'],
})
export class EtpChartComponent implements AfterViewInit, OnDestroy {
  /**
   * Date de début de simulation
   */
  dateStart: Date = new Date()
  /**
   * Date de fin de simulation
   */
  dateStop: Date | null = null
  /**
   * Valeur de début de simulation
   */
  startRealValue = ''
  /**
   * Valeur de début de simulation mois année
   */
  startRealValueShort = ''
  /**
   * Valeur de fin de simulation
   */
  stopRealValue = ''
  /**
   * Valeur de fin de simulation mois année
   */
  stopRealValueShort = ''
  /**
   * Element html du graphique
   */
  elementRef: HTMLElement | undefined
  /**
   * Objet Chart JS correspondant au graphique
   */
  myChart: any = null
  /**
   * Catégorie selectionnée (magistrat, fonctionnaire...)
   */
  @Input() categorySelected = ''
  /**
   * Peux voir l'interface magistrat
   */
  @Input() canViewMagistrat: boolean = false
  /**
   * Peux voir l'interface greffier
   */
  @Input() canViewGreffier: boolean = false
  /**
   * Peux voir l'interface contractuel
   */
  @Input() canViewContractuel: boolean = false
  /**
   * Peux voir l'interface contractuel
   */
  @Input() whiteSimulator: boolean = false
  /**
   * Labels sur l'axe des abscisse
   */
  labels: string[] | null = null
  /**
   * Affichage du tooltip au survol
   */
  tooltip: any = { display: false }
  /**
   * Mois selectionné
   */
  realSelectedMonth = ''

  /**
   * Caractéristiques du graphique
   */
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
      values: [0],
      dotColor: '#f083a0',
      bgColor: '#ffcade',
    },
    simulatedGref: {
      values: [0],
      dotColor: '#ffcade',
      bgColor: '#f083a0',
    },
    projectedCont: {
      values: [0],
      dotColor: '#fdbfb7',
      bgColor: '#fcd7d3',
    },
    simulatedCont: {
      values: [0],
      dotColor: '#fcd7d3',
      bgColor: '#eba89f',
    },
  }

  /**
   * Constructeur
   * @param element element html
   * @param simulatorService service simulateur
   */
  constructor(
    private element: ElementRef<HTMLElement>,
    private simulatorService: SimulatorService,
    private ngZone: NgZone,
  ) {
    simulatorService.dateStop.subscribe((value) => {
      if (value !== undefined) {
        this.stopRealValue = findRealValue(value)
        this.stopRealValueShort = findRealValueCustom(value, false, true)
        this.dateStop = value
        this.labels = getRangeOfMonths(new Date(this.dateStart), new Date(this.dateStop))
      }
    })
    simulatorService.dateStart.subscribe((value) => {
      this.startRealValue = findRealValue(value)
      this.startRealValueShort = findRealValueCustom(value, false, true)
      this.dateStart = value
      if (this.dateStop !== null) {
        this.labels = getRangeOfMonths(new Date(this.dateStart), new Date(this.dateStop))
      }
    })
    simulatorService.situationSimulated.subscribe((value) => {
      console.log(this.labels, value)
      if (this.labels !== null) {
        this.data.simulatedMag.values = simulatorService.generateLinearData(value?.etpMag as number, value?.etpMag as number, this.labels.length)
        this.data.simulatedGref.values = simulatorService.generateLinearData(value?.etpFon as number, value?.etpFon as number, this.labels.length)
        this.data.simulatedCont.values = simulatorService.generateLinearData(value?.etpCont as number, value?.etpCont as number, this.labels.length)

        let monthlyMagValues: any = undefined
        let monthlyContValues: any = undefined
        let monthlyFonValues: any = undefined

        console.log(simulatorService.situationProjected.getValue())

        if (simulatorService.situationProjected.getValue()!.monthlyReport !== undefined) {
          simulatorService.situationProjected.getValue()!.monthlyReport!.forEach((x: any) => {
            if (x.name === 'Magistrat') monthlyMagValues = x.values
            if (x.name === 'Greffe') monthlyFonValues = x.values
            if (x.name === 'Autour du magistrat') monthlyContValues = x.values
          })

          this.data.projectedMag.values = new Array()
          this.data.projectedGref.values = new Array()
          this.data.projectedCont.values = new Array()

          Object.keys(monthlyMagValues).forEach((x: any) => {
            this.data.projectedMag.values.push(monthlyMagValues[x].etpt)
            this.data.projectedGref.values.push(monthlyFonValues[x].etpt)
            this.data.projectedCont.values.push(monthlyContValues[x].etpt)
          })
        } else {
          this.data.projectedMag.values = simulatorService.generateLinearData(
            simulatorService.situationProjected.getValue()?.etpMag as number,
            simulatorService.situationProjected.getValue()?.etpMag as number,
            this.labels.length,
          )
          this.data.projectedGref.values = simulatorService.generateLinearData(
            simulatorService.situationProjected.getValue()?.etpFon as number,
            simulatorService.situationProjected.getValue()?.etpFon as number,
            this.labels.length,
          )
        }

        console.log(this.data.projectedMag)
        if (this.myChart !== null) {
          this.myChart.config.data.labels = this.labels
          if (this.canViewMagistrat) {
            this.myChart._metasets[0]._dataset.data = this.data.projectedMag.values
            this.myChart._metasets[1]._dataset.data = this.data.simulatedMag.values
          }
          if (this.canViewGreffier) {
            this.myChart._metasets[2]._dataset.data = this.data.projectedGref.values
            this.myChart._metasets[3]._dataset.data = this.data.simulatedGref.values
          }
          if (this.canViewContractuel) {
            this.myChart._metasets[5]._dataset.data = this.data.projectedCont.values
            //this.myChart._metasets[6]._dataset.data =
            //this.data.simulatedCont.values
          }

          // A remplacer
          /**
          const isDataShown = this.myChart.isDatasetVisible(
            this.categorySelected === 'MAGISTRAT' ? 3 : 1
          )
          if (isDataShown === true) {
            if (this.categorySelected === 'MAGISTRAT') {
              this.myChart.hide(3)
            } else this.myChart.hide(1)
          }
 */
          if (this.categorySelected === 'MAGISTRAT') {
            this.myChart.hide(3)
          }
          if (this.categorySelected === 'GREFFE') {
            this.myChart.hide(1)
          }

          if (!this.canViewMagistrat) {
            this.myChart.hide(0)
            this.myChart.hide(1)
          }
          if (!this.canViewGreffier) {
            this.myChart.hide(2)
            this.myChart.hide(3)
          }
          if (!this.canViewContractuel) {
            this.myChart.hide(4)
            this.myChart.hide(5)
          }

          //this.myChart.hide(4)
          this.myChart.hide(5)
          this.myChart.update()
        }
      }
    })

    this.elementRef = element.nativeElement
    Chart.register(...registerables)
    Chart.register(annotationPlugin)
  }

  /**
   * Génération du graphique après l'initialisation du composant
   */
  ngAfterViewInit(): void {
    const labels = this.labels

    console.log('load Chart ETP')

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
        ctx.fillText('ETPT', -1, top - 2)
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
        case 'projectedMag':
          sufix = 'magistrats (projeté)'
          break
        case 'simulatedMag':
          sufix = 'magistrats (simulé)'
          break
        case 'projectedGref':
          sufix = 'agents de greffe (projeté)'
          break
        case 'simulatedGref':
          sufix = 'agents de greffe (simulé)'
          break
        case 'projectedCont':
          sufix = 'contractuels (projeté)'
          break
        case 'simulatedCont':
          sufix = 'contractuels (simulé)'
          break
      }
      let lbl = '  ' + fixDecimal(localeParseFloat(context.formattedValue.replace(/\s/g, ''))) + ' ' + sufix
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
          const projectedMag = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'projectedMag'
          })
          const simulatedMag = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'simulatedMag'
          })
          const projectedFon = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'projectedFon'
          })
          const simulatedFon = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'simulatedFon'
          })
          const projectedCont = e.chart.config._config.data.datasets.find((x: any) => {
            return x.label === 'projectedCont'
          })

          const tooltipEl = $this.myChart.canvas.parentNode.querySelector('#chartjs-tooltip')
          const tooltipElTriangle = $this.myChart.canvas.parentNode.querySelector('#chartjs-tooltip-triangle')

          const yValues = items.map((object: any) => {
            return object.element.y
          })

          const min = Math.min(...yValues)
          tooltipEl.style.opacity = 1

          tooltipEl.style.left = (items[0].element.x > 175 ? items[0].element.x : 175) + 'px'
          tooltipEl.style.top = min - 162 + 'px'

          tooltipElTriangle.style.opacity = 1
          tooltipElTriangle.style.left = items[0].element.x + 8 + 'px'
          tooltipElTriangle.style.top = min + 'px'

          $this.affectTooltipValues({
            projectedMag: projectedMag.data[firstPoint],
            simulatedMag: simulatedMag.data[firstPoint],
            //projectedFon: projectedFon.data[firstPoint],
            //simulatedFon: simulatedFon.data[firstPoint],
            projectedCont: projectedCont.data[firstPoint],
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
          padding: { top: 20, left: 30, right: 20 },
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
            padding: -3,
            beginAtZero: true,
            type: 'linear',
            position: 'left',
            ticks: {
              display: true,
              min: 0,
              max: 100,
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
      plugins: [yScaleTextStock],
    }

    this.ngZone.runOutsideAngular(() => {
      this.myChart = new Chart(document.getElementById('etp-chart') as ChartItem, config)
    })

    this.simulatorService.chartAnnotationBox.subscribe((value) => {
      if (this.myChart !== null) {
        this.myChart.options.plugins.annotation.annotations.box1.yMax = this.myChart.scales.A.max
        this.myChart.options.plugins.annotation.annotations.box1.display = value.display
        this.myChart.options.plugins.annotation.annotations.box1.xMin = value.xMin
        this.myChart.options.plugins.annotation.annotations.box1.xMax = value.xMax
        this.myChart.options.plugins.annotation.annotations.box1.content = value.content

        this.myChart.options.plugins.tooltip.enabled = value.enableTooltip

        this.tooltip.projectedMag = value.projectedMag
        this.tooltip.simulatedMag = value.simulatedMag

        this.tooltip.projectedFon = value.projectedFon
        this.tooltip.simulatedFon = value.simulatedFon

        this.tooltip.projectedCont = value.projectedCont
        this.tooltip.simulatedCont = value.simulatedCont

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
          tooltipElTriangle.style.top = Number(String(higuerYPosition - 130 + 'px').replace('px', '')) + 160 + 'px'

          this.tooltip.projectedMag = this.myChart.data.datasets[0].data[value.pointIndex as number]
          this.tooltip.simulatedMag = this.myChart.data.datasets[1].data[value.pointIndex as number]

          this.tooltip.projectedFon = this.myChart.data.datasets[2].data[value.pointIndex as number]
          this.tooltip.simulatedFon = this.myChart.data.datasets[3].data[value.pointIndex as number]

          this.tooltip.projectedCont = this.myChart.data.datasets[4].data[value.pointIndex as number]

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
          tooltipEl.style.opacity = 0
          tooltipElTriangle.style.opacity = 0

          for (let i = 0; i < this.myChart.data.datasets[0].data.length; i++) {
            colorArray.push('rgb(109, 109, 109)')
          }
          this.myChart.config.options.scales.x.ticks.color = colorArray
        }
        this.myChart.update()
        this.ngZone.run(() => {
          this.myChart.update()
        })
      }
    })
  }

  /**
   * Affichage d'une courbe sur le graphique
   * @param event évenement de click sur le toogle bouton en légende
   */
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

  /**
   * Synchronisation du tooltip
   * @param obj element détaillant le tooltip selectionné
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
        values: [0],
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
