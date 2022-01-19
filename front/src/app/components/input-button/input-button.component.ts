import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MainClass } from 'src/app/libs/main-class';

@Component({
  selector: 'aj-input-button',
  templateUrl: './input-button.component.html',
  styleUrls: ['./input-button.component.scss'],
})
export class InputButtonComponent
  extends MainClass
{
  @Input() title: string | null = null;
  @Input() placeholder: string | null = null;
  @Input() icon: string = 'search';
  @Input() value: string | null = null;
  @Output() valueChange = new EventEmitter();
  @Output() search = new EventEmitter();

  constructor() {
    super();
  }

  onSearch() {
    this.search.emit();
  }

  onChange() {
    this.valueChange.emit(this.value);
  }
}
