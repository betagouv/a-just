import { Component, Input, OnChanges, Output, EventEmitter, HostBinding, ViewChild } from '@angular/core'
import { MatCalendarCellClassFunction, MatDatepickerModule } from '@angular/material/datepicker'
import { MatDatepicker } from '@angular/material/datepicker'
import { MainClass } from '../../libs/main-class'

import { MatIconModule } from '@angular/material/icon'
import { FormsModule } from '@angular/forms'
import { today } from '../../utils/dates'

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
   * Autorise la saisie manuelle de la date au format JJ/MM/AAAA (ou MM/AAAA en mode "month").
   * Le sélecteur de calendrier reste accessible via l'icône et le label.
   */
  @Input() manualInput: boolean = false
  /**
   * Date minimal
   */
  @Input() min: Date | null | undefined = null
  /**
   * Date maximal
   */
  @Input() max: Date | null | undefined = null
  /**
   * Show arrow
   */
  @Input() showArrow: boolean = false
  /**
   * Date class du calendrier
   */
  @Input() dateClass: MatCalendarCellClassFunction<any> = (cellDate, view) => {
    return ''
  }
  /**
   * Permet de savoir si le date-select est en lecture seule
   */
  @Input() @HostBinding('class.not-read-only') readonly: boolean = false
  /**
   * Rémontée au parent en cas de changement de date sélectionnée
   */
  @Output() valueChange = new EventEmitter()
  /**
   * Emit is open
   */
  @Output() isOpen = new EventEmitter()
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
   * Valeur affichée dans le champ de saisie manuelle (format JJ/MM/AAAA ou MM/AAAA)
   */
  editValue: string = ''
  /**
   * Indique si le champ de saisie manuelle a le focus.
   * Hors focus on affiche le label lisible ("Aujourd'hui", "15 juin 2026"),
   * pendant la saisie on bascule sur le format éditable JJ/MM/AAAA.
   */
  manualFocused: boolean = false

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
    this.findEditValue()
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
            this.realValue = `${(this.value.getDate() + '').padStart(2, '0')} ${this.getShortMonthString(this.value)} ${this.value.getFullYear()}`
          }
          break
        case 'month':
          this.realValue = `${this.getShortMonthString(this.value)} ${this.value.getFullYear()}`
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
    const date = event ? new Date(event) : null
    this.value = date

    this.valueChange.emit(this.value)
    this.findRealValue()
    this.findEditValue()
  }

  /**
   * Synchronise la valeur du champ de saisie manuelle avec la date courante
   */
  findEditValue() {
    if (this.value && typeof (this.value as Date).getMonth === 'function') {
      const date = this.value as Date
      const month = (date.getMonth() + 1 + '').padStart(2, '0')
      const year = date.getFullYear()

      if (this.dateType === 'month') {
        this.editValue = `${month}/${year}`
      } else {
        const day = (date.getDate() + '').padStart(2, '0')
        this.editValue = `${day}/${month}/${year}`
      }
    } else {
      this.editValue = ''
    }
  }

  /**
   * Applique le masque (JJ/MM/AAAA ou MM/AAAA) pendant la saisie manuelle
   * tout en conservant la position du curseur. On compte le nombre de chiffres
   * situés avant le curseur, on reformate, puis on replace le curseur après ce
   * même nombre de chiffres : éditer "12" au milieu ne renvoie plus le curseur à la fin.
   * @param input champ de saisie natif
   */
  onManualInput(input: HTMLInputElement) {
    const raw = input.value
    const caret = input.selectionStart ?? raw.length
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length

    const formatted = this.maskDate(raw)
    this.editValue = formatted
    input.value = formatted

    const nextCaret = this.caretFromDigitIndex(formatted, digitsBeforeCaret)
    input.setSelectionRange(nextCaret, nextCaret)
  }

  /**
   * Construit la chaîne masquée à partir d'une saisie libre (JJ/MM/AAAA ou MM/AAAA)
   * @param raw
   */
  maskDate(raw: string): string {
    const digits = (raw || '').replace(/\D/g, '')

    if (this.dateType === 'month') {
      const month = digits.slice(0, 2)
      const year = digits.slice(2, 6)
      return year.length ? `${month}/${year}` : month
    }

    const day = digits.slice(0, 2)
    const month = digits.slice(2, 4)
    const year = digits.slice(4, 8)
    let formatted = day
    if (month.length) formatted += `/${month}`
    if (year.length) formatted += `/${year}`
    return formatted
  }

  /**
   * Renvoie l'index de curseur situé juste après le n-ième chiffre de la chaîne
   * (on saute les séparateurs "/" insérés par le masque)
   * @param formatted chaîne masquée
   * @param digitCount nombre de chiffres à laisser avant le curseur
   */
  caretFromDigitIndex(formatted: string, digitCount: number): number {
    if (digitCount <= 0) {
      return 0
    }

    let seen = 0
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        seen++
        if (seen === digitCount) {
          return i + 1
        }
      }
    }

    return formatted.length
  }

  /**
   * Passage en édition : on bascule l'affichage sur le format éditable JJ/MM/AAAA
   */
  onEditFocus() {
    this.manualFocused = true
  }

  /**
   * Valide la saisie manuelle (à la perte de focus ou à la validation par "Entrée")
   * et rebascule sur le label lisible ("Aujourd'hui", "15 juin 2026")
   */
  onEditBlur() {
    const date = this.parseEditValue(this.editValue)

    if (date) {
      this.value = date
      this.valueChange.emit(this.value)
    } else if (!this.editValue) {
      this.value = null
      this.valueChange.emit(this.value)
    }

    this.findRealValue()
    this.findEditValue()
    this.manualFocused = false
  }

  /**
   * Transforme une chaîne JJ/MM/AAAA (ou MM/AAAA) en date JS valide, ou null
   * @param text
   */
  parseEditValue(text: string): Date | null {
    if (!text) {
      return null
    }

    const parts = text.split('/').map((part) => part.trim())
    let day = 1
    let month: number
    let year: number

    if (this.dateType === 'month') {
      if (parts.length < 2) {
        return null
      }
      month = parseInt(parts[0], 10)
      year = parseInt(parts[1], 10)
    } else {
      if (parts.length < 3) {
        return null
      }
      day = parseInt(parts[0], 10)
      month = parseInt(parts[1], 10)
      year = parseInt(parts[2], 10)
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return null
    }
    if (month < 1 || month > 12 || year < 1000) {
      return null
    }

    const date = new Date(year, month - 1, day)

    // Rejette les dates incohérentes (ex: 31/02)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null
    }

    // Comparaison au jour près : "today" en entrée min/max embarque l'heure
    // courante, alors que la saisie produit minuit. On normalise pour ne pas
    // rejeter à tort la date du jour.
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

    if (this.min && startOfDay(date) < startOfDay(new Date(this.min))) {
      return null
    }
    if (this.max && startOfDay(date) > startOfDay(new Date(this.max))) {
      return null
    }

    return date
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
  setMonthAndYear(normalizedMonthAndYear: Date, datepicker: MatDatepicker<any>) {
    if (this.dateType === 'month') {
      const date = new Date(normalizedMonthAndYear.getFullYear(), normalizedMonthAndYear.getMonth())

      this.value = date
      this.valueChange.emit(this.value)
      this.findRealValue()
      this.findEditValue()
      datepicker.close()
    }
  }

  /**
   * Change date selected with delta
   * @param delta
   */
  onChangeDate(delta: number) {
    this.value = new Date(this.value || '')

    if (this.dateType === 'month') {
      this.value.setMonth(this.value.getMonth() + delta)
    } else {
      this.value.setDate(this.value.getDate() + delta)
    }

    this.valueChange.emit(this.value)
    this.findRealValue()
    this.findEditValue()
  }

  /**
   * Show or hide left chevron
   */
  onShowLeftArrow() {
    if (this.showArrow) {
      if (!this.min) {
        return true
      } else if (this.value && this.min) {
        const dValue = new Date(this.value || '')
        const compareDate = this.dateType === 'month' ? this.getMonth(this.min) : today(this.min)
        if (this.dateType === 'month' && this.getMonth(dValue).getTime() > compareDate.getTime()) {
          return true
        } else if (this.dateType !== 'month' && today(dValue).getTime() > compareDate.getTime()) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Show or hide right chevron
   */
  onShowRightArrow() {
    if (this.showArrow) {
      if (!this.max) {
        return true
      } else if (this.value && this.max) {
        const dValue = new Date(this.value || '')
        const compareDate = this.dateType === 'month' ? this.getMonth(this.max) : today(this.max)
        if (this.dateType === 'month' && this.getMonth(dValue).getTime() < compareDate.getTime()) {
          return true
        } else if (this.dateType !== 'month' && today(dValue).getTime() < compareDate.getTime()) {
          return true
        }
      }
    }

    return false
  }
}
