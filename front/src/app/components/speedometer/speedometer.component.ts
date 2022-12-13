import { Component, ElementRef, HostBinding, Input, OnInit, ViewChild } from '@angular/core'
import { degreesToRadians } from 'src/app/utils/geometry'
import { ngResizeObserverProviders, NgResizeObserver } from 'ng-resize-observer'
import { map, Observable } from 'rxjs'
import { MainClass } from 'src/app/libs/main-class'
/**
 * Rose : #E64B85
Vert : #00B252 
Bleu : #2D46E0
Jaune : #F7F02D
Gris : #999999

Rouge logo A-JUST : #FF0000
 */

const convertWidthToheight = (width: number) => (width * 55 / 70)

@Component({
  selector: 'aj-speedometer',
  templateUrl: './speedometer.component.html',
  styleUrls: ['./speedometer.component.scss'],
  providers: [...ngResizeObserverProviders],
})
export class SpeedometerComponent extends MainClass implements OnInit {
  @Input() percent: number = 0
  @ViewChild('canvas') domCanvas: ElementRef | null = null
  @HostBinding('style.height') styleHeight: string = ''
  @Input() @HostBinding('class.dark-mode') classDarkMode: boolean = false
  width$: Observable<number> = this.resize$.pipe(
    map((entry) => entry.contentRect.width)
  )
  bottomSpaceDegrees: number = 135
  radius: number = 25
  width: number = 55
  canvasWidth: number = 55 - 4
  percentString: number = 0
  lineWidth: number = 4

  constructor(private resize$: NgResizeObserver) {
    super()
  }

  ngOnInit() {
    this.watch(this.width$.subscribe((w) => this.prepareComponent(w)))
  }

  ngAfterViewInit() {
    this.onDraw()
  }

  ngOnChanges() {
    this.percentString = Math.floor(this.percent)

    this.onDraw()
  }

  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Réadapter la taille des éléments en fonction de la largeur dispo au composant
   * @param width Largeur disponible au composant
   */
  prepareComponent(width: number) {
    this.styleHeight = convertWidthToheight(width)+'px'
    this.width = convertWidthToheight(width)
    this.onDraw()
  }

  /**
   * Préparation de l'espace nécéssaire au canvas
   */
  onDraw() {
    const canvas = this.domCanvas?.nativeElement
    if (canvas) {
      this.lineWidth = this.width * 0.08
      this.canvasWidth = this.width - this.lineWidth
      this.radius = this.canvasWidth / 2 - this.lineWidth / 2
      canvas.width = this.width
      canvas.height = this.width
      canvas.style.width = this.width+'px'
      canvas.style.height = this.width+'px'
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, this.width, this.width)
      this.generateBackground()
      this.drawArrows()
    }
  }

  /**
   * Génération du fond avec les 3 niveaux de couleurs
   */
  generateBackground() {
    const ctx = this.domCanvas?.nativeElement.getContext('2d')
    ctx.beginPath()
    ctx.lineCap = 'round'
    ctx.lineWidth = this.lineWidth
    ctx.strokeStyle = '#2aac5c'
    ctx.arc(
      this.canvasWidth / 2 + this.lineWidth / 2,
      this.canvasWidth / 2 + this.lineWidth / 2,
      this.radius,
      this.getRadiusPosition(120),
      this.getRadiusPosition(200)
    )
    ctx.stroke()
    ctx.beginPath()
    ctx.strokeStyle = '#ffe552'
    ctx.arc(
      this.canvasWidth / 2 + this.lineWidth / 2,
      this.canvasWidth / 2 + this.lineWidth / 2,
      this.radius,
      this.getRadiusPosition(80),
      this.getRadiusPosition(120)
    )
    ctx.stroke()
    ctx.beginPath()
    ctx.strokeStyle = '#ce0500'
    ctx.arc(
      this.canvasWidth / 2 + this.lineWidth / 2,
      this.canvasWidth / 2 + this.lineWidth / 2,
      this.radius,
      this.getRadiusPosition(0),
      this.getRadiusPosition(80)
    )
    ctx.stroke()
  }

  /**
   * Génération de la fléche. C'est le seul élement qui bouge
   */
  drawArrows() {
    const ctx = this.domCanvas?.nativeElement.getContext('2d')
    ctx.beginPath()
    let percent = this.percent
    if (percent < 0) {
      percent = 0
    } else if (percent > 200) {
      percent = 200
    }
    const radiusAngle = this.getRadiusPosition(percent)

    ctx.strokeStyle = this.classDarkMode ? 'white' : 'black'
    ctx.lineWidth = 1
    ctx.moveTo(this.canvasWidth / 2 + this.lineWidth / 2, this.canvasWidth / 2 + this.lineWidth / 2)
    ctx.lineTo(
      Math.cos(radiusAngle) * (this.radius * 0.8) + this.canvasWidth / 2 + this.lineWidth / 2,
      Math.sin(radiusAngle) * (this.radius * 0.8) + this.canvasWidth / 2 + this.lineWidth / 2
    )
    ctx.stroke()
  }

  /**
   * Conversion d'un pourcentage en degrées
   * @param percent Pourcentage affiché dans l'interface donc varie entre 0 et 200% environ
   * @returns Radius number
   */
  getRadiusPosition(percent: number) {
    // calcul pro rata 100% = 160 degrees
    const degrees = (percent * (180 - this.bottomSpaceDegrees / 2)) / 100
    return degreesToRadians(degrees + 90 + this.bottomSpaceDegrees / 2)
  }
}
