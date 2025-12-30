import { CommonModule } from '@angular/common'
import { AfterViewInit, Component, ElementRef, inject, Input, ViewChild } from '@angular/core'
import { MainClass } from '../../../libs/main-class'
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel'
import { OPACITY_20 } from '../../../constants/colors'
import { UserService } from '../../../services/user/user.service'
import { PopupComponent } from '../../../components/popup/popup.component'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { CalculatorService } from '../../../services/calculator/calculator.service'
import { Chart, ChartItem } from 'chart.js/auto'
import { findLastIndex, maxBy, minBy } from 'lodash'
import { today } from '../../../utils/dates'
import { KPIService } from '../../../services/kpi/kpi.service'
import { CALCULATOR_OPEN_POPIN_GRAPH_DETAILS, CALCULATOR_OPEN_POPIN_GRAPH_DETAILS_ALONE } from '../../../constants/log-codes'
import { fixDecimal } from '../../../utils/numbers'
import { AppService } from '../../../services/app/app.service'
import { RouterModule } from '@angular/router'

/**
 * Composant de la popin qui affiche en gros les détails les données d'une comparaison
 */

@Component({
  standalone: true,
  imports: [CommonModule, PopupComponent, RouterModule],
  selector: 'aj-popin-graphs-details',
  templateUrl: './popin-graphs-details.component.html',
  styleUrls: ['./popin-graphs-details.component.scss'],
})
export class PopinGraphsDetailsComponent extends MainClass implements AfterViewInit {
  userService = inject(UserService)
  humanResourceService = inject(HumanResourceService)
  calculatorService = inject(CalculatorService)
  kpiService = inject(KPIService)
  appService = inject(AppService)
  /**
   * Canvas html dom
   */
  @ViewChild('canvas') canvas: ElementRef<HTMLElement> | null = null
  /**
   * Comparaison de la popin
   */
  @Input() compareAtString: string = ''
  /**
   * Date de début de comparaison
   */
  @Input() dateStart: Date | null = null
  /**
   * Date de fin de comparaison
   */
  @Input() dateStop: Date | null = null
  /**
   * Date de début comparaison
   */
  @Input() optionDateStart: Date | null = null
  /**
   * Date de fin de comparaison
   */
  @Input() optionDateStop: Date | null = null
  /**
   * Opacité background des contentieux
   */
  OPACITY = OPACITY_20
  /**
   * Object Chart.js
   */
  myChart: any = null
  /**
   * All labels
   */
  allLabels: Date[] = []
  /**
   * All values
   */
  allValues: { first: number | null; second: number | null }[] = []
  /**
   * Show hide error
   */
  showError = false
  /**
   * Have missing datas
   */
  haveMissingDatas = false
  /**
   * Referentiel selected
   */
  ref: ContentieuReferentielInterface | null = null
  /**
   * Constructor
   */
  constructor() {
    super()
  }

  ngAfterViewInit() {
    this.onLoadDatas()
  }

  selectReferentiel(ref: ContentieuReferentielInterface) {
    this.calculatorService.selectedRefGraphDetail = ref.id
    this.onLoadDatas()
  }

