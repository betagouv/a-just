import { Component, Input, OnInit } from '@angular/core'

@Component({
  selector: 'aj-figures-widget',
  templateUrl: './figures-widget.component.html',
  styleUrls: ['./figures-widget.component.scss'],
})
export class FiguresWidgetComponent implements OnInit {
  @Input() dateStart: string = ''
  @Input() dateStop: string = ''
  @Input() valueAt: string = ''
  @Input() valueProjected: string = ''
  @Input() valueSimulated: string = ''

  constructor() {}

  ngOnInit(): void {}
}
