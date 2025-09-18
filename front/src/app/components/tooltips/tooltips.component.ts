import { AfterViewInit, Component, ElementRef, inject, Input } from '@angular/core'
import { v4 as uuidv4 } from 'uuid'
import { AppService } from '../../services/app/app.service'
import { CommonModule } from '@angular/common'
import { MatIconModule } from '@angular/material/icon'
import { SanitizeHtmlPipe } from '../../pipes/sanitize-html/sanitize-html.pipe'

/**
 * Composant de génération des tooltips
 */
@Component({
  selector: 'aj-tooltips',
  standalone: true,
  imports: [CommonModule, MatIconModule, SanitizeHtmlPipe],
  templateUrl: './tooltips.component.html',
  styleUrls: ['./tooltips.component.scss'],
})
export class TooltipsComponent implements AfterViewInit {
  /**
   * ElementRef
   */
  elementRef = inject(ElementRef)
  /**
   * AppService
   */
  appService = inject(AppService)
  /** ID unique */
  @Input() id: string = uuidv4()
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
   * A l'initialisation préparation des événements de type click ou mouse pour l'apparition du tooltips
   */
  ngOnInit() {
    if (this.onClick) {
      this.onClick.addEventListener('click', (e: any) => {
        this.changeVisibility(!this.tooltipsIsVisible)
      })

      this.elementRef.nativeElement.addEventListener('mouseleave', (e: any) => {
        // this.changeVisibility(false)
      })
    }

    this.appService.tooltipsOpenId.subscribe((id) => {
      if (id && id !== this.id) {
        this.changeVisibility(false)
      }
    })
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
          this.changeVisibility(true)
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

        this.changeVisibility(false)
      })
      this.elementRef.nativeElement?.addEventListener('click', (e: any) => {
        e.stopPropagation()
      })
    }
  }

  /**Change visibility of tooltips */
  changeVisibility(status: boolean) {
    this.tooltipsIsVisible = status

    if (!status && this.appService.tooltipsOpenId.getValue() === this.id) {
      this.appService.tooltipsOpenId.next(null)
    } else if (status) {
      this.appService.tooltipsOpenId.next(this.id)
    }
  }
}
