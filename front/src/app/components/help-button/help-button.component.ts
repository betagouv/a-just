
import { Component, Input } from '@angular/core';

/**
 * Composant bouton d'aide
 */

@Component({
  selector: 'aj-help-button',
  standalone: true,
  imports: [],
  templateUrl: './help-button.component.html',
  styleUrls: ['./help-button.component.scss'],
})
export class HelpButtonComponent {
  @Input() text: string | undefined;
  isChildVisible: boolean = false;
}
