import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
} from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceSelectedInterface } from '../workforce.page'
import { FilterPanelInterface } from '../filter-panel/filter-panel.component'

/**
 * Paneau d'une fiche magistrat / fonctionnaire / contractuel
 */
@Component({
  selector: 'person-preview',
  templateUrl: './person-preview.component.html',
  styleUrls: ['./person-preview.component.scss'],
})
export class PersonPreviewComponent extends MainClass implements AfterViewInit {
  /**
   * Fiche
   */
  @Input() hr: HumanResourceSelectedInterface = {
    opacity: 1,
    etpLabel: '',
    hasIndisponibility: 0,
    currentActivities: [],
    etp: 1,
    category: null,
    fonction: null,
    currentSituation: null,
    id: 0,
    situations: [],
    indisponibilities: [],
    updatedAt: new Date(),
  }
  /**
   * Filtre utilisateur
   */
  @Input() filterParams: FilterPanelInterface | null = null
  /**
   * Categorie text color
   */
  @Input() textColor: string = ''
  /**
   * Dom parent
   */
  @Input() parentDom: HTMLDivElement | null = null
  /**
   * Show component is visible
   */
  showComponent: boolean = false
  /**
   * Interval to folow update of component
   */
  timeoutCatcher: any = null
  /**
   * Timeout to folow update of component
   */
  intervalCatcher: any = null

  /**
   * Constructeur
   */
  constructor(private nativeElement: ElementRef) {
    super()
  }

  /**
   * After DOM is create fetch event
   */
  ngAfterViewInit() {
    if (this.parentDom) {
      this.parentDom.addEventListener(
        'scroll',
        this.delayScroolEvent.bind(this)
      )

      this.intervalCatcher = setInterval(() => {
        this.checkScrollEvent()
      }, 2000)

      this.checkScrollEvent()
    }
  }

  /**
   * Listen when object is removed
   */
  ngOnDestroy() {
    this.removeScrollEvent()
  }

  /**
   * Delai before renderer
   */
  delayScroolEvent() {
    if (this.timeoutCatcher) {
      clearTimeout(this.timeoutCatcher)
    }

    this.timeoutCatcher = setTimeout(() => {
      this.checkScrollEvent()
      this.timeoutCatcher = null
    }, 50)
  }

  /**
   * Remove scroll event
   */
  removeScrollEvent() {
    if (this.parentDom) {
      this.parentDom.removeEventListener(
        'scroll',
        this.checkScrollEvent.bind(this),
        true
      )
    }

    if(this.intervalCatcher) {
      clearInterval(this.intervalCatcher)
      this.intervalCatcher = null
    }
  }

  /**
   * Control position of element
   */
  checkScrollEvent() {
    if (
      !this.showComponent &&
      this.nativeElement &&
      this.nativeElement.nativeElement &&
      this.parentDom
    ) {
      const { top: topElement } =
        this.nativeElement.nativeElement.getBoundingClientRect()
      const { bottom: bottomParent } = this.parentDom.getBoundingClientRect()
      const marginTopLoad = 500

      if (topElement - marginTopLoad < bottomParent) {
        this.showComponent = true
        this.removeScrollEvent()
      }
    }
  }
}
