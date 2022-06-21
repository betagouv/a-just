import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core'
import { degreesToRadians } from 'src/app/utils/geometry'
import { animate, style, transition, trigger } from '@angular/animations'

@Component({
  selector: 'aj-coverage-preview',
  templateUrl: './coverage-preview.component.html',
  styleUrls: ['./coverage-preview.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 })),
      ]),
      transition(':leave', [animate(500, style({ opacity: 0 }))]),
    ]),
  ],
})
export class CoveragePreviewComponent implements OnInit, OnChanges {
  @ViewChild('canvas', { static: false })
  domCanvas: ElementRef<HTMLCanvasElement> | null = null

  @Input() oldCoverageRate: number | null = null
  @Input() coverageRate: number = 240
  @Input() width: number = 180
  @Input() height: number = 180
  margin: number = 35
  borderWidth: number = 12

  ngOnInit(): void {
    this.onDraw()
  }

  ngOnChanges(): void {
    this.onDraw()
  }

  onDraw(): void {
    const ctx = this.domCanvas?.nativeElement.getContext('2d')

    if (ctx) {
      ctx.clearRect(0, 0, this.width, this.height)
      this.generateBackground()
    } else {
      setTimeout(() => {
        this.onDraw()
      }, 0)
    }
  }

  generateBackground() {
    const canvas = this.domCanvas?.nativeElement as HTMLCanvasElement
    const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D

    let redValue = 0
    let yellowValue = 0
    let lightGreenValue = 0
    let GreenValue = 0

    let needleBorderColor = ''
    let needleColor = ''
    let endDotColor = ''
    if (this.coverageRate > 300) {
      GreenValue = 300
      needleBorderColor = '#309557d2'
      needleColor = '#45a96b'
      endDotColor = '#1dd884'
    } else if (this.coverageRate <= 300) {
      GreenValue = this.coverageRate
      needleBorderColor = '#309557d2'
      needleColor = '#45a96b'
      endDotColor = '#1dd884'
    } else GreenValue = 300

    if (this.coverageRate <= 210) {
      lightGreenValue = this.coverageRate
      needleBorderColor = '#2c9a69'
      needleColor = '#1dd884'
      endDotColor = '#60efaf'
    } else lightGreenValue = 210

    if (this.coverageRate <= 110) {
      yellowValue = this.coverageRate
      needleBorderColor = '#fdd90ab7'
      needleColor = '#f8df4fee'
      endDotColor = '#f0dd63ef'
    } else yellowValue = 110

    if (this.coverageRate <= 80) {
      redValue = this.coverageRate
      needleBorderColor = '#ce0300b7'
      needleColor = '#ce0300b7'
      endDotColor = '#f13a3787'
    } else redValue = 80

    // fix resolution of arc
    canvas.style.width = this.width + this.margin * 2 + 'px'
    canvas.style.height = this.height + this.margin * 2 + 'px'
    const scale = window.devicePixelRatio * 2
    canvas.width = Math.floor((this.width + this.margin * 2) * scale)
    canvas.height = Math.floor((this.height + this.margin * 2) * scale)
    ctx.scale(scale, scale)

    ctx.beginPath() // fill grey
    ctx.lineCap = 'round'
    ctx.lineWidth = this.borderWidth
    ctx.strokeStyle = '#e3e3fd'
    ctx.arc(
      this.width / 2 + this.margin,
      this.height / 2 + this.margin,
      this.width / 2,
      this.getRadiusPosition(0),
      this.getRadiusPosition(300)
    )
    ctx.stroke()

    ctx.beginPath() //vert
    ctx.strokeStyle = '#45a96b'
    ctx.arc(
      this.width / 2 + this.margin,
      this.height / 2 + this.margin,
      this.width / 2,
      this.getRadiusPosition(0),
      this.getRadiusPosition(GreenValue)
    )
    ctx.stroke()

    ctx.beginPath() //jaune vert
    ctx.strokeStyle = '#1dd884'
    ctx.arc(
      this.width / 2 + this.margin,
      this.height / 2 + this.margin,
      this.width / 2,
      this.getRadiusPosition(0),
      this.getRadiusPosition(lightGreenValue)
    )
    ctx.stroke()

    ctx.beginPath() //jaune
    ctx.strokeStyle = '#ffe552'
    ctx.arc(
      this.width / 2 + this.margin,
      this.height / 2 + this.margin,
      this.width / 2,
      this.getRadiusPosition(0),
      this.getRadiusPosition(yellowValue)
    )
    ctx.stroke()

    ctx.beginPath() // rouge
    ctx.strokeStyle = '#ce0500'
    ctx.arc(
      this.width / 2 + this.margin,
      this.height / 2 + this.margin,
      this.width / 2,
      this.getRadiusPosition(0),
      this.getRadiusPosition(redValue)
    )
    ctx.stroke()

    if (this.oldCoverageRate)
      this.drawPoint(
        ctx,
        this.oldCoverageRate,
        this.oldCoverageRate + '%',
        this.width / 2 + this.margin,
        this.height / 2 + this.margin,
        'grey'
      )

    if (this.coverageRate <= 300 && this.coverageRate >= 0) {
      ctx.translate(this.width / 2 + this.margin, this.height / 2 + this.margin)
      this.draw_aiguille(
        ctx,
        55,
        needleColor,
        needleBorderColor,
        this.coverageRate
      )
    } else if (this.coverageRate <= 0) {
      ctx.translate(this.width / 2 + this.margin, this.height / 2 + this.margin)
      this.draw_aiguille(ctx, 55, needleColor, needleBorderColor, 0)
    } else {
      ctx.translate(this.width / 2 + this.margin, this.height / 2 + this.margin)
      this.draw_aiguille(ctx, 55, needleColor, needleBorderColor, 300)
    }
  }

