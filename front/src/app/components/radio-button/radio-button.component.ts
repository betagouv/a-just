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
  @Input() @HostBinding('style.border-color') borderColor: string = 'white'
  @HostBinding('style.width') @Input() width: string = '25px'
  @HostBinding('style.height') @Input() height: string = '15px'
  @HostBinding('style.border-radius') @Input() borderRadius: string = '7.5px'
  @Input() indicatorWidth: number = 15 / 2
  @Input() indicatorHeight: number = 15 / 2
  @Input() icon: string = ''
  @Input() readOnly: boolean = false
  @Output() valueChange = new EventEmitter()
  @HostBinding('class.selected') @Input() value: boolean = true
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    event.stopPropagation()
    if (!this.readOnly) {
      this.o.checked = !this.o.checked
      this.value = this.o.checked
      this.valueChange.emit(this.o)
    }
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
    if (changes.value) {
      this.o.checked = this.value
    }
  }
}
