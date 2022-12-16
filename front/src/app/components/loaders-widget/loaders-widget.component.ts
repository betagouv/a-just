import { Component, Input, OnChanges, OnInit } from '@angular/core'

@Component({
  selector: 'aj-loaders-widget',
  templateUrl: './loaders-widget.component.html',
  styleUrls: ['./loaders-widget.component.scss'],
})
export class LoadersWidgetComponent implements OnInit, OnChanges {
  @Input() dateStart: string = ''
  @Input() dateStop: string = ''
  @Input() valueAt: string = ''
  @Input() valueProjected: string = ''
  @Input() valueSimulated: string = ''
  valueBar1 = 100
  valueBar2 = 100

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.valueAt !== '') {
      const delta =
        ((parseFloat(this.valueAt.split(' ')[0]) -
          parseFloat(this.valueProjected.split(' ')[0])) /
          parseFloat(this.valueAt.split(' ')[0])) *
        100
      this.valueBar1 = delta <= 100 && delta >= 0 ? delta : 0
    }
    if (this.valueSimulated !== '') {
      const delta =
        ((parseFloat(this.valueAt.split(' ')[0]) -
          parseFloat(this.valueSimulated.split(' ')[0])) /
          parseFloat(this.valueAt.split(' ')[0])) *
        100
      this.valueBar2 = delta <= 100 && delta >= 0 ? delta : 0
    }
  }
}
