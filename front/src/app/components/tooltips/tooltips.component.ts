import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
} from '@angular/core'

/**
 * Composant de génération des tooltips
 */

@Component({
  selector: 'aj-tooltips',
  templateUrl: './tooltips.component.html',
  styleUrls: ['./tooltips.component.scss']
})
export class TooltipsComponent implements AfterViewInit {
  /**
   * Titre du tooltips
   */
  @Input() title: string = ''
  /**
   * Contenu du tooltips
   */
  @Input() content: string = ''
  /**
   * Footer du tooltips
   */
  @Input() footer: string = ''
  /**
   * Boolean de visibilité du tooltips
   */
  @Input() tooltipsIsVisible: boolean = false
  /**
   * Souris over l'élément cible
   */
  @Input() onOver: boolean = true
  /**
   * click sur l'élement HTML envoyé
   */
  @Input() onClick: HTMLElement | undefined
  /**
   * Variable tempo pour laisser un delai avant affichage du tooltips
   */
  timeoutBeforeShow: any = null

  /**
   * Constructeur
   * @param elementRef 
   */
  constructor(private elementRef: ElementRef) {}

  /**
   * A l'initialisation préparation des événements de type click ou mouse pour l'apparition du tooltips
   */
  ngOnInit() {
    if (this.onClick) {
      this.onClick.addEventListener('click', (e: any) => {
        this.tooltipsIsVisible = !this.tooltipsIsVisible
      })

      this.elementRef.nativeElement.addEventListener('mouseleave', (e: any) => {
        // this.tooltipsIsVisible = false
      })
    }
  }

  /**
   * Après rendu HTML écouter les éléments propre aux composants parent ou passé en input
   */
  ngAfterViewInit() {
    const parent = this.elementRef.nativeElement.parentElement
    if (parent && this.onOver) {
      parent?.style.setProperty('position', 'relative')
      parent?.addEventListener('mouseenter', (e: any) => {
        if (this.timeoutBeforeShow) {
          clearTimeout(this.timeoutBeforeShow)
        }

        this.timeoutBeforeShow = setTimeout(() => {
          this.timeoutBeforeShow = null
          this.tooltipsIsVisible = true
        }, 1500)
      })
      parent?.addEventListener('click', (e: any) => {
        if (this.timeoutBeforeShow) {
          clearTimeout(this.timeoutBeforeShow)
          this.timeoutBeforeShow = null
        }
      })
      parent?.addEventListener('mouseleave', (e: any) => {
        if (this.timeoutBeforeShow) {
          clearTimeout(this.timeoutBeforeShow)
          this.timeoutBeforeShow = null
        }

        this.tooltipsIsVisible = false
      })
      this.elementRef.nativeElement?.addEventListener('click', (e: any) => {
        e.stopPropagation()
      })
    }
  }
}
