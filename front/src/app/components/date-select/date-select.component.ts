import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  HostBinding,
  ViewChild,
} from '@angular/core';
import {
  MatCalendarCellClassFunction,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatDatepicker } from '@angular/material/datepicker';
import { MainClass } from '../../libs/main-class';

import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { today } from '../../utils/dates';

/**
 * Bouton de selection de date prédesigner
 */
@Component({
  selector: 'aj-date-select',
  standalone: true,
  imports: [MatIconModule, MatDatepickerModule, FormsModule],
  templateUrl: './date-select.component.html',
  styleUrls: ['./date-select.component.scss'],
})
export class DateSelectComponent extends MainClass implements OnChanges {
  /**
   * Titre du bouton
   */
  @Input() title: string | null = null;
  /**
   * Icon affichée sur la droite
   */
  @Input() icon: string = 'calendar_today';
  /**
   * Type de sélection par défaut de date
   */
  @Input() dateType: string = 'date'; // date | month
  /**
   * Valeure par défaut
   */
  @Input() value: Date | string | undefined | null = null;
  /**
   * Est éditable ou non
   */
  @Input() readOnly: boolean = false;
  /**
   * Affiche "aujourd'hui" quand la date est de aujourd'hui
   */
  @Input() showToday: boolean = true;
  /**
   * Possibilité d'avoir une date nule
   */
  @Input() clearable: boolean = false;
  /**
   * Date minimal
   */
  @Input() min: Date | null | undefined = null;
  /**
   * Date maximal
   */
  @Input() max: Date | null = null;
  /**
   * Show arrow
   */
  @Input() showArrow: boolean = false;
  /**
   * Date class du calendrier
   */
  @Input() dateClass: MatCalendarCellClassFunction<any> = (cellDate, view) => {
    return '';
  };
  /**
   * Rémontée au parent en cas de changement de date sélectionnée
   */
  @Output() valueChange = new EventEmitter();
  /**
   * Emit is open
   */
  @Output() isOpen = new EventEmitter();
  /**
   * Class host qui permet d'afficher un design de read only
   */
  @HostBinding('class.read-only') onReadOnly: boolean = false;
  /**
   * Composant de selection de date de material
   */
  @ViewChild('picker') picker: any;
  /**
   * Conversion du champs date en un champs date humaine
   */
  realValue: string = '';

  /**
   * Constructeur
   */
  constructor() {
    super();
  }

  /**
   * Détection en cas de change de date via le père
   */
  ngOnChanges() {
    this.findRealValue();
    this.onReadOnly = this.readOnly;
  }

  /**
   * Conversion du champs date en un champs date humaine
   */
  findRealValue() {
    const now = new Date();

    if (typeof this.value === 'string') {
      this.value = new Date(this.value);
    }

    if (this.value && typeof this.value.getMonth === 'function') {
      switch (this.dateType) {
        case 'date':
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
            )} ${this.getShortMonthString(
              this.value
            )} ${this.value.getFullYear()}`;
          }
          break;
        case 'month':
          this.realValue = `${this.getShortMonthString(
            this.value
          )} ${this.value.getFullYear()}`;
          break;
      }
    } else {
      this.realValue = '';
    }
  }

  /**
   * Conversion du champ date material en date JS
   * @param event
   */
  onDateChanged(event: any) {
    const date = event ? new Date(event) : null;
    this.value = date;

    this.valueChange.emit(this.value);
    this.findRealValue();
  }

  /**
   * Ouverture du selecteur de date de material
   */
  onClick() {
    this.readOnly === false ? this.picker.open() : null;
  }

  /**
   * Forcer ou non de fermer le selecteur de date de material en fonction du type de date
   * @param normalizedMonthAndYear
   * @param datepicker
   */
  setMonthAndYear(
    normalizedMonthAndYear: Date,
    datepicker: MatDatepicker<any>
  ) {
    if (this.dateType === 'month') {
      const date = new Date(
        normalizedMonthAndYear.getFullYear(),
        normalizedMonthAndYear.getMonth()
      );

      this.value = date;
      this.valueChange.emit(this.value);
      this.findRealValue();
      datepicker.close();
    }
  }

  /**
   * Change date selected with delta
   * @param delta
   */
  onChangeDate(delta: number) {
    this.value = new Date(this.value || '');

    if (this.dateType === 'month') {
      this.value.setMonth(this.value.getMonth() + delta);
    } else {
      this.value.setDate(this.value.getDate() + delta);
    }

    this.valueChange.emit(this.value);
    this.findRealValue();
  }

  /**
   * Show or hide left chevron
   */
  onShowLeftArrow() {
    if (this.showArrow) {
      if (!this.min) {
        return true;
      } else if (this.value && this.min) {
        const dValue = new Date(this.value || '');
        const compareDate =
          this.dateType === 'month' ? this.getMonth(this.min) : today(this.min);
        if (
          this.dateType === 'month' &&
          this.getMonth(dValue).getTime() > compareDate.getTime()
        ) {
          return true;
        } else if (
          this.dateType !== 'month' &&
          today(dValue).getTime() > compareDate.getTime()
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Show or hide right chevron
   */
  onShowRightArrow() {
    if (this.showArrow) {
      if (!this.max) {
        return true;
      } else if (this.value && this.max) {
        const dValue = new Date(this.value || '');
        const compareDate =
          this.dateType === 'month' ? this.getMonth(this.max) : today(this.max);
        if (
          this.dateType === 'month' &&
          this.getMonth(dValue).getTime() < compareDate.getTime()
        ) {
          return true;
        } else if (
          this.dateType !== 'month' &&
          today(dValue).getTime() < compareDate.getTime()
        ) {
          return true;
        }
      }
    }

    return false;
  }
}
