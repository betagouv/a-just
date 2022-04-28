import {
  Component,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { MainClass } from 'src/app/libs/main-class';

@Component({
  selector: 'aj-date-select-blue',
  templateUrl: './date-select-blue.component.html',
  styleUrls: ['./date-select-blue.component.scss'],
})
export class DateSelectBlueComponent extends MainClass implements OnChanges {
  @Input() title: string | null = null;
  @Input() icon: string = 'calendar_today';
  @Input() value: Date | undefined | null = null;
  @Input() readOnly: boolean = false;
  @Input() showToday: boolean = true;
  @Output() valueChange = new EventEmitter();
  @HostBinding('class.read-only') onReadOnly: boolean = false;
  @Input() min: Date | null = null;
  realValue: string = '';

  constructor() {
    super();
  }

  ngOnChanges() {
    this.findRealValue();
    this.onReadOnly = this.readOnly;
  }

  findRealValue() {
    const now = new Date();

    if (this.value && typeof this.value.getMonth === 'function') {
      if (
        now.getFullYear() === this.value.getFullYear() &&
        now.getMonth() === this.value.getMonth() &&
        now.getDate() === this.value.getDate() &&
        this.showToday === true
      ) {
        this.realValue = "Aujourd'hui";
      } else {
        this.realValue = `${(this.value.getDate() + '').padStart(
          2,
          '0'
        )} ${this.getShortMonthString(this.value)} ${this.value.getFullYear()}`;
      }
    } else {
      this.realValue = 'Fin de période';
    }
  }

  onDateChanged(event: any) {
    const date = new Date(event._i.year, event._i.month, event._i.date);
    this.value = date;
    this.valueChange.emit(this.value);
    this.findRealValue();
  }
}
