
import { Component } from '@angular/core';

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  selector: 'panorama-alert',
  standalone: true,
  imports: [],
  templateUrl: './panorama-alert.component.html',
  styleUrls: ['./panorama-alert.component.scss'],
})
export class PanoramaAlertComponent {
  /**
   * Show hide this view
   */
  showPanel: boolean = true;
}
