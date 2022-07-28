import { animate, style, transition, trigger } from '@angular/animations'
import { Component, Input, OnInit } from '@angular/core'

@Component({
  selector: 'aj-dial-widget',
  templateUrl: './dial-widget.component.html',
  styleUrls: ['./dial-widget.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 })),
      ]),
      transition(':leave', [animate(500, style({ opacity: 0 }))]),
    ]),
  ],
})
export class DialWidgetComponent implements OnInit {
  @Input() dateStart: string = ''
  @Input() dateStop: string = ''
  @Input() valueProjected: string = ''
  @Input() valueSimulated: string = ''
  selectedSituation = 'simulated'

  constructor() {}

  ngOnInit(): void {}

  toNumber(str: string): number {
    return parseInt(str)
  }

  permuteValues() {
    const tmpVal = String(this.valueProjected)
    this.valueProjected = this.valueSimulated
    this.valueSimulated = tmpVal
  }
}
