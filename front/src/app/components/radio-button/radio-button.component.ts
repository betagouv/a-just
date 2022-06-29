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
    const checkElement = (
      this.elementRef!.getElementsByClassName(
        'check'
      ) as HTMLCollectionOf<HTMLElement>
    )[0]

    checkElement.style.setProperty('--boxBackColor', this.bgColor)

    const dotElement = (
      this.elementRef!.getElementsByClassName(
        'check__indicator'
      ) as HTMLCollectionOf<HTMLElement>
    )[0]
    dotElement.style.setProperty('--boxAfterBackColor', this.switchColor)
  }
  ngOnChanges(changes: SimpleChanges): void {}

  clicked() {
    this.valueChange.emit(this.o)
  }
}
