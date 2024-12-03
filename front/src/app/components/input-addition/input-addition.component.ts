import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

/**
 * Composant input pourcentage
 */
@Component({
  selector: 'aj-input-addition',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './input-addition.component.html',
  styleUrls: ['./input-addition.component.scss'],
})
export class InputAdditionComponent implements OnChanges {
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
   * Valeur de sortie
   */
  @Output() valueChange = new EventEmitter();

  /**
   * Formulaire de saisie
   */
  valueForm = new FormGroup({
    addition: new FormControl(''),
  });

  /**
   * Constructeur
   */
  constructor() {
    this.valueForm.controls.addition.valueChanges.subscribe((value) => {
      this.valueChange.emit({
        value: parseFloat(
          this.returnAddition(this.valueForm.controls['addition'].value)
        ),
        addition: this.valueForm.controls['addition'].value,
      });
    });
  }

  /**
   * Ecoute des valeurs de reset et defaultValue
   */
  ngOnChanges() {
    if (this.reset === true) {
      this.valueForm.controls['addition'].setValue('');
      this.defaultValue = null;
      this.reset = false;
    }
    if (this.defaultValue !== null) {
      this.valueForm.controls['addition'].setValue(this.defaultValue);
    }
  }

  /**
   * Calcule la somme
   * @param x
   * @returns value
   */
  returnAddition(x: any): string {
    if (x === '') return '';
    if (x === 0) return String(this.referenceValue);
    let res =
      Math.trunc(
        (this.referenceValue +
          parseFloat(this.valueForm.controls['addition'].value || '')) *
          100
      ) / 100;
    return String(res);
  }
}
