import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'

/**
 * Composant de génération des tooltips
 */

@Component({
  selector: 'aj-completion-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './completion-bar.component.html',
  styleUrls: ['./completion-bar.component.scss'],
})
export class CompletionBarComponent {
  /**
   * Valeur du pourcentage
   */
  @Input() value: number = 0
}
