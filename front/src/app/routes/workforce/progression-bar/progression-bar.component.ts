import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'progression-bar',
  templateUrl: './progression-bar.component.html',
  styleUrls: ['./progression-bar.component.scss'],
})
export class ProgressionBarComponent {
  @Input() percent: number | undefined = 0;
  @Input() color: string = '#005500';
  @Input() enable: boolean = true;
  @Output() percentChange: EventEmitter<number> = new EventEmitter()

  constructor() {}

  changePercent() {
    const newPercent = prompt('Nouveau pourcentage ?', ''+((this.percent || 0) * 100))
    
    const valueFormated = parseInt(newPercent || '')
    if(valueFormated && valueFormated !== NaN) {
      this.percent = valueFormated / 100
      this.percentChange.emit(this.percent)
    }
  }
}
