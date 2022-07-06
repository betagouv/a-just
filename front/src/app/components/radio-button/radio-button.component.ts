import {
  Component,
  ElementRef,
  EventEmitter,
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
  @Input() switchColor: string = ''
  @Input() bgColor: string = 'white'
  @Output() valueChange = new EventEmitter()
  @Input() value: boolean = true

  o = {
    label: '',
    checked: true,
  }

  elementRef: HTMLElement | undefined

  constructor(element: ElementRef<HTMLElement>) {
    this.elementRef = element.nativeElement
  }

  ngOnInit(): void {
    this.o.label = this.title

    const dotElement = (
      this.elementRef!.getElementsByClassName(
        'check__indicator'
      ) as HTMLCollectionOf<HTMLElement>
    )[0]
    dotElement.style.setProperty('--boxAfterBackColor', this.switchColor)

    this.valueChange.emit(this.o)
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.o.checked = changes.value.currentValue
  }

  clicked() {
    this.valueChange.emit(this.o)
  }
}
