import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core'

@Component({
  selector: 'aj-radio-button',
  templateUrl: './radio-button.component.html',
  styleUrls: ['./radio-button.component.scss'],
})
export class RadioButtonComponent implements OnChanges, OnInit {
  @Input() switchColor: string = ''
  @Input() bgColor: string = 'white'

  o = {
    label: 'Cheap',
    checked: true,
  }

  elementRef: HTMLElement | undefined

  constructor(element: ElementRef<HTMLElement>) {
    this.elementRef = element.nativeElement
  }

  ngOnInit(): void {
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
}
