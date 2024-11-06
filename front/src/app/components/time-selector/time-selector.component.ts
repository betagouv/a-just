import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { ContentieuxOptionsService } from '../../services/contentieux-options/contentieux-options.service';

/**
 * Composant de selection d'heure/minute
 */
@Component({
  selector: 'app-time-selector',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './time-selector.component.html',
  styleUrls: ['./time-selector.component.scss'],
})
export class TimeSelectorComponent implements OnChanges, OnInit {
  /**
   * Valeur décimal saisie
   */
  @Input() value: number = 0;
  /**
   * Activation du champ
   */
  @Input() disabled: boolean = false;
  /**
   * Indicateur de modification (pour surlignage en bleu)
   */
  @Input() changed: boolean = false;
  /**
   * Modification provenant d'une conversion d'un autre composant
   */
  @Input() outsideChange: boolean | undefined = false;
  /**
   * Valeur par défaut magistrat
   */
  @Input() defaultValue: number = 0;
  /**
   * Valeur par défaut fonctionnaire
   */
  @Input() defaultValueFonc: number = 0;
  /**
   * Categorie selectionnée
   */
  @Input() category: string = '';
  /**
   * Emetteur de changement
   */
  @Output() valueChange = new EventEmitter();
  /**
   * Expression reguliaire hh/mm
   */
  regex = '^([0-9]+|^1000)$|(([0-9]+|^1000):[0-5][0-9])$'; //'^([0-9]?[0-9]{1}|^1000):[0-5][0-9]$' //'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
  /**
   * Objet regex
   */
  regexObj = new RegExp(this.regex);
  /**
   * Premier changement effectué
   */
  firstChange = true;
  /**
   * Formulaire de saisie
   */
  timeForm = new FormGroup({
    time: new FormControl(''),
  });

  /**
   * Constructeur
   * @param contentieuxOptionsService Instance de contentieuxOptionsService
   */
  constructor(private contentieuxOptionsService: ContentieuxOptionsService) {
    this.contentieuxOptionsService.initValue.subscribe((value) => {
      if (value === true) {
        this.changed = false;
        this.firstChange = true;
      }
    });
  }

  /**
   * Ecoute de la valeur hh:mm puis modification
   */
  ngOnChanges(change: any) {
    this.timeForm.controls['time'].setValue(
      this.decimalToStringDate(this.value) || ''
    );
    if (this.outsideChange === true) this.changed = true;
    else this.changed = false;
    this.firstChange = false;
    if (change.defaultValue && change.defaultValue.currentValue === -1) {
      this.timeForm.controls['time'].setValue('');
      this.onChangeHour('');
    }
    if (
      change.value &&
      change.value.currentValue === 0 &&
      this.defaultValue === -1
    ) {
      this.timeForm.controls['time'].setValue('');
      this.onChangeHour('');
    }
  }

  ngOnInit() {
    if (this.defaultValue === -1) {
      this.timeForm.controls['time'].setValue('');
    }
  }

  /**
   * Mise à jour de la valeur hh:mm
   * @param event maj event
   */
  updateVal(event: any) {
    const value = event.target.value;
    if (value !== null && this.regexObj.test(value)) {
      if (this.firstChange === true) {
        if (this.category === 'MAGISTRATS') this.value = this.defaultValue;
        else this.value = this.defaultValueFonc;
        this.changed = false;
        this.firstChange = false;
      } else if (
        this.category === 'MAGISTRATS' &&
        value !== this.decimalToStringDate(this.defaultValue)
      ) {
        this.onChangeHour(value);
        this.changed = true;
      } else if (
        this.category === 'FONCTIONNAIRES' &&
        value !== this.decimalToStringDate(this.defaultValueFonc)
      ) {
        this.onChangeHour(value);
        this.changed = true;
      }
    }
  }

  /**
   * Conversion d'heures decimales en date (chaine de caractère)
   * @param decimal hh:mm décimal
   * @returns string
   */
  decimalToStringDate(decimal: number) {
    if (decimal != null) {
      const n = new Date(0, 0);
      n.setMinutes(Math.round(+decimal * 60));
      const subValue = Math.round(+decimal * 60);
      if (subValue === 60 && decimal - Math.trunc(decimal) > 0.9)
        return Math.trunc(decimal) + 1 + n.toTimeString().slice(2, 5);
      return Math.trunc(decimal) + n.toTimeString().slice(2, 5);
    }
    return '';
  }

  /**
   * Emission de la nouvelle valeur hh:mm à l'exterieur du composant
   * @param str chaine de caractère Date
   */
  onChangeHour(str: string) {
    this.valueChange.emit(this.timeToDecimal(str));
  }

  /**
   * Conversion de date vers nombre d'heure décimal
   * @param time chaine de caractère Date
   * @returns float
   */
  timeToDecimal(time: string) {
    var arr = time.split(':');
    var dec = (parseInt(arr[1], 10) / 6) * 10;
    let fulldec = String(dec).split('.').join('');

    return parseFloat(
      (parseInt(arr[0], 10) || 0) + '.' + (dec < 10 ? '0' : '') + fulldec
    );
  }

  /**
   * Choix logo à afficher
   * @returns Logo time à afficher
   */
  getImg() {
    return this.changed
      ? '/assets/icons/time-line-blue.svg'
      : '/assets/icons/time-line.svg';
  }

  /**
   * Enlever le focus du champ d'édition
   * @param event mouse event
   */
  blur(event: any) {
    event.target.blur();
  }
}
