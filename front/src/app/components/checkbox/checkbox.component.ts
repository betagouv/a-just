import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'aj-checkbox',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
})
export class CheckboxComponent implements AfterViewInit, OnChanges {
  @ViewChild('checkbox') input!: ElementRef<HTMLInputElement>;

  /**
   * Initial value
   */
  @Input() value: boolean = false;
  /**
   * Event lors de la sauvegarde
   */
  @Output() valueChange = new EventEmitter();

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    if (change['value'].previousValue !== undefined)
      this.input.nativeElement.checked = this.value;
  }

  ngAfterViewInit(): void {
    this.input.nativeElement.checked = this.value;
  }
  toogle() {
    this.valueChange.emit(this.input.nativeElement.checked);
  }
}
