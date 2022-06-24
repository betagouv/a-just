import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core'

@Component({
  selector: 'aj-legend-label',
  templateUrl: './legend-label.component.html',
  styleUrls: ['./legend-label.component.scss'],
})
export class LegendLabelComponent implements OnInit, OnChanges {
  @Input() dotColor: string = ''
  @Input() bgColor: string = ''
  @Input() label: string = ''
  elementRef: HTMLElement | undefined
  constructor(element: ElementRef<HTMLElement>) {
    this.elementRef = element.nativeElement
  }

  ngOnInit(): void {}
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
}
