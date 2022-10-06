import { Component, EventEmitter, Input, Output } from '@angular/core'

@Component({
  selector: 'progression-bar',
  templateUrl: './progression-bar.component.html',
  styleUrls: ['./progression-bar.component.scss'],
})
export class ProgressionBarComponent {
  @Input() percent: number | undefined = 0
  @Input() color: string = '#005500'
  @Input() enable: boolean = true
  @Input() selected: boolean = true
  @Output() percentChange: EventEmitter<number> = new EventEmitter()

  constructor() {}

  changePercent() {
    if (this.selected) {
      const newPercent = prompt(
        'Nouveau pourcentage ?',
        '' + (this.percent || 0)
      )

      const valueFormated =
        parseFloat((newPercent || '').replace(/,/, '.')) || 0
      this.percent = valueFormated
      this.percentChange.emit(this.percent)
    }
  }
}
