import { Component, Input, inject } from '@angular/core'
import { IntroJSStep, TourService } from '../../services/tour/tour.service'

/**
 * Composant bouton de tour
 */

@Component({
  selector: 'aj-tour-button',
  standalone: true,
  imports: [],
  templateUrl: './tour-button.component.html',
  styleUrls: ['./tour-button.component.scss'],
})
export class TourButtonComponent {
  /**
   * Service de gestion des tours
   */
  tourService = inject(TourService)
  /**
   * Text du tour
   */
  @Input() text: string = 'Démo.'
  /**
   * Boolean de visibilité du tour
   */
  isChildVisible: boolean = false

  /**
   * Tours à afficher
   */
  @Input() tours: IntroJSStep[] = []

  /**
   * Initialise le tour
   */
  ngAfterViewInit() {
    this.tourService.initTour(this.tours)
  }

  /**
   * Démarre le tour
   */
  startTour() {
    this.tourService.startPlayer()
  }
}
