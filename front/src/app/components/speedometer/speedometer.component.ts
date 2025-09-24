import { Component, ElementRef, HostBinding, inject, Input, OnInit, ViewChild } from '@angular/core'
import { ngResizeObserverProviders, NgResizeObserver } from 'ng-resize-observer'
import { map, Observable } from 'rxjs'
import { MainClass } from '../../libs/main-class'
import { TooltipsComponent } from '../tooltips/tooltips.component'
import { CommonModule } from '@angular/common'
import { degreesToRadians } from '../../utils/geometry'
/**
 * Rose : #E64B85
Vert : #00B252 
Bleu : #2D46E0
Jaune : #F7F02D
Gris : #999999

Rouge logo A-JUST : #FF0000
 */

const convertWidthToheight = (width: number) => (width * 55) / 70

/**
 * Composant affichant un cadran de 0 à 200%
 */

@Component({
  selector: 'aj-speedometer',
  standalone: true,
  imports: [TooltipsComponent, CommonModule],
  templateUrl: './speedometer.component.html',
  styleUrls: ['./speedometer.component.scss'],
  providers: [...ngResizeObserverProviders],
})
export class SpeedometerComponent extends MainClass implements OnInit {
  resize$ = inject(NgResizeObserver)
  /**
   * Pourcentage affiché
   */
  @Input() percent: number | null = null
  /**
   * automatic resize component
   */
  @Input() autoResize: boolean = true
  /**
   * Canvas sur lequel on va dessiner
   */
  @ViewChild('canvas') domCanvas: ElementRef | null = null
  /**
   * Connection au style de la haute du composant
   */
  @HostBinding('style.height') styleHeight: string = ''
  /**
   * Paramétrage du mode sombre
   */
  @Input() @HostBinding('class.dark-mode') classDarkMode: boolean = false
  /**
   * Ecoute la valeur du forcing de couleur bleu
   */
  @Input() @HostBinding('class.text-blue') classTextBlue: boolean = false
  /**
   * Variable d'écoute de la largeur dynamique
   */
  width$: Observable<number> = this.resize$.pipe(map((entry) => entry.contentRect.width))
  /**
   * Position 0% en degré
   */
  bottomSpaceDegrees: number = 135
  /**
   * Rayon du cercle
   */
  radius: number = 25
  /**
   * Largeur du composant
   */
  width: number = 55
  /**
   * Largeur du dessin
   */
  canvasWidth: number = 55 - 4
  /**
   * Conversion d'un pourcent en stfing
   */
  percentString: string = ''
  /**
   * Epaisseur du trai du cercle
   */
  lineWidth: number = 4

  /**
   * Constructeur
   * @param resize$
   */
  constructor() {
    super()
  }

  /**
   * A l'inialisation écouter la variable qui écoute la largeur
   */
  ngOnInit() {
    this.watch(this.width$.subscribe((w) => this.prepareComponent(w)))
  }

  /**
   * Après le rendu HTML, dessiner
   */
  ngAfterViewInit() {
    this.onDraw()
  }

  /**
   * Ecoute de la variable pourcent puis redessiner
   */
  ngOnChanges() {
    this.percentString = this.percent === null || isNaN(this.percent) ? 'N/R' : Math.floor(this.percent) + '%'
    this.onDraw()
  }

  /**
   * A la suppression du composant supprimer les watcher
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Réadapter la taille des éléments en fonction de la largeur dispo au composant
   * @param width Largeur disponible au composant
   */
  prepareComponent(width: number) {
    if (this.autoResize) {
      this.styleHeight = convertWidthToheight(width) + 'px'
      this.width = convertWidthToheight(width)
      this.onDraw()
    }
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
      canvas.style.width = this.width + 'px'
      canvas.style.height = this.width + 'px'
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
      this.getRadiusPosition(200),
    )
    ctx.stroke()
    ctx.beginPath()
    ctx.strokeStyle = '#ffe552'
    ctx.arc(
      this.canvasWidth / 2 + this.lineWidth / 2,
      this.canvasWidth / 2 + this.lineWidth / 2,
      this.radius,
      this.getRadiusPosition(80),
      this.getRadiusPosition(120),
    )
    ctx.stroke()
    ctx.beginPath()
    ctx.strokeStyle = '#ce0500'
    ctx.arc(
      this.canvasWidth / 2 + this.lineWidth / 2,
      this.canvasWidth / 2 + this.lineWidth / 2,
      this.radius,
      this.getRadiusPosition(0),
      this.getRadiusPosition(80),
    )
    ctx.stroke()
  }

  /**
   * Génération de la fléche. C'est le seul élement qui bouge
   */
  drawArrows() {
    const ctx = this.domCanvas?.nativeElement.getContext('2d')
    ctx.beginPath()
    if (this.percent !== null) {
      let percent = this.percent || 0
      if (percent < 0) {
        percent = 0
      } else if (percent > 200) {
        percent = 200
      }
      const radiusAngle = this.getRadiusPosition(percent)

      ctx.strokeStyle = this.classTextBlue ? '#0063cb' : this.classDarkMode ? 'white' : 'black'
      ctx.lineWidth = 1
      ctx.moveTo(this.canvasWidth / 2 + this.lineWidth / 2, this.canvasWidth / 2 + this.lineWidth / 2)
      ctx.lineTo(
        Math.cos(radiusAngle) * (this.radius * 0.8) + this.canvasWidth / 2 + this.lineWidth / 2,
        Math.sin(radiusAngle) * (this.radius * 0.8) + this.canvasWidth / 2 + this.lineWidth / 2,
      )
      ctx.stroke()
    }
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
