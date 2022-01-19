import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  OnChanges,
} from '@angular/core';
import { degreesToRadians } from 'src/app/utils/geometry';

@Component({
  selector: 'etp-preview',
  templateUrl: './etp-preview.component.html',
  styleUrls: ['./etp-preview.component.scss'],
})
export class EtpPreviewComponent implements OnChanges {
  @Input() etp: number = 0;
  @Input() indisponibility: number = 0;
  @ViewChild('canvas') domCanvas: ElementRef | null = null;
  width: number = 80;
  height: number = 45;

  constructor() {}

  ngOnChanges() {
    this.onDraw();
  }

  onDraw() {
    const ctx = this.domCanvas?.nativeElement.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.width, this.width);
      this.generateBackground();
      // this.drawArrows();
    } else {
      setTimeout(() => {
        this.onDraw();
      }, 200);
    }
  }

  generateBackground() {
    const canvas = this.domCanvas?.nativeElement;
    const ctx = canvas.getContext('2d');

    // fix resolution of arc
    canvas.style.width = this.width + "px";
    canvas.style.height = this.height + "px";
    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(this.width * scale);
    canvas.height = Math.floor(this.height * scale);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#e3e3fd';
    ctx.arc(
      this.width / 2,
      this.height - 5,
      this.width / 2 - 3,
      this.getRadiusPosition(0),
      this.getRadiusPosition(100)
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = '#ffbab2';
    ctx.arc(
      this.width / 2,
      this.height - 5,
      this.width / 2 - 3,
      this.getRadiusPosition(0),
      this.getRadiusPosition((this.etp + this.indisponibility) * 100)
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = '#6a6af4';
    ctx.arc(
      this.width / 2,
      this.height - 5,
      this.width / 2 - 3,
      this.getRadiusPosition(0),
      this.getRadiusPosition(this.etp * 100)
    );
    ctx.stroke();
  }

  getRadiusPosition(degree: number) {
    return degreesToRadians(180 + degree * (180 / 100));
  }
}
