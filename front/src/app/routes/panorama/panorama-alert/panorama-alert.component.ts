import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  selector: 'panorama-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panorama-alert.component.html',
  styleUrls: ['./panorama-alert.component.scss'],
})
export class PanoramaAlertComponent {
  /**
   * Show hide this view
   */
  showPanel: boolean = true;
}
