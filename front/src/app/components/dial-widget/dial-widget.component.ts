import { Component, Input, OnInit } from '@angular/core'

@Component({
  selector: 'aj-dial-widget',
  templateUrl: './dial-widget.component.html',
  styleUrls: ['./dial-widget.component.scss'],
})
export class DialWidgetComponent implements OnInit {
  @Input() dateStart: string = ''
  @Input() dateStop: string = ''
  @Input() valueProjected: string = ''
  @Input() valueSimulated: string = ''
  selectedSituation = 'simulated'

  constructor() {}

  ngOnInit(): void {}
}
