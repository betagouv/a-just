import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core'

@Component({
  selector: 'aj-legend-label',
  templateUrl: './legend-label.component.html',
  styleUrls: ['./legend-label.component.scss'],
})
export class LegendLabelComponent implements OnInit {
  @ViewChild('circle') circle: HTMLElement

  @Input() dotColor: string = ''
  @Input() bgColor: string = ''
  constructor() {}

  ngOnInit(): void {
    this.circle.style.backgroundColor = 'red'
  }
}
