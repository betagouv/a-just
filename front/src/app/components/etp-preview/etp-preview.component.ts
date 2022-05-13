import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  OnChanges,
} from '@angular/core';
import { degreesToRadians } from 'src/app/utils/geometry';
import { fixDecimal } from 'src/app/utils/numbers';

@Component({
  selector: 'etp-preview',
  templateUrl: './etp-preview.component.html',
  styleUrls: ['./etp-preview.component.scss'],
})
export class EtpPreviewComponent implements OnChanges {
  @Input() etp: number = 0;
  @Input() indisponibility: number = 0;
  @Input() width: number = 40;
  @Input() height: number = 40;
  @ViewChild('canvas') domCanvas: ElementRef | null = null;
  margin: number = 8;
  borderWidth: number = 6;

  constructor() {}

  ngOnChanges() {
    const fixDec = fixDecimal(this.etp);
    this.etp = fixDec < 0 ? 0 : fixDec;
    this.onDraw();
  }

  onDraw() {
    const ctx = this.domCanvas?.nativeElement.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.width + this.margin * 2, this.height + this.margin * 2);
      this.generateBackground();
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
    canvas.style.width = (this.width + this.margin * 2) + "px";
    canvas.style.height = (this.height + this.margin * 2) + "px";
    const scale = window.devicePixelRatio * 2;
    canvas.width = Math.floor((this.width + this.margin * 2) * scale);
    canvas.height = Math.floor((this.height + this.margin * 2) * scale);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineWidth = this.borderWidth;
    ctx.strokeStyle = '#e3e3fd';
    ctx.arc(
      this.width / 2 + this.margin,
      this.height / 2 + this.margin,
      this.width / 2,
      this.getRadiusPosition(0),
      this.getRadiusPosition(100)
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = '#e4794a';
    ctx.arc(
      this.width / 2 + this.margin,
      this.height / 2 + this.margin,
      this.width / 2,
      this.getRadiusPosition(0),
      this.getRadiusPosition((this.etp + this.indisponibility) * 100)
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = '#1dd884';
    ctx.arc(
      this.width / 2 + this.margin,
      this.height / 2 + this.margin,
      this.width / 2,
      this.getRadiusPosition(0),
      this.getRadiusPosition(this.etp * 100)
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(
      this.margin,
      this.height / 2 + this.margin,
      this.borderWidth / 4,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }

  getRadiusPosition(degree: number) {
    return degreesToRadians(180 + degree * (180 / 100));
  }
}
