import { Component, ElementRef, EventEmitter, HostBinding, inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core'
import { NgResizeObserver, ngResizeObserverProviders } from 'ng-resize-observer'
import { BehaviorSubject, map, Observable } from 'rxjs'
import { MainClass } from '../../../../libs/main-class'
import { UserService } from '../../../../services/user/user.service'
import { CalculatorService } from '../../../../services/calculator/calculator.service'
import { OPACITY_20 } from '../../../../constants/colors'
import { getRandomInt } from '../../../../utils/numbers'

/**
 * Composant de la page en vue analytique
 */

@Component({
  selector: 'aj-graphs-verticals-lines',
  standalone: true,
  imports: [],
  templateUrl: './graphs-verticals-lines.component.html',
  styleUrls: ['./graphs-verticals-lines.component.scss'],
  providers: [...ngResizeObserverProviders],
})
export class GraphsVerticalsLinesComponent extends MainClass implements OnInit, OnChanges, OnDestroy {
  /**
   * Service de gestion des utilisateurs
   */
  userService = inject(UserService)
  /**
   * Service de gestion de la taille
   */
  resize$ = inject(NgResizeObserver)
  /**
   * Service de gestion des calculs
   */
  calculatorService = inject(CalculatorService)
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
  @Input() maxValue: number | null = null
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
  width$: Observable<number> = this.resize$.pipe(map((entry) => entry.contentRect.width))
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
   * Wait serveur loading
   */
  isLoading: boolean = false
  /**
   * timeout
   */
  timeout: any
  /**
   * Local max value
   */
  localMaxValue: number = 100

  /**
   * Constructor
   */
  constructor() {
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
        //this.drawMultiple()
      }),
    )
    this.watch(this.line.subscribe(() => this.draw()))
    // Le composant est maintenant recharger complétement car il est détruit
    /*this.watch(
      this.calculatorService.dateStart.subscribe(() => this.clearDatas())
    )
    this.watch(
      this.calculatorService.dateStop.subscribe(() => this.clearDatas())
    )
    this.watch(
      this.calculatorService.selectedFonctionsIds.subscribe(() =>
        this.clearDatas()
      )
    )*/
  }

  /**
   * Suppression des observables lors de la suppression du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Changement des propriétés
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    this.updateLocalMaxValue()

    if (this.referentielName) {
      this.background = `linear-gradient(${this.userService.referentielMappingColorByInterface(this.referentielName, OPACITY_20)}, #ffffff)`
    }

    if (changes['referentielId'] && changes['referentielId'].currentValue !== changes['referentielId'].previousValue) {
      this.refreshDatas()
    }

    if (changes['showLines'] && changes['showLines'].currentValue && this.referentielId && this.type && this.line.getValue().length === 0) {
      this.startLoading()
    }

    if (changes['maxValue'] || changes['showLines']) {
      this.draw()
    }
  }

  /**
   * Met à jour la valeur maximale locale
   * @param force
   */
  updateLocalMaxValue(force = false) {
    if ((this.maxValue !== null && !force) || this.localMaxValue < (this.maxValue || 0)) {
      this.localMaxValue = this.maxValue || 0
    } else {
      const allValues: number[] = [...this.values, ...this.line.getValue()]
      this.localMaxValue = Math.max(...allValues) * 1.1
      this.updateMax.emit({ type: this.type, max: this.localMaxValue })
    }

    if (this.localMaxValue < (this.maxValue || 0)) {
      this.localMaxValue = this.maxValue || 0
    }
  }

  /**
   * Rafraîchit les données
   */
  refreshDatas() {
    this.line.next([])
    if (this.showLines && this.referentielId && this.type) {
      this.startLoading()
    }
  }

  /**
   * Efface les données
   */
  clearDatas() {
    this.line.next([])
    this.draw()
  }

  /**
   * Démarre le chargement
   */
  startLoading() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    this.timeout = setTimeout(() => {
      if (this.referentielId && this.type && !this.isLoading) {
        this.isLoading = true
        this.calculatorService.rangeValues(this.referentielId, this.type).then((lines) => {
          this.isLoading = false
          this.timeout = null
          this.line.next(lines.map((v: any) => (v && v.value ? +v.value : 0)))
          this.updateLocalMaxValue(true)
          this.draw()
        })
      }
    }, getRandomInt(700))
  }

  /**
   * Dessine les lignes
   */
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
          ctx.moveTo(0, this.height * (1 - line[0] / this.localMaxValue))
          for (let i = 1; i < line.length; i++) {
            ctx.lineTo(this.width * ((1 / (line.length - 1)) * i), this.height * (1 - line[i] / this.localMaxValue))
          }
          ctx.stroke()

          // Create path
          let region = new Path2D()
          region.moveTo(0, this.height * (1 - line[0] / this.localMaxValue))
          for (let i = 1; i < line.length; i++) {
            region.lineTo(this.width * ((1 / (line.length - 1)) * i), this.height * (1 - line[i] / this.localMaxValue))
          }
          region.lineTo(this.width, this.height)
          region.lineTo(0, this.height)
          region.closePath()

          // Fill path
          ctx.fillStyle = this.userService.referentielMappingColorByInterface(this.referentielName, 0.6)
          ctx.fill(region, 'evenodd')
        }
      }
    }
  }

  /**
   * Dessine les lignes multiples
   */
  drawMultiple() {
    const canvas = this.domCanvasMultiple?.nativeElement
    if (canvas && !this.isMultipleGraphPrinted && this.width) {
      this.isMultipleGraphPrinted = true

      canvas.width = this.width
      canvas.height = this.height
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, this.width * 200, this.height * 200)
      ctx.beginPath()

      if (this.referentielId && !this.isLoading) {
        this.isLoading = true
        this.graphs.map((g, index) => {
          this.calculatorService.rangeValues(this.referentielId || 0, g.type, g.dateStart, g.dateStop).then((line) => {
            line = line.map((v: any) => +v.value || 0)
            this.updateLocalMaxValue(true)
            this.isLoading = false

            ctx.strokeStyle = g.color
            ctx.lineWidth = 1
            ctx.moveTo(0, this.height * (1 - line[0] / this.localMaxValue))
            for (let i = 1; i < line.length; i++) {
              ctx.lineTo(this.width * ((1 / (line.length - 1)) * i), this.height * (1 - line[i] / this.localMaxValue))
            }
            ctx.stroke()

            for (let i = 1; i < line.length - 1; i++) {
              ctx.beginPath()
              ctx.fillStyle = index === 0 ? 'white' : g.color
              ctx.arc(this.width * ((1 / (line.length - 1)) * i), this.height * (1 - line[i] / this.localMaxValue), 2, 0, 2 * Math.PI)
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
