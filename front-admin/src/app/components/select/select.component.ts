import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'aj-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss']
})
export class SelectComponent {

  @Input() rightsUser: any = []
  @Input() path: boolean = false
  @Output() valueChange: EventEmitter<number[] | string[]> = new EventEmitter()

  selectedRights: string[] = [];

  onNgModelChange(event: any) {
    console.log('On ngModelChange : ', event);
    this.valueChange.emit(this.selectedRights)
  }
}
