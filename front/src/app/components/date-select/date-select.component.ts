import { Component, Input, OnDestroy, OnChanges, Output, EventEmitter } from '@angular/core';
import { MainClass } from 'src/app/libs/main-class';

export interface dataInterface {
  id: number;
  value: string;
}

@Component({
  selector: 'aj-date-select',
  templateUrl: './date-select.component.html',
  styleUrls: ['./date-select.component.scss'],
})
export class DateSelectComponent
  extends MainClass
  implements OnChanges, OnDestroy
{
  @Input() title: string | null = null;
  @Input() icon: string = 'calendar_today';
  @Input() value: Date | null = null;
  @Input() datas: dataInterface[] = [];
  @Output() valueChange = new EventEmitter();
  realValue: string = '';

  constructor() {
    super();
  }

  ngOnChanges() {
    this.findRealValue();
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  findRealValue() {
    const now = new Date();

    if (this.value) {
      if (
        now.getFullYear() === this.value.getFullYear() &&
        now.getMonth() === this.value.getMonth() &&
        now.getDate() === this.value.getDate()
      ) {
        this.realValue = "Aujourd'hui";
      } else {
        this.realValue = `${(this.value.getDate() + '').padStart(2, '0')}/${(
          this.value.getMonth() +
          1 +
          ''
        ).padStart(2, '0')}/${this.value.getFullYear()}`;
      }
    } else {
      this.realValue = '';
    }
  }

  onDateChanged(event: any) {
    const date = new Date(event._i.year, event._i.month, event._i.date);
    this.value = date;
    this.valueChange.emit(this.value);
    this.findRealValue();
  }
}
