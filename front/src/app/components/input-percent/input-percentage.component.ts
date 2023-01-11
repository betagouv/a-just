import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'

/**
 * Composant input pourcentage
 */
@Component({
  selector: 'aj-input-percentage',
  templateUrl: './input-percentage.component.html',
  styleUrls: ['./input-percentage.component.scss'],
})
export class InputPercentageComponent implements OnChanges {
  /**
   * Valeur au dénominateur
   */
  @Input() referenceValue: number = 0
  /**
   * Valeur par défaut
   */
  @Input() defaultValue: string | null = null
  /**
   * Réinitialisation
   */
  @Input() reset: boolean = false
  /**
   * Valeur de sortie
   */
  @Output() valueChange = new EventEmitter()

  /**
   * Formulaire de saisie
   */
  valueForm = new FormGroup({
    percentage: new FormControl(''),
  })

  /**
   * Constructeur
   */
  constructor() {
    this.valueForm.controls.percentage.valueChanges.subscribe((value) => {
      this.valueChange.emit({
        value: Math.round(
          parseInt(
            this.returnPercentage(this.valueForm.controls['percentage'].value)
          )
        ),
        percentage: this.valueForm.controls['percentage'].value,
      })
    })
  }

  /**
   * Ecoute des valeurs de reset et defaultValue
   */
  ngOnChanges() {
    if (this.reset === true) {
      this.valueForm.controls['percentage'].setValue('')
      this.defaultValue = null
      this.reset = false
    }
    if (this.defaultValue !== null) {
      this.valueForm.controls['percentage'].setValue(this.defaultValue)
    }
  }

  /**
   * Calcul de pourcentage
   * @param x numérateur
   * @returns %
   */
  returnPercentage(x: any): string {
    return x
      ? String(
          Math.round(
            this.referenceValue -
              ((-parseInt(x) * 1) / 100) * this.referenceValue
          )
        )
      : ''
  }
}
