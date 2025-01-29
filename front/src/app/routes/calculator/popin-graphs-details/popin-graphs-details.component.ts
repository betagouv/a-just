import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  Input,
  ViewChild,
} from '@angular/core';
import { MainClass } from '../../../libs/main-class';
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel';
import { OPACITY_20 } from '../../../constants/colors';
import { UserService } from '../../../services/user/user.service';
import { PopupComponent } from '../../../components/popup/popup.component';
import { HumanResourceService } from '../../../services/human-resource/human-resource.service';
import { CalculatorService } from '../../../services/calculator/calculator.service';
import { Chart, ChartItem } from 'chart.js/auto';
import { maxBy, minBy } from 'lodash';
import { today } from '../../../utils/dates';

/**
 * Composant de la popin qui affiche en gros les détails les données d'une comparaison
 */

@Component({
  standalone: true,
  imports: [CommonModule, PopupComponent],
  selector: 'aj-popin-graphs-details',
  templateUrl: './popin-graphs-details.component.html',
  styleUrls: ['./popin-graphs-details.component.scss'],
})
export class PopinGraphsDetailsComponent
  extends MainClass
  implements AfterViewInit
{
  userService = inject(UserService);
  humanResourceService = inject(HumanResourceService);
  calculatorService = inject(CalculatorService);
  /**
   * Canvas html dom
   */
  @ViewChild('canvas') canvas: ElementRef<HTMLElement> | null = null;
  /**
   * Comparaison de la popin
   */
  @Input() compareAtString: string = '';
  /**
   * Date de début de comparaison
   */
  @Input() dateStart: Date | null = null;
  /**
   * Date de fin de comparaison
   */
  @Input() dateStop: Date | null = null;
  /**
   * Date de début comparaison
   */
  @Input() optionDateStart: Date | null = null;
  /**
   * Date de fin de comparaison
   */
  @Input() optionDateStop: Date | null = null;
  /**
   * Opacité background des contentieux
   */
  OPACITY = OPACITY_20;
  /**
   * Object Chart.js
   */
  myChart: any = null;

  /**
   * Constructor
   */
  constructor() {
    super();
  }

  ngAfterViewInit() {
    this.onLoadDatas();
  }

  selectReferentiel(ref: ContentieuReferentielInterface) {
    this.calculatorService.selectedRefGraphDetail = ref.id;
    this.onLoadDatas();
  }

  async onLoadDatas() {
    /*console.log(
      this.dateStart,
      this.dateStop,
      this.calculatorService.selectedRefGraphDetail,
      this.calculatorService.showGraphDetailType,
      this.optionDateStart,
      this.optionDateStop
    );*/

    let firstValues: { value: number | null; date: Date }[] = [];
    let secondValues: { value: number | null; date: Date }[] = [];

    if (
      this.calculatorService.selectedRefGraphDetail &&
      this.calculatorService.showGraphDetailType
    ) {
      firstValues = (
        await this.calculatorService.rangeValues(
          +this.calculatorService.selectedRefGraphDetail,
          this.calculatorService.showGraphDetailType
        )
      ).filter((v: any) => v);

      secondValues = (
        await this.calculatorService.rangeValues(
          +this.calculatorService.selectedRefGraphDetail,
          this.calculatorService.showGraphDetailType,
          this.optionDateStart,
          this.optionDateStop
        )
      ).filter((v: any) => v);
    }

    console.log(firstValues, secondValues);

    if (!this.myChart && this.canvas) {
      const data = {
        labels: [],
        datasets: [],
      };

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
      };
      this.myChart = new Chart(this.canvas.nativeElement as ChartItem, config);
    }

    const mergeTab: { value: number | null; date: Date }[] = [
      ...firstValues.filter((v) => v && v.value !== null),
      ...secondValues.filter((v) => v && v.value !== null),
    ];
    const mergeTabDate: Date[] = mergeTab.map((v) => this.getMonth(v.date));
    const mergeTabValues: number[] = mergeTab.map((v) => +(v.value || 0));
    // get min max
    let min = Math.min(...mergeTabValues);
    let max = Math.max(...mergeTabValues);
    if (min) {
      min *= 0.8;
      if (min < 10) {
        min = 0;
      }
    }
    if (max) {
      max *= 1.2;
    }

    const getOrCreateTooltip = (chart: any) => {
      let tooltipEl = chart.canvas.parentNode.querySelector('div');

      if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.style.background = '#FFF';
        tooltipEl.style.borderRadius = '4px';
        tooltipEl.style.padding = '4px 8px 0 8px';
        tooltipEl.style.boxShadow = '0px 2px 6px 0px rgba(0, 0, 18, 0.16)';
        tooltipEl.style.color = '#000';
        tooltipEl.style.opacity = 1;
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.marginTop = '14px';
        tooltipEl.style.transform = 'translate(-50%, 0)';
        tooltipEl.style.transition = 'all .1s ease';

        const divInside = document.createElement('div');
        divInside.className = 'inner-tooltip';
        tooltipEl.appendChild(divInside);

        chart.canvas.parentNode.appendChild(tooltipEl);
      }

      return tooltipEl;
    };

    const externalTooltipHandler = (context: any) => {
      // Tooltip Element
      const { chart, tooltip } = context;
      const tooltipEl = getOrCreateTooltip(chart);

      // Hide if no tooltip
      if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
      }

      // Set Text
      if (tooltip.body) {
        const title = document.createElement('p');
        title.innerHTML =
          this.calculatorService.showGraphDetailTypeLineTitle || '';
        title.style.paddingBottom = '4px';
        title.style.marginBottom = '4px';
        title.style.fontSize = '12px';
        title.style.borderBottom = '1px solid #DDD';

        const divInside = tooltipEl.querySelector('.inner-tooltip');
        divInside.style.position = 'relative';
        divInside.style.top = '2px';
        // Remove old children
        while (divInside.firstChild) {
          divInside.firstChild.remove();
        }

        divInside.appendChild(title);

        tooltip.body.forEach((body: any, i: number) => {
          let style = 'grey';
          if (tooltip.labelColors[i].borderColor === '#6A6AF4') {
            style = 'blue';
          } else if (tooltip.labelColors[i].borderColor === '#E4794A') {
            style = 'red';
          }

          const bodyContainer = document.createElement('div');
          bodyContainer.style.display = 'flex';
          bodyContainer.style.justifyContent = 'space-between';
          bodyContainer.style.alignItems = 'center';
          bodyContainer.style.lineHeight = '20px';
          bodyContainer.style.height = '20px';
          bodyContainer.style.marginBottom = '4px';
          bodyContainer.style.gap = '4px';

          const imageLine = document.createElement('img');
          imageLine.src =
            style === 'blue'
              ? '/assets/icons/point-graph-blue.svg'
              : style === 'red'
              ? '/assets/icons/point-graph-red.svg'
              : '/assets/icons/point-graph-grey.svg';

          const bodyLine = document.createElement('p');
          bodyLine.style.margin = '0';
          bodyLine.style.padding = '0';
          bodyLine.style.color = '#000';
          bodyLine.style.fontSize = '12px';
          bodyLine.innerHTML = body.lines[0];

          const dateLine = document.createElement('p');
          dateLine.style.margin = '0';
          dateLine.style.padding = '0';
          dateLine.style.color = '#666';
          dateLine.style.fontSize = '12px';
          dateLine.innerHTML = tooltip.title[0];

          bodyContainer.appendChild(imageLine);
          bodyContainer.appendChild(bodyLine);
          bodyContainer.appendChild(dateLine);
          divInside.appendChild(bodyContainer);
        });
      }

      const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

      // Display, position, and set styles for font
      tooltipEl.style.opacity = 1;
      tooltipEl.style.left = positionX + tooltip.caretX + 'px';
      tooltipEl.style.top = positionY + tooltip.caretY + 'px';
      tooltipEl.style.font = tooltip.options.bodyFont.string;
      tooltipEl.style.padding =
        tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
    };

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
            fontSize: 12,
            color: 'rgba(0, 0, 0, 0.70)',
          },
        },
        x: {
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            fontSize: 12,
            color: 'rgba(0, 0, 0, 0.70)',
            callback: function (value: any, index: any, ticks: any) {
              /*now.getMonth() === 0 || now.getMonth() === 11
            ? [this.getShortMonthString(now), (now.getFullYear() + '').slice(2)]
            : this.getShortMonthString(now)
        */
              console.log(value, index, ticks);
              return value;
            },
          },
        },
      },
    };
    this.myChart.config.options = options;
    const labels = [];

    const defaultDataset = {
      cubicInterpolationMode: 'monotone',
      tension: 0.4,
      fill: false,
      pointStyle: 'circle',
      pointRadius: 9,
      pointHoverRadius: 11,
      borderWidth: 2,
      hoverBorderWidth: 2,
      backgroundColor: 'rgb(255, 255, 255)',
    };

    const datasets: {
      data: number[];
      borderColor: string;
      cubicInterpolationMode: string;
      tension: number;
      fill: boolean;
      pointStyle: string;
      pointRadius: number;
      pointHoverRadius: number;
    }[] = [
      {
        // datas before
        ...defaultDataset,
        data: [],
        borderColor: '#6A6AF4',
      },
      {
        // datas in the middle
        ...defaultDataset,
        data: [],
        borderColor: '#929292',
      },
      {
        // datas to compare
        ...defaultDataset,
        data: [],
        borderColor: '#E4794A',
      },
    ];

    const configurationsDates = [
      this.dateStart,
      this.dateStop,
      this.optionDateStart,
      this.optionDateStop,
    ];
    const getFirstDate = minBy(configurationsDates, function (o) {
      o = today(o);
      return o.getTime();
    });
    const getLastDate = maxBy(configurationsDates, function (o) {
      o = today(o);
      return o.getTime();
    });
    if (getFirstDate && getLastDate) {
      const now = this.getMonth(getFirstDate);
      do {
        labels.push(new Date(now));

        const value = firstValues.find(
          (v) => this.getMonth(v.date).getTime() === now.getTime()
        );
        if (value) {
          datasets[0].data.push(value.value || 0);
        } else {
          datasets[0].data.push(NaN);
        }

        const value2 = secondValues.find(
          (v) => this.getMonth(v.date).getTime() === now.getTime()
        );
        if (value2) {
          datasets[2].data.push(value2.value || 0);
        } else {
          datasets[2].data.push(NaN);
        }

        now.setMonth(now.getMonth() + 1);
      } while (now.getTime() < getLastDate.getTime());
    }

    console.log({
      labels,
      datasets,
    });
    this.myChart.config.data = {
      labels,
      datasets,
    };
    this.myChart.update();
  }
}
