
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'aj-select-simple',
  standalone: true,
  imports: [FormsModule, MatListModule],
  templateUrl: './select-simple.component.html',
  styleUrls: ['./select-simple.component.scss'],
})
export class SelectSimpleComponent {
  @Input() rightsUser: any = [];
  @Input() path: boolean = false;
  @Output() valueChange: EventEmitter<number[] | string[]> = new EventEmitter();

  selectedRights: string[] = [];
  onNgModelChange(event: any) {
    this.valueChange.emit(this.selectedRights);
  }
}
