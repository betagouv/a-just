import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core'
import { NgResizeObserver, ngResizeObserverProviders } from 'ng-resize-observer'
import { BehaviorSubject, map, Observable } from 'rxjs'
import { MainClass } from 'src/app/libs/main-class'
import { CalculatorService } from 'src/app/services/calculator/calculator.service'
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
export class GraphsVerticalsLinesComponent
  extends MainClass
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  /**
   * Canvas sur lequel on va dessiner
   */
  @ViewChild('canvas') domCanvas: ElementRef | null = null
  /**
   * Canvas sur lequel on va dessiner
   */
  @ViewChild('canvasMultiple') domCanvasMultiple: ElementRef | null = null
  /**
   * Default ref id
   */
  @Input() referentielId: number | null = null
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
  @Input() showLines: boolean = false
  /**
   * Types values
   */
  @Input() type: string | undefined | null = ''
  /**
   * Types values
   */
  @Input() graphs: {
    type: string
    dateStart: Date
    dateStop: Date
    color: string
  }[] = []
  /**
   * Max values
   */
  @Input() maxValue: number = 100
  /**
   * Style background
   */
  @HostBinding('style.background') background: string = ''
  /**
   * Out
   */
  @Output() updateMax = new EventEmitter()
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
   * Get line
   */
  line: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([])
  /**
   * is multiple graph printed
   */
  isMultipleGraphPrinted: boolean = false

  /**
   * Constructor
   */
  constructor(
    public userService: UserService,
    private resize$: NgResizeObserver,
    private calculatorService: CalculatorService
  ) {
    super()
  }

  /**
   * A l'inialisation écouter la variable qui écoute la largeur
   */
  ngOnInit() {
    this.watch(
      this.width$.subscribe((w) => {
        this.width = w
        this.draw()
        this.drawMultiple()
      })
    )
    this.watch(this.line.subscribe(() => this.draw()))
    this.watch(
      this.calculatorService.dateStart.subscribe(() => this.refreshDatas())
    )
    this.watch(
      this.calculatorService.dateStop.subscribe(() => this.refreshDatas())
    )
  }

  ngAfterViewInit() {
    this.drawMultiple()
  }

  ngOnDestroy() {
    this.watcherDestroy()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.referentielName) {
      this.background = `linear-gradient(${this.userService.referentielMappingColorByInterface(
        this.referentielName,
        0.25
      )}, #ffffff)`
    }

    if (
      changes['referentielId'] &&
      changes['referentielId'].currentValue !==
        changes['referentielId'].previousValue
    ) {
      this.refreshDatas()
    }

    if (
      changes['showLines'] &&
      changes['showLines'].currentValue &&
      this.referentielId &&
      this.type &&
      this.line.getValue().length === 0
    ) {
      this.calculatorService
        .rangeValues(this.referentielId, this.type)
        .then((lines) => {
          this.line.next(lines)
        })
    }

    if (changes['maxValue'] || changes['showLines']) {
      this.draw()
    }
  }

  refreshDatas() {
    this.line.next([])
    if (this.showLines && this.referentielId && this.type) {
      this.calculatorService
        .rangeValues(this.referentielId, this.type)
        .then((lines) => {
          this.line.next(lines)
        })
    }
  }

  draw() {
    const canvas = this.domCanvas?.nativeElement
    if (canvas) {
      canvas.width = this.width
      canvas.height = this.height
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, this.width * 200, this.height * 200)

      if (this.showLines) {
        ctx.beginPath()

        const line: number[] = this.line.getValue().map((v) => v || 0)

        if (this.showLines && line.length >= 2) {
          this.updateMax.emit({ type: this.type, max: Math.max(...line) || 0 })

          ctx.strokeStyle = this.userService.referentielMappingColorByInterface(this.referentielName)
          ctx.setLineDash([2])
          ctx.lineWidth = 1
          ctx.moveTo(0, this.height * (1 - line[0] / this.maxValue))
          for (let i = 1; i < line.length; i++) {
            ctx.lineTo(
              this.width * ((1 / (line.length - 1)) * i),
              this.height * (1 - line[i] / this.maxValue)
            )
          }
          ctx.stroke()

          // Create path
          let region = new Path2D()
          region.moveTo(0, this.height * (1 - line[0] / this.maxValue))
          for (let i = 1; i < line.length; i++) {
            region.lineTo(
              this.width * ((1 / (line.length - 1)) * i),
              this.height * (1 - line[i] / this.maxValue)
            )
          }
          region.lineTo(this.width, this.height)
          region.lineTo(0, this.height)
          region.closePath()

          // Fill path
          ctx.fillStyle = this.userService.referentielMappingColorByInterface(
            this.referentielName,
            0.6
          )
          ctx.fill(region, 'evenodd')
        }
      }
    }
  }

  drawMultiple() {
    const canvas = this.domCanvasMultiple?.nativeElement
    if (canvas && !this.isMultipleGraphPrinted && this.width) {
      this.isMultipleGraphPrinted = true

      canvas.width = this.width
      canvas.height = this.height
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, this.width * 200, this.height * 200)
      ctx.beginPath()

      if (this.referentielId) {
        this.graphs.map((g, index) => {
          this.calculatorService
            .rangeValues(
              this.referentielId || 0,
              g.type,
              g.dateStart,
              g.dateStop
            )
            .then((line) => {
              line = line.map((v: any) => +v || 0)

              ctx.strokeStyle = g.color
              ctx.lineWidth = 1
              ctx.moveTo(0, this.height * (1 - line[0] / this.maxValue))
              for (let i = 1; i < line.length; i++) {
                ctx.lineTo(
                  this.width * ((1 / (line.length - 1)) * i),
                  this.height * (1 - line[i] / this.maxValue)
                )
              }
              ctx.stroke()

              for (let i = 1; i < line.length - 1; i++) {
                ctx.beginPath()
                ctx.fillStyle = index === 0 ? 'white' : g.color
                ctx.arc(
                  this.width * ((1 / (line.length - 1)) * i),
                  this.height * (1 - line[i] / this.maxValue),
                  2,
                  0,
                  2 * Math.PI
                )
                ctx.fill()
                if (index === 0) {
                  ctx.stroke()
                }
              }
            })
        })
      }

      /*const line: number[] = this.line.getValue().map((v) => v || 0)

      if (this.showLines && line.length >= 2) {
        this.updateMax.emit({ type: this.type, max: Math.max(...line) || 0 })

        ctx.strokeStyle = this.referentielMappingColor(this.referentielName)
        ctx.setLineDash([2])
        ctx.lineWidth = 1
        ctx.moveTo(0, this.height * (1 - line[0] / this.maxValue))
        for (let i = 1; i < line.length; i++) {
          ctx.lineTo(
            this.width * ((1 / (line.length - 1)) * i),
            this.height * (1 - line[i] / this.maxValue)
          )
        }
        ctx.stroke()

        // Create path
        let region = new Path2D()
        region.moveTo(0, this.height * (1 - line[0] / this.maxValue))
        for (let i = 1; i < line.length; i++) {
          region.lineTo(
            this.width * ((1 / (line.length - 1)) * i),
            this.height * (1 - line[i] / this.maxValue)
          )
        }
        region.lineTo(this.width, this.height)
        region.lineTo(0, this.height)
        region.closePath()

        // Fill path
        ctx.fillStyle = this.referentielMappingColor(this.referentielName, 0.6)
        ctx.fill(region, 'evenodd')
      }*/
    }
  }
}
