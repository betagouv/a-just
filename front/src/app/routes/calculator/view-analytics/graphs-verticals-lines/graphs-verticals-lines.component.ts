import { Component, ElementRef, HostBinding, Input, OnChanges, ViewChild } from '@angular/core'
import { NgResizeObserver, ngResizeObserverProviders } from 'ng-resize-observer'
import { map, Observable } from 'rxjs'
import { MainClass } from 'src/app/libs/main-class'
import { UserService } from 'src/app/services/user/user.service'

/**
 * Composant de la page en vue analytique
 */

@Component({
  selector: 'aj-graphs-verticals-lines',
  templateUrl: './graphs-verticals-lines.component.html',
  styleUrls: ['./graphs-verticals-lines.component.scss'],
  providers: [...ngResizeObserverProviders],
})
export class GraphsVerticalsLinesComponent extends MainClass implements OnChanges {
  /**
   * Canvas sur lequel on va dessiner
   */
  @ViewChild('canvas') domCanvas: ElementRef | null = null
  /**
   * Default ref name
   */
  @Input() referentielName: string = ''
  /**
   * Values
   */
  @Input() values: number[] = []
  /**
   * Values
   */
  @Input() line: number[] | null = null
  /**
   * Max values
   */
  @Input() maxValue: number = 100
  /**
   * Style background
   */
  @HostBinding('style.background') background: string = ''
  /**
   * Degres of inclinaison
   */
  percentDelta: number = 0
  /**
 * Variable d'écoute de la largeur dynamique
 */
  width$: Observable<number> = this.resize$.pipe(
    map((entry) => entry.contentRect.width)
  )
  /**
   * Current width
   */
  width: number = 0
  /**
   * Current height
   */
  height: number = 138

  /**
   * Constructor
   */
  constructor(
    public userService: UserService,
    private resize$: NgResizeObserver
  ) {
    super()
  }

  /**
   * A l'inialisation écouter la variable qui écoute la largeur
   */
  ngOnInit() {
    this.watch(this.width$.subscribe((w) => { this.width = w; this.draw() }))
  }

  ngOnChanges() {
    if (this.referentielName) {
      this.background = `linear-gradient(${this.referentielMappingColor(this.referentielName, 0.25)}, #ffffff)`
    }

    this.draw();
  }

  draw() {
    const canvas = this.domCanvas?.nativeElement
    if (canvas) {
      canvas.width = this.width
      canvas.height = this.height
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, this.width * 200, this.height * 200)
      ctx.beginPath()

      if (this.line && this.line.length === 2) {
        ctx.strokeStyle = this.referentielMappingColor(this.referentielName)
        ctx.setLineDash([2])
        ctx.lineWidth = 1
        ctx.moveTo(0, this.height * (1 - (this.line[0] / this.maxValue)))
        ctx.lineTo(
          this.width * 0.5,
          this.height * (1 - (this.values[0] / this.maxValue))
        )
        ctx.lineTo(
          this.width,
          this.height * (1 - (this.line[1] / this.maxValue))
        )
        ctx.stroke()

        // Create path
        let region = new Path2D();
        region.moveTo(0, this.height * (1 - (this.line[0] / this.maxValue)));
        region.lineTo(this.width * 0.5,
          this.height * (1 - (this.values[0] / this.maxValue)));
        region.lineTo(this.width,
          this.height * (1 - (this.line[1] / this.maxValue)));
        region.lineTo(this.width, this.height);
        region.lineTo(0, this.height);
        region.closePath();

        // Fill path
        ctx.fillStyle = this.referentielMappingColor(this.referentielName, 0.6)
        ctx.fill(region, "evenodd");
      }
    }
  }
}
