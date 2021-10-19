import { Component, Input } from '@angular/core';

@Component({
  selector: 'progression-bar',
  templateUrl: './progression-bar.component.html',
  styleUrls: ['./progression-bar.component.scss'],
})
export class ProgressionBarComponent {
  @Input() percent: number | undefined = 0.5;
  @Input() color: string = '#005500';
  @Input() enable: boolean = true;

  constructor() {}
}
