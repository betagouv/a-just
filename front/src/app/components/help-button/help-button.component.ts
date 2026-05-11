import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'

/**
 * Composant bouton d'aide
 */

@Component({
  selector: 'aj-help-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help-button.component.html',
  styleUrls: ['./help-button.component.scss'],
})
export class HelpButtonComponent {
  @Input() text: string | undefined
  @Input() canShowChildren: boolean = true
  @Input() backgroundColor: string = '#000091'
  isChildVisible: boolean = false
}