  async onLoadDatas() {
    this.ref = null
    this.appService.appLoading.next(true)
    if (this.calculatorService.selectedRefGraphDetail) {
      this.ref = this.humanResourceService.contentieuxReferentiel.getValue().find((c) => c.id === this.calculatorService.selectedRefGraphDetail) || null
      if (this.ref) {
        this.kpiService.register(
          this.optionDateStart ? CALCULATOR_OPEN_POPIN_GRAPH_DETAILS : CALCULATOR_OPEN_POPIN_GRAPH_DETAILS_ALONE,
          this.calculatorService.showGraphDetailType + ' - ' + this.ref.label,
        )
      }
    }
    /*console.log(
      this.dateStart,
      this.dateStop,
      this.calculatorService.selectedRefGraphDetail,
      this.calculatorService.showGraphDetailType,
      this.optionDateStart,
      this.optionDateStop
    );*/

    /**
     * clean datas
     */
    if (!this.optionDateStart) {
      this.optionDateStop = null
    }

    let firstValues: { value: number | null; date: Date }[] = []
    let secondValues: { value: number | null; date: Date }[] | null = null
    let middleValues: { value: number | null; date: Date }[] | null = null

    if (this.calculatorService.selectedRefGraphDetail && this.calculatorService.showGraphDetailType) {
      firstValues = (
        await this.calculatorService.rangeValues(+this.calculatorService.selectedRefGraphDetail, this.calculatorService.showGraphDetailType)
      ).filter((v: any) => v)

      if (this.optionDateStart) {
        secondValues = (
          await this.calculatorService.rangeValues(
            +this.calculatorService.selectedRefGraphDetail,
            this.calculatorService.showGraphDetailType,
            this.optionDateStart,
            this.optionDateStop,
          )
        ).filter((v: any) => v)

        if (
          this.calculatorService.dateStop.getValue() &&
          this.optionDateStart &&
          this.getMonth(this.calculatorService.dateStop.getValue()).getTime() < this.getMonth(this.optionDateStart).getTime()
        ) {
          middleValues = (
            await this.calculatorService.rangeValues(
              +this.calculatorService.selectedRefGraphDetail,
              this.calculatorService.showGraphDetailType,
              this.getMonth(this.calculatorService.dateStop.getValue()),
              this.getMonth(this.optionDateStart),
            )
          ).filter((v: any) => v)
        }

        if (
          this.optionDateStop &&
          this.calculatorService.dateStart.getValue() &&
          this.getMonth(this.optionDateStop).getTime() < this.getMonth(this.calculatorService.dateStart.getValue()).getTime()
        ) {
          middleValues = (
            await this.calculatorService.rangeValues(
              +this.calculatorService.selectedRefGraphDetail,
              this.calculatorService.showGraphDetailType,
              this.getMonth(this.optionDateStop),
              this.getMonth(this.calculatorService.dateStart.getValue()),
            )
          ).filter((v: any) => v)
        }
      }
    }

    if (firstValues.find((v) => v.value === null) || (secondValues && secondValues.find((v) => v.value === null))) {
      this.haveMissingDatas = true
    } else {
      this.haveMissingDatas = false
    }

    if (!this.myChart && this.canvas) {
      const data = {
        labels: [],
        datasets: [],
      }

      const backgroundChartArea = {
        id: 'backgroundChartArea',
        beforeDatasetsDraw: (chart: any, args: any, options: any) => {
          const {
            ctx,
            chartArea: { top, left, right, height },
          } = chart

          if (this.allValues.length) {
            const widthOneItem = (right - left) / this.allValues.length

            // check initials values
            const firstIndexOfFirstValues = this.allValues.findIndex((a) => a.first !== null)
            const firstIndexOfLastValues = findLastIndex(this.allValues, (a) => a.first !== null)

            if (firstIndexOfFirstValues !== -1 && firstIndexOfLastValues !== -1) {
              ctx.fillStyle =
                secondValues === null
                  ? this.userService.referentielMappingColorByInterface(this.ref?.label || '', OPACITY_20 * 1.001)
                  : 'rgba(106, 106, 244, 0.2)' // 1.001 pour avoir la transparence car sinon si je mes juste OPACITY_20, il n'y a pas de transparence
              ctx.fillRect(left + firstIndexOfFirstValues * widthOneItem, top, (firstIndexOfLastValues - firstIndexOfFirstValues + 1) * widthOneItem, height)
            }

            // check compare values
            const secondIndexOfFirstValues = this.allValues.findIndex((a) => a.second !== null)
            const secondIndexOfLastValues = findLastIndex(this.allValues, (a) => a.second !== null)

            if (secondIndexOfFirstValues !== -1 && secondIndexOfLastValues !== -1) {
              ctx.fillStyle = 'rgba(228, 121, 74, 0.2)'
              ctx.fillRect(left + secondIndexOfFirstValues * widthOneItem, top, (secondIndexOfLastValues - secondIndexOfFirstValues + 1) * widthOneItem, height)
            }
          }
        },
      }

      const config: any = {
        type: 'line',
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: false,
            title: false,
          },
        },
        plugins: [backgroundChartArea],
      }
      this.myChart = new Chart(this.canvas.nativeElement as ChartItem, config)
    }

    const mergeTab: { value: number | null; date: Date }[] = [
      ...firstValues.filter((v) => v && v.value !== null),
      ...(secondValues ? secondValues.filter((v) => v && v.value !== null) : []),
      ...(middleValues ? middleValues.filter((v) => v && v.value !== null) : []),
    ]
    const mergeTabValues: number[] = mergeTab.map((v) => +(v.value || 0))

    // get min max
    let min = Math.min(...mergeTabValues)
    let max = Math.max(...mergeTabValues) || 0
    if (min) {
      min *= 0.7
      if (min < 10) {
        min = 0
      }
    }
    this.showError = mergeTab.filter((v) => v && v.value !== null).length === 0 ? true : false
    if (max) {
      max = max * 1.1
    }
    if (max === 0) {
      max = 1
    }

    const getOrCreateTooltip = (chart: any) => {
      let tooltipEl = chart.canvas.parentNode.querySelector('div')

      if (!tooltipEl) {
        tooltipEl = document.createElement('div')
        tooltipEl.style.background = '#FFF'
        tooltipEl.style.borderRadius = '4px'
        tooltipEl.style.padding = '4px 8px 0 8px'
        tooltipEl.style.boxShadow = '0px 2px 6px 0px rgba(0, 0, 18, 0.16)'
        tooltipEl.style.color = '#000'
        tooltipEl.style.opacity = 1
        tooltipEl.style.position = 'absolute'
        tooltipEl.style.marginTop = '14px'
        tooltipEl.style.transform = 'translate(-50%, 0)'
        tooltipEl.style.transition = 'all .1s ease'

        const divInside = document.createElement('div')
        divInside.className = 'inner-tooltip'
        tooltipEl.appendChild(divInside)

        chart.canvas.parentNode.appendChild(tooltipEl)
      }

      return tooltipEl
    }

    const externalTooltipHandler = (context: any) => {
      // Tooltip Element
      const { chart, tooltip } = context
      const tooltipEl = getOrCreateTooltip(chart)

      // Hide if no tooltip
      if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0
        return
      }

      // Set Text
      if (tooltip.body) {
        const title = document.createElement('p')
        title.innerHTML = this.calculatorService.showGraphDetailTypeLineTitle || ''
        title.style.paddingBottom = '4px'
        title.style.marginBottom = '4px'
        title.style.fontSize = '12px'
        title.style.borderBottom = '1px solid #DDD'

        const divInside = tooltipEl.querySelector('.inner-tooltip')
        divInside.style.position = 'relative'
        divInside.style.top = '2px'
        // Remove old children
        while (divInside.firstChild) {
          divInside.firstChild.remove()
        }

        divInside.appendChild(title)

        tooltip.body.forEach((body: any, i: number) => {
          let style = 'grey'
          if (tooltip.labelColors[i].borderColor === '#6A6AF4') {
            style = 'blue'
          } else if (tooltip.labelColors[i].borderColor === '#E4794A') {
            style = 'red'
          }

          let byPass = false
          if (style === 'grey' && tooltip.body.length > 1) {
            byPass = true
          }

          if (!byPass) {
            const bodyContainer = document.createElement('div')
            bodyContainer.style.display = 'flex'
            bodyContainer.style.justifyContent = 'space-between'
            bodyContainer.style.alignItems = 'center'
            bodyContainer.style.paddingTop = '2px'
            bodyContainer.style.paddingBottom = '2px'
            bodyContainer.style.minHeight = '20px'
            bodyContainer.style.marginBottom = '4px'
            bodyContainer.style.gap = '4px'

            const imageLine = document.createElement('img')
            imageLine.src =
              style === 'blue'
                ? '/assets/icons/point-graph-blue.svg'
                : style === 'red'
                  ? '/assets/icons/point-graph-red.svg'
                  : '/assets/icons/point-graph-grey.svg'

            const bodyLine = document.createElement('p')
            bodyLine.style.margin = '0'
            bodyLine.style.padding = '0'
            bodyLine.style.color = '#000'
            bodyLine.style.fontSize = '12px'
            if (this.calculatorService.showGraphDetailTypeLineTitle === 'Temps moyen') {
              bodyLine.innerHTML = this.decimalToStringDate(body.lines[0])
            } else if (this.calculatorService.showGraphDetailTypeLineTitle === 'Taux de couverture') {
              body.lines[0] = body.lines[0].replace(',', '.').replace(/\s/g, '')
              body.lines[0] = parseInt(body.lines[0])
              bodyLine.innerHTML = body.lines[0] + '%'
            } else if (this.calculatorService.showGraphDetailTypeLineTitle === 'Stock') {
              bodyLine.innerHTML = '' + fixDecimal(Number(body.lines[0].replace(/\s/g, '').replace(',', '.')), 1)
            } else if (
              this.calculatorService.showGraphDetailTypeLineTitle === 'ETPT Siège' ||
              this.calculatorService.showGraphDetailTypeLineTitle === 'ETPT Greffe' ||
              this.calculatorService.showGraphDetailTypeLineTitle === 'ETPT EAM'
            ) {
              const cleanValue = body.lines[0].replace(/\s/g, '').replace(',', '.')
              bodyLine.innerHTML = '' + fixDecimal(cleanValue, 100)
            } else {
              bodyLine.innerHTML = body.lines[0]
            }

            bodyContainer.appendChild(imageLine)
            bodyContainer.appendChild(bodyLine)

            if (tooltip.dataPoints[i].dataIndex < this.allLabels.length) {
              const month = this.allLabels[tooltip.dataPoints[i].dataIndex]
              const dateLine = document.createElement('p')
              dateLine.style.margin = '0'
              dateLine.style.padding = '0'
              dateLine.style.color = '#666'
              dateLine.style.fontSize = '12px'
              dateLine.innerHTML = this.getMonthString(month) + ' ' + month.getFullYear()
              bodyContainer.appendChild(dateLine)
            }

            divInside.appendChild(bodyContainer)
          }
        })
      }

      const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas

      // Display, position, and set styles for font
      tooltipEl.style.opacity = 1
      tooltipEl.style.left = positionX + tooltip.caretX + 'px'
      tooltipEl.style.top = positionY + tooltip.caretY + 'px'
      tooltipEl.style.font = tooltip.options.bodyFont.string
      tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px'
    }

    const options: any = {
      interaction: {
        mode: 'index',
        intersect: false,
      },
      responsive: true,
      plugins: {
        legend: false,
        title: false,
        tooltip: {
          enabled: false,
          position: 'nearest',
          external: externalTooltipHandler,
        },
      },
      scales: {
        y: {
          min,
          max,
          ticks: {
            stepSize: (max - min) / 5,
            fontSize: 12,
            color: 'rgba(0, 0, 0, 0.70)',
            callback: (value: any, index: number, values: any[]): any => {
              if (index === 0 || index === values.length - 1) {
                return ''
              }

              if (
                this.calculatorService.showGraphDetailTypeLineTitle === 'DTES' ||
                this.calculatorService.showGraphDetailTypeLineTitle === 'Entrées' ||
                this.calculatorService.showGraphDetailTypeLineTitle === 'Sorties'
              ) {
                return fixDecimal(value, 10)
              }

              if (
                this.calculatorService.showGraphDetailTypeLineTitle === 'ETPT Siège' ||
                this.calculatorService.showGraphDetailTypeLineTitle === 'ETPT Greffe' ||
                this.calculatorService.showGraphDetailTypeLineTitle === 'ETPT EAM'
              ) {
                return fixDecimal(value, 100)
              }

              if (this.calculatorService.showGraphDetailTypeLineTitle === 'Temps moyen') {
                return this.decimalToStringDate(value)
              }

              if (this.calculatorService.showGraphDetailTypeLineTitle === 'Taux de couverture') {
                return Math.round(value) + '%'
              }

              if (this.calculatorService.showGraphDetailTypeLineTitle === 'Stock' && fixDecimal(value, 1) !== 1 && fixDecimal(value, 1) !== 0) {
                return fixDecimal(value, 10)
              }

              return value
            },
          },
        },
        x: {
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            fontSize: 12,
            color: 'rgba(0, 0, 0, 0.70)',
          },
        },
      },
    }
    this.myChart.config.options = options
    const labels = []

    const defaultDataset = {
      cubicInterpolationMode: 'default',
      tension: 0.4,
      fill: false,
      pointStyle: 'circle',
      pointRadius: 9,
      pointHoverRadius: 11,
      borderWidth: 2,
      hoverBorderWidth: 2,
      backgroundColor: 'rgb(255, 255, 255)',
    }

    const datasets: {
      data: number[]
      borderColor: string
      cubicInterpolationMode: string
      tension: number
      fill: boolean
      pointStyle: string
      pointRadius: number
      pointHoverRadius: number
    }[] = [
      {
        // datas before
        ...defaultDataset,
        data: [],
        borderColor: secondValues === null ? this.userService.referentielMappingColorByInterface(this.ref?.label || '') : '#6A6AF4',
      },
    ]

    if (secondValues !== null) {
      datasets.push({
        // datas to compare
        ...defaultDataset,
        data: [],
        borderColor: '#E4794A',
      })
    }

    if (middleValues !== null) {
      datasets.push({
        // datas in the middle
        ...defaultDataset,
        data: [],
        borderColor: '#929292',
      })
    }

    const configurationsDates = [this.dateStart, this.dateStop]
    if (this.optionDateStart) {
      configurationsDates.push(this.optionDateStart)
    }
    if (this.optionDateStop) {
      configurationsDates.push(this.optionDateStop)
    }
    console.log('configurationsDates', configurationsDates)
    const getFirstDate = minBy(configurationsDates, function (o) {
      o = today(o)
      return o.getTime()
    })
    const getLastDate = maxBy(configurationsDates, function (o) {
      o = today(o)
      return o.getTime()
    })
    if (getFirstDate && getLastDate) {
      const now = this.getMonth(getFirstDate)
      this.allLabels = []
      this.allValues = []
      do {
        this.allValues.push({ first: null, second: null })
        labels.push(
          now.getMonth() === 0 || now.getMonth() === 11 ? [this.getShortMonthString(now), (now.getFullYear() + '').slice(2)] : this.getShortMonthString(now),
        )
        this.allLabels.push(new Date(now))

        const value = firstValues.find((v) => this.getMonth(v.date).getTime() === now.getTime())
        if (value && value.value !== null) {
          this.allValues[this.allValues.length - 1].first = value.value || 0
          datasets[0].data.push(value.value || 0)
        } else {
          datasets[0].data.push(NaN)
        }

        if (secondValues !== null) {
          const value2 = secondValues.find((v) => this.getMonth(v.date).getTime() === now.getTime())
          if (value2 && value2.value !== null) {
            this.allValues[this.allValues.length - 1].second = value2.value || 0
            datasets[1].data.push(value2.value || 0)
          } else {
            datasets[1].data.push(NaN)
          }
        }

        if (middleValues !== null) {
          const value1 = middleValues.find((v) => this.getMonth(v.date).getTime() === now.getTime())
          if (value1 && value1.value !== null) {
            datasets[2].data.push(value1.value || 0)
          } else {
            datasets[2].data.push(NaN)
          }
        }

        now.setMonth(now.getMonth() + 1)
      } while (now.getTime() < getLastDate.getTime())
    }

    /*console.log({
      labels,
      datasets,
    });*/
    this.myChart.config.data = {
      labels,
      datasets,
    }
    this.myChart.update()
    this.appService.appLoading.next(false)
  }
}
