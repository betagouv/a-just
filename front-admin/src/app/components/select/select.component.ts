import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'aj-select',
  standalone: true,
  imports: [CommonModule, FormsModule, MatListModule],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent {
  @Input() rightsUser: any = [];
  @Input() path: boolean = false;
  @Output() valueChange: EventEmitter<number[] | string[]> = new EventEmitter();

  selectedRights: string[] = [];
  onNgModelChange(event: any) {
    this.valueChange.emit(this.selectedRights);
  }
}
