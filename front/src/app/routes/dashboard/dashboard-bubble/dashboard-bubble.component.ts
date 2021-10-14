import { Component, Input, OnChanges } from '@angular/core';
import { ChartOptions, ChartDataset } from 'chart.js';
import { SpeedService } from 'src/app/services/speed/speed.service';

@Component({
  selector: 'dashboard-bubble-component',
  templateUrl: './dashboard-bubble.component.html',
  styleUrls: ['./dashboard-bubble.component.scss'],
})
export class DashboardBubbleComponent implements OnChanges {
  @Input() speed: number = 0;
  bubbleChartOptions: ChartOptions = {
    responsive: true,
  };
  bubbleChartLegend = true;
  bubbleChartData: ChartDataset[] = [];

  constructor(private speedService: SpeedService) {}

  ngOnChanges() {
    this.onLoad();
  }

  ngAfterViewInit() {
      this.onLoad();
  }

  onLoad() {
    this.speedService
      .getSpeedValues(this.speed)
      .then((list) => (this.bubbleChartData = [
        {
          data: list,
          label: 'Zones de danger',
        },
      ]));
  }
}
