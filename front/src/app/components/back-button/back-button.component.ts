import { Location } from '@angular/common'
import { Component, inject, Input } from '@angular/core'
import { RouterLink } from '@angular/router'

/**
 * Back button generic component
 */
@Component({
  selector: 'aj-back-button',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss'],
})
export class BackButtonComponent {
  /**
   * Location
   */
  _location = inject(Location)
  /**
   * Router link
   */
  @Input() routerLink: any
  /**
   * Fragment
   */
  @Input() fragment: any
  /**
   * Text
   */
  @Input() text: string = 'Retour'

  /**
   * On click
   */
  onClick() {
    if (this.routerLink === 'back') {
      this._location.back()
    }
  }
}
