import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core'

@Component({
  selector: 'aj-radio-button',
  templateUrl: './radio-button.component.html',
  styleUrls: ['./radio-button.component.scss'],
})
export class RadioButtonComponent implements OnChanges, OnInit {
  @Input() title: string = ''
  @Input() switchColor: string = '#7befb2'
  @Input() @HostBinding('style.background-color') bgColor: string = 'white'
  @Input() width: number = 25
  @Input() height: number = 15
  @Output() valueChange = new EventEmitter()
  @Input() value: boolean = true
  @HostListener('click') 
  onClick() {
    this.o.checked = !this.o.checked
    this.valueChange.emit(this.o)
  }
  o = {
    label: '',
    checked: true,
  }

  ngOnInit(): void {
    this.o.label = this.title

    this.valueChange.emit(this.o)
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.o.checked = changes.value.currentValue
  }
}
