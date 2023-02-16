import { Component, Input } from '@angular/core';
import { NgModel } from '@angular/forms';

/**
 * Composant de tout selectionner pour la liste
 */

@Component({
  selector: 'app-select-check-all',
  template: `
    <mat-checkbox
      class="mat-option"
      [disableRipple]="true"
      [checked]="isChecked()"
      (click)="$event.stopPropagation()"
      (change)="toggleSelection($event)"
    >
      {{ text }}
    </mat-checkbox>
  `,
  styleUrls: ['./select-check-all.component.scss'],
})
export class SelectCheckAllComponent {
  /**
   * Composant sur lequel greffer le select all
   */
  @Input() model: NgModel | undefined;
  /**
   * Liste des elements de la liste
   */
  @Input() values: any[] = [];
  /**
   * Valeure du champ qui selectionne tous
   */
  @Input() text = 'Tous';

  /**
   * Retour si l'ensemble des éléments sont checks
   * @returns 
   */
  isChecked(): boolean {
    return (
      this.model &&
      this.model.value &&
      this.values.length &&
      this.model.value.length === this.values.length
    );
  }

  /**
   * Force la selection ou la déselection de la liste
   * @param change 
   */
  toggleSelection(change: any): void {
    if (this.model) {
      if (change.checked) {
        this.model.update.emit(this.values.map(v => v.id));
      } else {
        this.model.update.emit([]);
      }
    }
  }
}
