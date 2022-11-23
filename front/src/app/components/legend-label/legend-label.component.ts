import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core'
import { RadioButtonComponent } from '../radio-button/radio-button.component'

@Component({
  selector: 'aj-legend-label',
  templateUrl: './legend-label.component.html',
  styleUrls: ['./legend-label.component.scss'],
})
export class LegendLabelComponent implements OnInit, OnChanges {
  @Input() title: string = ''
  @Input() dotColor: string = ''
  @Input() bgColor: string = ''
  @Input() label: string = ''
  @Input() disabledEl: boolean = false
  @Output() value = new EventEmitter()
  toogle = {
    label: '',
    checked: true,
  }

  elementRef: HTMLElement | undefined
  constructor(element: ElementRef<HTMLElement>) {
    this.elementRef = element.nativeElement
  }

  ngOnInit(): void {
    if (this.disabledEl === true) this.toogle.checked = !this.toogle.checked
  }

  ngOnChanges(): void {
    const circleElement = (
      this.elementRef!.getElementsByClassName(
        'circle'
      ) as HTMLCollectionOf<HTMLElement>
    )[0]
    circleElement.style.backgroundColor = this.dotColor
    const mainElement = (
      this.elementRef!.getElementsByClassName(
        'container'
      ) as HTMLCollectionOf<HTMLElement>
    )[0]

    mainElement.style.backgroundColor = this.bgColor
    const contenteElement = (
      this.elementRef!.getElementsByClassName(
        'label'
      ) as HTMLCollectionOf<HTMLElement>
    )[0]
    contenteElement.innerHTML = this.label
  }

  updateValue(event: any) {
    this.toogle = event
    this.value.emit(event)
  }

  clicked() {
    this.toogle.checked = !this.toogle.checked
    this.value.emit(this.toogle)
  }
}
