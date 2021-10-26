import { Component } from '@angular/core';
import { ItemInterface } from 'src/app/interfaces/item';
import { IndicatorService } from 'src/app/services/indicator/indicator.service';

@Component({
  templateUrl: './indicators.page.html',
  styleUrls: ['./indicators.page.scss'],
})
export class IndicatorsPage {
  mainCategories: ItemInterface[] = [];
  perimeterSelected: string | null = null;
  groups: string[] = [];

  constructor(private indicatorService: IndicatorService) {
    this.indicatorService.mainCategories.subscribe((l) => {
      this.mainCategories = [
        ...l.map((i) => ({ id: i, label: i })),
        { id: null, label: 'Toute la juridiction' },
      ];
      if (this.groups.length === 0) {
        this.groups = this.indicatorService.formatGroup(this.perimeterSelected);
      }
    });
  }

  changePerimeter(item: string | null) {
    this.perimeterSelected = item;
    this.groups = this.indicatorService.formatGroup(this.perimeterSelected);
  }

  trackBy(index: number, item: any) {
    return item;
  }
}