  getRadiusPosition(degree: number) {
    return degreesToRadians(180 + (degree * 9) / 10)
  }

  draw_aiguille(
    ctx: CanvasRenderingContext2D,
    lgd: number,
    cl_int: string,
    cl_bord: string,
    angle: number
  ) {
    ctx.rotate(degreesToRadians(270 + (angle * 9) / 10))

    ctx.beginPath()
    ctx.fillStyle = cl_int
    ctx.lineWidth = 2
    ctx.strokeStyle = cl_bord

    const cp1x = 8
    const cp1y = 12
    const cp2x = -8
    const cp2y = 12

    ctx.moveTo(7, 0)
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, -7, 0)
    ctx.lineTo(-3, -lgd)
    ctx.bezierCurveTo(-2, -lgd - 3, 2, -lgd - 3, 3, -lgd)
    ctx.lineTo(7, 0)
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
    ctx.rotate(-angle)
  }

  drawPoint(
    ctx: CanvasRenderingContext2D,
    coverageRatio: number,
    label: string,
    center_x: number,
    center_y: number,
    color: string
  ) {
    var radius = this.width / 2
    var point_size = this.borderWidth / 4
    var font_size = '20px'
    var x = center_x + radius * Math.cos(this.getRadiusPosition(coverageRatio))
    var y = center_y + radius * Math.sin(this.getRadiusPosition(coverageRatio))

    if (label === '') {
      ctx.beginPath()
      ctx.fillStyle = color
      ctx.lineWidth = 2
      ctx.strokeStyle = color
      ctx.arc(x, y, point_size, 0, 2 * Math.PI)

      ctx.fill()
    }
    if (label && coverageRatio <= 300 && coverageRatio >= 0) {
      ctx.fillStyle = color
      ctx.font = font_size
      if (coverageRatio <= 50) ctx.fillText(label, x - 30, y)
      else if (coverageRatio > 50 && coverageRatio <= 100)
        ctx.fillText(label, x - 30, y - 8)
      else if (coverageRatio > 100 && coverageRatio <= 200)
        ctx.fillText(label, x + 8, y - 7)
      else if (coverageRatio > 200 && coverageRatio <= 300)
        ctx.fillText(label, x + 8, y + 15)
      else ctx.fillText(label, x - 7, y - 10)
    }
  }
}
