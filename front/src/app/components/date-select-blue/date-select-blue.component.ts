
import {
  Component,
  HostBinding,
  Input,
  OnChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainClass } from '../../libs/main-class';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';

/**
 * Composant selecteur de date de type bleu
 */
@Component({
  selector: 'aj-date-select-blue',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatDatepickerModule],
  templateUrl: './date-select-blue.component.html',
  styleUrls: ['./date-select-blue.component.scss'],
})
export class DateSelectBlueComponent extends MainClass implements OnChanges {
  /**
   * Titre du bouton
   */
  @Input() title: string | null = null;
  /**
   * Icon contenu dans le bouton
   */
  @Input() icon: string = 'calendar_today';
  /**
   * Date choisie
   */
  @Input() value: Date | undefined | null = null;
  /**
   * Mode lecture seule
   */
  @Input() readOnly: boolean = false;
  /**
   * Affichage à aujourd'hui
   */
  @Input() showToday: boolean = true;
  /**
   * Emmeteur de changement de valeur
   */
  @Output() valueChange = new EventEmitter();
  /**
   * Ecoute de la classe lecture seul
   */
  @HostBinding('class.read-only') onReadOnly: boolean = false;
  /**
   * Date minimum selectionnable
   */
  @Input() min: Date | null = null;
  /**
   * Date maximum selectionnable
   */
  @Input() max: Date | null = null;
  /**
   * Sens du bouton
   */
  @Input() side: string = '';
  /**
   * Autorise la saisie manuelle de la date au format JJ/MM/AAAA.
   * Le sélecteur de calendrier reste accessible via l'icône.
   */
  @Input() manualInput: boolean = false;

  /**
   * Valeur de la date écrite en français
   */
  realValue: string = '';
  /**
   * Valeur affichée dans le champ de saisie manuelle (format JJ/MM/AAAA)
   */
  editValue: string = '';
  /**
   * Indique si le champ de saisie manuelle a le focus.
   * Hors focus on affiche le label lisible ("Aujourd'hui", "15 juin 2026"),
   * pendant la saisie on bascule sur le format éditable JJ/MM/AAAA.
   */
  manualFocused: boolean = false;

  /**
   * Constructeur
   */
  constructor() {
    super();
  }

  /**
   * Au changement d'état du composant
   */
  ngOnChanges() {
    this.findRealValue();
    this.findEditValue();
    this.onReadOnly = this.readOnly;
  }

  /**
   * Retrouve la valeur d'une date en français depuis un format numérique 21/10/2022
   */
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
      if (this.title) this.realValue = this.title as string;
      else this.realValue = '';
    }
  }

  /**
   * Changement de date
   * @param event
   */
  onDateChanged(event: any) {
    const date = new Date(event);
    this.value = date;
    this.valueChange.emit(this.value);
    this.findRealValue();
    this.findEditValue();
  }

  /**
   * Synchronise la valeur du champ de saisie manuelle avec la date courante
   */
  findEditValue() {
    if (this.value && typeof this.value.getMonth === 'function') {
      const day = (this.value.getDate() + '').padStart(2, '0');
      const month = (this.value.getMonth() + 1 + '').padStart(2, '0');
      const year = this.value.getFullYear();
      this.editValue = `${day}/${month}/${year}`;
    } else {
      this.editValue = '';
    }
  }

  /**
   * Passage en édition : on bascule l'affichage sur le format éditable JJ/MM/AAAA
   */
  onEditFocus() {
    this.manualFocused = true;
  }

  /**
   * Applique le masque (JJ/MM/AAAA) pendant la saisie manuelle tout en conservant
   * la position du curseur. On compte le nombre de chiffres situés avant le curseur,
   * on reformate, puis on replace le curseur après ce même nombre de chiffres :
   * éditer "12" au milieu ne renvoie plus le curseur à la fin.
   * @param input champ de saisie natif
   */
  onManualInput(input: HTMLInputElement) {
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;

    const formatted = this.maskDate(raw);
    this.editValue = formatted;
    input.value = formatted;

    const nextCaret = this.caretFromDigitIndex(formatted, digitsBeforeCaret);
    input.setSelectionRange(nextCaret, nextCaret);
  }

  /**
   * Construit la chaîne masquée JJ/MM/AAAA à partir d'une saisie libre
   * @param raw
   */
  maskDate(raw: string): string {
    const digits = (raw || '').replace(/\D/g, '');
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);
    let formatted = day;
    if (month.length) formatted += `/${month}`;
    if (year.length) formatted += `/${year}`;
    return formatted;
  }

  /**
   * Renvoie l'index de curseur situé juste après le n-ième chiffre de la chaîne
   * (on saute les séparateurs "/" insérés par le masque)
   * @param formatted chaîne masquée
   * @param digitCount nombre de chiffres à laisser avant le curseur
   */
  caretFromDigitIndex(formatted: string, digitCount: number): number {
    if (digitCount <= 0) {
      return 0;
    }

    let seen = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        seen++;
        if (seen === digitCount) {
          return i + 1;
        }
      }
    }

    return formatted.length;
  }

  /**
   * Valide la saisie manuelle (à la perte de focus ou à la validation par "Entrée")
   * et rebascule sur le label lisible ("Aujourd'hui", "15 juin 2026")
   */
  onEditBlur() {
    const date = this.parseEditValue(this.editValue);

    if (date) {
      this.value = date;
      this.valueChange.emit(this.value);
    } else if (!this.editValue) {
      this.value = null;
      this.valueChange.emit(this.value);
    }

    this.findRealValue();
    this.findEditValue();
    this.manualFocused = false;
  }

  /**
   * Transforme une chaîne JJ/MM/AAAA en date JS valide, ou null
   * @param text
   */
  parseEditValue(text: string): Date | null {
    if (!text) {
      return null;
    }

    const parts = text.split('/').map((part) => part.trim());
    if (parts.length < 3) {
      return null;
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return null;
    }
    if (month < 1 || month > 12 || year < 1000) {
      return null;
    }

    const date = new Date(year, month - 1, day);

    // Rejette les dates incohérentes (ex: 31/02)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    // Comparaison au jour près : "today" en entrée min/max embarque l'heure
    // courante, alors que la saisie produit minuit. On normalise pour ne pas
    // rejeter à tort la date du jour.
    const startOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

    if (this.min && startOfDay(date) < startOfDay(new Date(this.min))) {
      return null;
    }
    if (this.max && startOfDay(date) > startOfDay(new Date(this.max))) {
      return null;
    }

    return date;
  }
}
