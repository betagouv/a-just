import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { degreesToRadians } from 'src/app/utils/geometry';
/**
 * Rose : #E64B85
Vert : #00B252 
Bleu : #2D46E0
Jaune : #F7F02D
Gris : #999999

Rouge logo A-JUST : #FF0000
 */

@Component({
  selector: 'aj-speedometer',
  templateUrl: './speedometer.component.html',
  styleUrls: ['./speedometer.component.scss'],
})
export class SpeedometerComponent implements OnInit {
  @Input() percent: number = 0;
  @ViewChild('canvas') domCanvas: ElementRef | null = null;
  bottomSpaceDegrees: number = 50;
  radius: number = 75;
  width: number = 200;

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.onDraw();
  }

  ngOnChanges() {
    this.onDraw();
  }

  onDraw() {
    const ctx = this.domCanvas?.nativeElement.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.width, this.width);
      this.generateBackground();
      this.drawArrows();
    }
  }

  generateBackground() {
    const ctx = this.domCanvas?.nativeElement.getContext('2d');
    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#FF0000';
    ctx.arc(
      this.width / 2,
      this.width / 2,
      this.radius,
      this.getRadiusPosition(0),
      this.getRadiusPosition(90)
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = '#F7F02D';
    ctx.arc(
      this.width / 2,
      this.width / 2,
      this.radius,
      this.getRadiusPosition(90),
      this.getRadiusPosition(110)
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = '#00B252';
    ctx.arc(
      this.width / 2,
      this.width / 2,
      this.radius,
      this.getRadiusPosition(110),
      this.getRadiusPosition(200)
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = 'orange';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.arc(this.width / 2, this.width / 2, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  drawArrows() {
    const ctx = this.domCanvas?.nativeElement.getContext('2d');
    ctx.beginPath();
    let percent = this.percent;
    if(percent < 0) {
      percent = 0;
    } else if(percent > 200) {
      percent = 200;
    }
    const radiusAngle = this.getRadiusPosition(percent);

    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 3;
    ctx.moveTo(100, 100);
    ctx.lineTo(
      Math.cos(radiusAngle) * this.radius + this.width / 2,
      Math.sin(radiusAngle) * this.radius + this.width / 2
    );
    ctx.stroke();
  }

  getRadiusPosition(percent: number) {
    // calcul pro rata 100% = 160 degrees
    const degrees = (percent * (180 - this.bottomSpaceDegrees / 2)) / 100;
    return degreesToRadians(degrees + 90 + this.bottomSpaceDegrees / 2);
  }
}
