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
    console.log(
      this.dateStart,
      this.dateStop,
      this.calculatorService.selectedRefGraphDetail,
      this.calculatorService.showGraphDetailType,
      this.optionDateStart,
      this.optionDateStop
    );

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
      console.log(this.canvas.nativeElement);
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

    console.log(this.myChart, min, max);

    const getOrCreateTooltip = (chart: any) => {
      let tooltipEl = chart.canvas.parentNode.querySelector('div');

      if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.style.background = '#FFF';
        tooltipEl.style.borderRadius = '4px';
        tooltipEl.style.boxShadow = '0px 2px 6px 0px rgba(0, 0, 18, 0.16)';
        tooltipEl.style.color = '#000';
        tooltipEl.style.fontSize = '12px';
        tooltipEl.style.opacity = 1;
        tooltipEl.style.pointerEvents = 'none';
        tooltipEl.style.position = 'absolute';
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

      console.log(tooltip, tooltip.body);

      // Set Text
      if (tooltip.body) {
        /*const titleLines = tooltip.title || [];
        const bodyLines = tooltip.body.map((b: any) => b.lines);

        const tableHead = document.createElement('thead');

        titleLines.forEach((title: any) => {
          const tr = document.createElement('tr');
          // @ts-ignore
          tr.style.borderWidth = 0;

          const th = document.createElement('th');
          // @ts-ignore
          th.style.borderWidth = 0;
          const text = document.createTextNode(title);

          th.appendChild(text);
          tr.appendChild(th);
          tableHead.appendChild(tr);
        });

        const tableBody = document.createElement('tbody');
        bodyLines.forEach((body: any, i: any) => {
          const colors = tooltip.labelColors[i];

          console.log('colors', colors);
        });

        const tableRoot = tooltipEl.querySelector('table');

        // Add new children
        tableRoot.appendChild(tableHead);
        tableRoot.appendChild(tableBody);*/

        const title = document.createElement('p');
        title.innerHTML =
          this.calculatorService.showGraphDetailTypeLineTitle || '';

        const divInside = tooltipEl.querySelector('.inner-tooltip');
        // Remove old children
        while (divInside.firstChild) {
          divInside.firstChild.remove();
        }
        divInside.appendChild(title);
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
        labels.push(
          now.getMonth() === 0 || now.getMonth() === 11
            ? [this.getShortMonthString(now), (now.getFullYear() + '').slice(2)]
            : this.getShortMonthString(now)
        );

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
