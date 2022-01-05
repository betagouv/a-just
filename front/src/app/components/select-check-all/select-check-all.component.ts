import { Component, Input, OnInit } from '@angular/core';
import { NgModel } from '@angular/forms';

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
  styles: [''],
})
export class SelectCheckAllComponent implements OnInit {
  @Input() model: NgModel | undefined;
  @Input() values: any[] = [];
  @Input() text = 'Tous';

  constructor() {}

  ngOnInit() {}

  isChecked(): boolean {
    return (
      this.model &&
      this.model.value &&
      this.values.length &&
      this.model.value.length === this.values.length
    );
  }

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
