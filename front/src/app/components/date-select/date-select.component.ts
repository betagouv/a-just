import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  HostBinding,
  ViewChild,
} from '@angular/core'
import { MatDatepicker } from '@angular/material/datepicker'
import { Moment } from 'moment'
import { MainClass } from 'src/app/libs/main-class'

/**
 * Bouton de selection de date prédesigner
 */
@Component({
  selector: 'aj-date-select',
  templateUrl: './date-select.component.html',
  styleUrls: ['./date-select.component.scss'],
})
export class DateSelectComponent extends MainClass implements OnChanges {
  /**
   * Titre du bouton
   */
  @Input() title: string | null = null
  /**
   * Icon affichée sur la droite
   */
  @Input() icon: string = 'calendar_today'
  /**
   * Type de sélection par défaut de date
   */
  @Input() dateType: string = 'date' // date | month
  /**
   * Valeure par défaut
   */
  @Input() value: Date | string | undefined | null = null
  /**
   * Est éditable ou non
   */
  @Input() readOnly: boolean = false
  /**
   * Affiche "aujourd'hui" quand la date est de aujourd'hui
   */
  @Input() showToday: boolean = true
  /**
   * Possibilité d'avoir une date nule
   */
  @Input() clearable: boolean = false
  /**
   * Date minimal
   */
  @Input() min: Date | null = null
  /**
   * Date maximal
   */
  @Input() max: Date | null = null
  /**
   * Rémontée au parent en cas de changement de date sélectionnée
   */
  @Output() valueChange = new EventEmitter()
  /**
   * Class host qui permet d'afficher un design de read only
   */
  @HostBinding('class.read-only') onReadOnly: boolean = false
  /**
   * Composant de selection de date de material
   */
  @ViewChild('picker') picker: any
  /**
   * Conversion du champs date en un champs date humaine
   */
  realValue: string = ''

  /**
   * Constructeur
   */
  constructor() {
    super()
  }

  /**
   * Détection en cas de change de date via le père
   */
  ngOnChanges() {
    this.findRealValue()
    this.onReadOnly = this.readOnly
  }

  /**
   * Conversion du champs date en un champs date humaine
   */
  findRealValue() {
    const now = new Date()

    if (typeof this.value === 'string') {
      this.value = new Date(this.value)
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
            this.realValue = "Aujourd'hui"
          } else {
            this.realValue = `${(this.value.getDate() + '').padStart(
              2,
              '0'
            )} ${this.getShortMonthString(
              this.value
            )} ${this.value.getFullYear()}`
          }
          break
        case 'month':
          this.realValue = `${this.getShortMonthString(
            this.value
          )} ${this.value.getFullYear()}`
          break
      }
    } else {
      this.realValue = ''
    }
  }

  /**
   * Conversion du champ date material en date JS
   * @param event 
   */
  onDateChanged(event: any) {
    if (event && event._i.year) {
      const date = new Date(event._i.year, event._i.month, event._i.date)
      this.value = date
    } else {
      this.value = event
    }

    this.valueChange.emit(this.value)
    this.findRealValue()
  }

  /**
   * Ouverture du selecteur de date de material
   */
  onClick() {
    this.readOnly === false ? this.picker.open() : null
  }

  /**
   * Forcer ou non de fermer le selecteur de date de material en fonction du type de date
   * @param normalizedMonthAndYear 
   * @param datepicker 
   */
  setMonthAndYear(
    normalizedMonthAndYear: Moment,
    datepicker: MatDatepicker<Moment>
  ) {
    if (this.dateType === 'month') {
      console.log(normalizedMonthAndYear, datepicker)
      const date = new Date(
        normalizedMonthAndYear.year(),
        normalizedMonthAndYear.month()
      )
      this.value = date
      this.valueChange.emit(this.value)
      this.findRealValue()
      datepicker.close()
    }
  }
}
