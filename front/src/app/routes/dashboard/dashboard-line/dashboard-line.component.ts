import { Component, Input, OnChanges } from '@angular/core';
import { ChartOptions, ChartDataset } from 'chart.js';
import { SpeedService } from 'src/app/services/speed/speed.service';

@Component({
  selector: 'dashboard-line-component',
  templateUrl: './dashboard-line.component.html',
  styleUrls: ['./dashboard-line.component.scss'],
})
export class DashboardLineComponent implements OnChanges {
  @Input() speed: number = 0;
  @Input() amplitude: number = 0;
  chartOptions: ChartOptions = {
    responsive: true,
  };
  chartLegend = true;
  chartData: ChartDataset[] = [];
  chartLabels: string[] = [];

  constructor(private speedService: SpeedService) {}

  ngOnChanges() {
    this.onLoad();
  }

  ngAfterViewInit() {
    this.onLoad();
  }

  onLoad() {
    this.speedService
      .getAmplitudeValues(this.speed, this.amplitude)
      .then((list) => {
        this.chartData = [
          {
            data: list.datas,
            label: 'Paliers multiplicateurs de danger',
          },
        ];
        this.chartLabels = list.labels;
      });
  }
}
