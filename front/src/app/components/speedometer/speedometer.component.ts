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
  bottomSpaceDegrees: number = 135;
  radius: number = 25;
  width: number = 55;

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
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#2aac5c';
    ctx.arc(
      this.width / 2 + 2,
      this.width / 2,
      this.radius,
      this.getRadiusPosition(120),
      this.getRadiusPosition(200)
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = '#ffe552';
    ctx.arc(
      this.width / 2 + 2,
      this.width / 2,
      this.radius,
      this.getRadiusPosition(80),
      this.getRadiusPosition(120)
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = '#ce0500';
    ctx.arc(
      this.width / 2 + 2,
      this.width / 2,
      this.radius,
      this.getRadiusPosition(0),
      this.getRadiusPosition(80)
    );
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

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.moveTo(this.radius + 4, this.radius * 1.25);
    ctx.lineTo(
      Math.cos(radiusAngle) * (this.radius * 0.8) + this.width / 2 + 2,
      Math.sin(radiusAngle) * (this.radius * 0.8) + this.width / 2
    );
    ctx.stroke();
  }

  getRadiusPosition(percent: number) {
    // calcul pro rata 100% = 160 degrees
    const degrees = (percent * (180 - this.bottomSpaceDegrees / 2)) / 100;
    return degreesToRadians(degrees + 90 + this.bottomSpaceDegrees / 2);
  }
}
