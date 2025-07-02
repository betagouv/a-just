import { CommonModule } from '@angular/common'
import { Component, ElementRef, Input, ViewChild, OnChanges } from '@angular/core'
import { ETP_NEED_TO_BE_UPDATED } from '../../constants/referentiel'
import { fixDecimal } from '../../utils/numbers'
import { degreesToRadians } from '../../utils/geometry'

/**
 * Composant de prévisualisation des ETP
 */
@Component({
  selector: 'etp-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './etp-preview.component.html',
  styleUrls: ['./etp-preview.component.scss'],
})
export class EtpPreviewComponent implements OnChanges {
  /**
   * Valeure réel de l'ETP
   */
  @Input() realETP: number | undefined | null
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
  @Input() width: number = 40
  /**
   * Hauteur du composant
   */
  @Input() height: number = 40
  /**
   * Force to red alert if not ETPT
   */
  @Input() forceAlert: boolean = false
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
  borderWidth: number = 6
  /**
   * This ETP need to be updated
   */
  needToBeUpdated: boolean = false

  /**
   * Constructeur
   */
  constructor() {}

  /**
   * Détection du changement de variable pour rédessiner
   */
  ngOnChanges() {
    this.needToBeUpdated = ETP_NEED_TO_BE_UPDATED === this.realETP
    if ((this.realETP === 0 && this.forceAlert) || this.realETP === null) {
      this.needToBeUpdated = true
    }

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
      ctx.clearRect(0, 0, this.width + this.margin * 2, this.height + this.margin * 2)

      if (!this.needToBeUpdated) {
        this.generateBackground()
      }
    } else {
      setTimeout(() => {
        if (!this.needToBeUpdated) {
          this.onDraw()
        }
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
    ctx.strokeStyle = '#e3e3fd'
    ctx.arc(this.width / 2 + this.margin, this.height / 2 + this.margin, this.width / 2, this.getRadiusPosition(0), this.getRadiusPosition(100))
    ctx.stroke()
    ctx.beginPath()
    ctx.strokeStyle = '#e4794a'
    ctx.arc(
      this.width / 2 + this.margin,
      this.height / 2 + this.margin,
      this.width / 2,
      this.getRadiusPosition(0),
      this.getRadiusPosition((this.etp + this.indisponibility) * 100),
    )
    ctx.stroke()
    ctx.beginPath()
    ctx.strokeStyle = '#1dd884'
    ctx.arc(this.width / 2 + this.margin, this.height / 2 + this.margin, this.width / 2, this.getRadiusPosition(0), this.getRadiusPosition(this.etp * 100))
    ctx.stroke()

    ctx.beginPath()
    ctx.fillStyle = '#ffffff'
    ctx.arc(this.margin, this.height / 2 + this.margin, this.borderWidth / 4, 0, 2 * Math.PI)

    ctx.beginPath()
    ctx.lineWidth = 2
    ctx.moveTo(this.width + this.margin - 4, this.height / 2 + this.margin)
    ctx.lineTo(this.width + this.margin + 4, this.height / 2 + this.margin)
    ctx.strokeStyle = '#49835e'
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.fill()
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
