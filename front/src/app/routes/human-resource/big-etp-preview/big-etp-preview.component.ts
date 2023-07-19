import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  OnChanges,
} from '@angular/core'
import { GET_COLOR, RED_COLOR } from 'src/app/constants/colors'
import { ETP_NEED_TO_BE_UPDATED } from 'src/app/constants/referentiel'
import { degreesToRadians } from 'src/app/utils/geometry'
import { fixDecimal } from 'src/app/utils/numbers'

/**
 * Composant de prévisualisation des ETP
 */
@Component({
  selector: 'big-etp-preview',
  templateUrl: './big-etp-preview.component.html',
  styleUrls: ['./big-etp-preview.component.scss'],
})
export class BigEtpPreviewComponent implements OnChanges {
  /**
   * Valeure d'ETP
   */
  @Input() etp: number = 0
  /**
   * Total des indispo
   */
  @Input() indisponibility: number = 0
  /**
   * Largeur du composant
   */
  @Input() width: number = 84
  /**
   * Hauteur du composant
   */
  @Input() height: number = 84
  /**
   * Valeur de l'ETP réélement
   */
  @Input() realETP: number = 0
  /**
   * Dom HTML du canvas pour dessiner
   */
  @ViewChild('canvas') domCanvas: ElementRef | null = null
  /**
   * Marge d'espacement exterieur pour dessiner
   */
  margin: number = 8
  /**
   * Largeur de la bordure du dessin
   */
  borderWidth: number = 12
  /**
   * ETP need to be updated
   */
  warningETP: boolean = false

  /**
   * Constructeur
   */
  constructor() {}

  /**
   * Détection du changement de variable pour rédessiner
   */
  ngOnChanges() {
    this.warningETP = this.realETP === ETP_NEED_TO_BE_UPDATED

    const fixDec = fixDecimal(this.etp)
    this.etp = fixDec < 0 ? 0 : fixDec
    this.onDraw()
  }

  /**
   * Préparation d'espace du dessin
   */
  onDraw() {
    const ctx = this.domCanvas?.nativeElement.getContext('2d')
    if (ctx) {
      ctx.clearRect(
        0,
        0,
        this.width + this.margin * 2,
        this.height + this.margin * 2
      )
      this.generateBackground()
    } else {
      setTimeout(() => {
        this.onDraw()
      }, 200)
    }
  }

  /**
   * Génération des arcs de cercles du fond
   */
  generateBackground() {
    const canvas = this.domCanvas?.nativeElement
    const ctx = canvas.getContext('2d')

    // fix resolution of arc
    canvas.style.width = this.width + this.margin * 2 + 'px'
    canvas.style.height = this.height + this.margin * 2 + 'px'
    const scale = window.devicePixelRatio * 2
    canvas.width = Math.floor((this.width + this.margin * 2) * scale)
    canvas.height = Math.floor((this.height + this.margin * 2) * scale)
    ctx.scale(scale, scale)

    ctx.beginPath()
    ctx.lineCap = 'round'
    ctx.lineWidth = this.borderWidth
    ctx.strokeStyle = this.warningETP ? GET_COLOR(RED_COLOR, 0.2) : '#e3e3fd'
    ctx.arc(
      this.width / 2 + this.margin,
      this.height / 2 + this.margin,
      this.width / 2,
      this.getRadiusPosition(0),
      this.getRadiusPosition(100)
    )
    ctx.stroke()

    if (!this.warningETP) {
      ctx.beginPath()
      ctx.strokeStyle = '#e4794a'
      ctx.arc(
        this.width / 2 + this.margin,
        this.height / 2 + this.margin,
        this.width / 2,
        this.getRadiusPosition(0),
        this.getRadiusPosition((this.etp + this.indisponibility) * 100)
      )
      ctx.stroke()

      ctx.beginPath()
      ctx.strokeStyle = '#1dd884'
      ctx.arc(
        this.width / 2 + this.margin,
        this.height / 2 + this.margin,
        this.width / 2,
        this.getRadiusPosition(0),
        this.getRadiusPosition(this.etp * 100)
      )
      ctx.stroke()

      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.arc(
        this.margin,
        this.height / 2 + this.margin,
        this.borderWidth / 4,
        0,
        2 * Math.PI
      )

      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.moveTo(this.width + this.margin - 7, this.height / 2 + this.margin)
      ctx.lineTo(this.width + this.margin + 7, this.height / 2 + this.margin)
      ctx.strokeStyle = '#49835e'
      ctx.lineCap = 'round'
      ctx.stroke()

      ctx.beginPath()
      ctx.fillStyle = 'white'
      ctx.arc(8, 50, 3, 0, degreesToRadians(360))

      ctx.fill()
    }
  }

  /**
   * Conversion des degrées en Radius
   * @param degree
   * @returns
   */
  getRadiusPosition(degree: number) {
    return degreesToRadians(180 + degree * (180 / 100))
  }
}
