import {
  Component,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'

/**
 * Composant selecteur de date de type bleu
 */
@Component({
  selector: 'aj-date-select-blue',
  templateUrl: './date-select-blue.component.html',
  styleUrls: ['./date-select-blue.component.scss'],
})
export class DateSelectBlueComponent extends MainClass implements OnChanges {
  /**
   * Titre du bouton
   */
  @Input() title: string | null = null
  /**
   * Icon contenu dans le bouton
   */
  @Input() icon: string = 'calendar_today'
  /**
   * Date choisie
   */
  @Input() value: Date | undefined | null = null
  /**
   * Mode lecture seule
   */
  @Input() readOnly: boolean = false
  /**
   * Affichage à aujourd'hui
   */
  @Input() showToday: boolean = true
  /**
   * Emmeteur de changement de valeur
   */
  @Output() valueChange = new EventEmitter()
  /**
   * Ecoute de la classe lecture seul
   */
  @HostBinding('class.read-only') onReadOnly: boolean = false
  /**
   * Date minimum selectionnable
   */
  @Input() min: Date | null = null
  /**
   * Date maximum selectionnable
   */
  @Input() max: Date | null = null
  /**
   * Sens du bouton
   */
  @Input() side: string = ''

  /**
   * Valeur de la date écrite en français
   */
  realValue: string = ''

  /**
   * Constructeur
   */
  constructor() {
    super()
  }

  /**
   * Au changement d'état du composant
   */
  ngOnChanges() {
    this.findRealValue()
    this.onReadOnly = this.readOnly
  }

  /**
   * Retrouve la valeur d'une date en français depuis un format numérique 21/10/2022
   */
  findRealValue() {
    const now = new Date()

    if (this.value && typeof this.value.getMonth === 'function') {
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
        )} ${this.getShortMonthString(this.value)} ${this.value.getFullYear()}`
      }
    } else {
      if (this.title) this.realValue = this.title as string
      else this.realValue = ''
    }
  }

  /**
   * Changement de date
   * @param event
   */
  onDateChanged(event: any) {
    const date = new Date(event._i.year, event._i.month, event._i.date)
    this.value = date
    this.valueChange.emit(this.value)
    this.findRealValue()
  }
}
