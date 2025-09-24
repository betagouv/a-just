
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { decimalToStringDate } from '../../utils/dates';

/**
 * Composant input pourcentage
 */
@Component({
  selector: 'aj-input-percentage',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './input-percentage.component.html',
  styleUrls: ['./input-percentage.component.scss'],
})
export class InputPercentageComponent implements OnChanges {
  /**
   * Valeur au dénominateur
   */
  @Input() referenceValue: number = 0;
  /**
   * Valeur par défaut
   */
  @Input() defaultValue: string | null = null;
  /**
   * Réinitialisation
   */
  @Input() reset: boolean = false;

  /**
   * Valeur pour TMD
   */
  @Input() float: boolean = false;

  /**
   * Valeur de sortie
   */
  @Output() valueChange = new EventEmitter();

  /**
   * Formulaire de saisie
   */
  valueForm = new FormGroup({
    percentage: new FormControl(''),
  });

  /**
   * Constructeur
   */
  constructor() {
    this.valueForm.controls.percentage.valueChanges.subscribe((value) => {
      if (this.float === true)
        this.valueChange.emit({
          value: parseFloat(
            this.returnPercentage(this.valueForm.controls['percentage'].value)
          ),
          percentage: this.valueForm.controls['percentage'].value,
        });
      else
        this.valueChange.emit({
          value: Math.round(
            parseInt(
              this.returnPercentage(this.valueForm.controls['percentage'].value)
            )
          ),
          percentage: this.valueForm.controls['percentage'].value,
        });
    });
  }

  /**
   * Ecoute des valeurs de reset et defaultValue
   */
  ngOnChanges() {
    if (this.reset === true) {
      this.valueForm.controls['percentage'].setValue('');
      this.defaultValue = null;
      this.reset = false;
    }
    if (this.defaultValue !== null) {
      this.valueForm.controls['percentage'].setValue(this.defaultValue);
    }
  }

  /**
   * Calcul de pourcentage
   * @param x numérateur
   * @returns %
   */
  //PERMETTRE AJUSTEMENT A 0 %
  returnPercentage(x: any, displayValue = false): string {
    if (x === 0) return String(this.referenceValue);
    if (this.float) {
      const res = x
        ? String(
            this.referenceValue -
              ((-parseInt(x) * 1) / 100) * this.referenceValue
          )
        : '';

      if (displayValue) {
        if (x === '') return '';
        else return String(decimalToStringDate(parseFloat(res)));
      }
      return res;
    } else {
      const res = x
        ? String(
            Math.round(
              this.referenceValue -
                ((-parseInt(x) * 1) / 100) * this.referenceValue
            )
          )
        : '';
      return res;
    }
  }
}
