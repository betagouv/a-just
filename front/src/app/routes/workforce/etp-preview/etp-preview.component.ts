import { Component, Input } from '@angular/core';

@Component({
  selector: 'etp-preview',
  templateUrl: './etp-preview.component.html',
  styleUrls: ['./etp-preview.component.scss'],
})
export class EtpPreviewComponent {
  @Input() etp: number | undefined = 0;

  constructor() {}
}
