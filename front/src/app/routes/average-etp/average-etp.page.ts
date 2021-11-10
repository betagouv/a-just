import { Component } from '@angular/core';
import { ItemInterface } from 'src/app/interfaces/item';
import { IndicatorService } from 'src/app/services/indicator/indicator.service';

const now = new Date();

const month12Past = new Date(now.getFullYear(), now.getMonth(), 1); 
month12Past.setMonth(month12Past.getMonth() - 12);
const month6Past = new Date(now.getFullYear(), now.getMonth(), 1); 
month6Past.setMonth(month6Past.getMonth() - 6);
const month1Past = new Date(now.getFullYear(), now.getMonth(), 1); 

@Component({
  templateUrl: './average-etp.page.html',
  styleUrls: ['./average-etp.page.scss'],
})
export class AverageEtpPage {
  mainCategories: ItemInterface[] = [];
  perimeterSelected: string | null = null;
  groups: string[] = [];
  rangeLimitSelected: string | null = '1month';
  rangeStartDate = month1Past;
  rangeEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  rangeLimits = [{
    id: '12months',
    label: '12 derniers mois',
    dateStart: month12Past,
    dateEnd: this.rangeEndDate,
  }, {
    id: '6months',
    label: '6 derniers mois',
    dateStart: month6Past,
    dateEnd: this.rangeEndDate,
  }, {
    id: '1month',
    label: 'Le mois précédent',
    dateStart: month1Past,
    dateEnd: this.rangeEndDate,
  }];

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

  changeRange(item: string | null) {
    this.rangeLimitSelected = item;
    
    const findToList = this.rangeLimits.find(i => i.id === item);
    if(findToList) {
      this.rangeStartDate = findToList.dateStart;
      this.rangeEndDate = findToList.dateEnd;
    }
  }

  trackBy(index: number, item: any) {
    return item;
  }
}
